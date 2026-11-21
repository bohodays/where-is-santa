import { wrapLongitude, type Stop } from "./route";

export const DWELL_MS = 30_000; // 도시마다 머무는 시간

export type SantaState = {
  status: "before" | "visiting" | "flying" | "after";
  lat: number;
  lon: number;
  prev: Stop | null; // 마지막으로 도착한 도시
  next: Stop | null; // 다음에 도착할 도시
  progress: number; // prev → next 비행 진행률 0~1
  visitedCount: number; // 도착 시각이 지난 도시 수
};

const NORTH_POLE = { lat: 90, lon: 0 };
const HOUR = 3_600_000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * 두 지점 사이 대권(지구 곡면 최단 경로) 위의 t 지점.
 * 산타 위치에는 쓰지 않는다(자정선을 탄다, santaAt). 확인 화면(scripts/build-preview.ts)이 지난 경로를 그릴 때 쓴다.
 */
export function greatCircle(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  t: number,
): { lat: number; lon: number } {
  const [φ1, λ1, φ2, λ2] = [rad(a.lat), rad(a.lon), rad(b.lat), rad(b.lon)];
  const v1 = [Math.cos(φ1) * Math.cos(λ1), Math.cos(φ1) * Math.sin(λ1), Math.sin(φ1)];
  const v2 = [Math.cos(φ2) * Math.cos(λ2), Math.cos(φ2) * Math.sin(λ2), Math.sin(φ2)];
  const dot = Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const ω = Math.acos(dot);
  if (ω < 1e-9) return { lat: a.lat, lon: a.lon };
  const s1 = Math.sin((1 - t) * ω) / Math.sin(ω);
  const s2 = Math.sin(t * ω) / Math.sin(ω);
  const [x, y, z] = [0, 1, 2].map((i) => s1 * v1[i] + s2 * v2[i]);
  return {
    lat: deg(Math.atan2(z, Math.hypot(x, y))),
    lon: deg(Math.atan2(y, x)),
  };
}

/** 도착 시각 ≤ now 인 마지막 도시의 인덱스 (없으면 -1). 이진 탐색 */
function lastArrivedIndex(route: Stop[], now: number): number {
  let lo = 0;
  let hi = route.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (route[mid].arriveUtc <= now) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** 시각을 넣으면 산타의 위치와 상태가 나온다. 순수 함수 */
export function santaAt(now: number, route: Stop[]): SantaState {
  const i = lastArrivedIndex(route, now);
  const first = route[0];
  const last = route[route.length - 1];

  if (i === -1) {
    return {
      status: "before",
      ...NORTH_POLE,
      prev: null,
      next: first,
      progress: 0,
      visitedCount: 0,
    };
  }

  const prev = route[i];
  const next = route[i + 1] ?? null;
  const visitedCount = i + 1;

  if (!next) {
    const visiting = now < last.arriveUtc + DWELL_MS;
    return {
      status: visiting ? "visiting" : "after",
      lat: visiting ? last.lat : NORTH_POLE.lat,
      lon: visiting ? last.lon : NORTH_POLE.lon,
      prev,
      next: null,
      progress: visiting ? 0 : 1,
      visitedCount,
    };
  }

  // 다음 도시까지 시간이 짧으면 머무는 시간을 절반으로 줄인다
  const gap = next.arriveUtc - prev.arriveUtc;
  const dwell = Math.min(DWELL_MS, gap / 2);
  const departAt = prev.arriveUtc + dwell;

  if (now < departAt) {
    return {
      status: "visiting",
      lat: prev.lat,
      lon: prev.lon,
      prev,
      next,
      progress: 0,
      visitedCount,
    };
  }

  // 비행 중에는 자정선을 탄다(결정 2026-11-22, docs/components.md SantaMap).
  // 경도 = 지금 자정인 경도. 다음 도시 도착 시각에 정확히 그 도시 경도에 닿고, 늘 서쪽으로 1시간에 15도씩 움직인다.
  // 위도 = 두 도시 사이를 진행률만큼. 도착이 경도로만 정해져 남북으로 크게 튀는 구간이 많아서, 대권으로 날면 지도를 가로지른다.
  // 연도 없이 계산한다: 자정선은 다음 도시 경도에서 남은 시간만큼 동쪽(1시간에 15도)이다.
  const progress = (now - departAt) / (next.arriveUtc - departAt);
  return {
    status: "flying",
    lat: prev.lat + (next.lat - prev.lat) * progress,
    lon: wrapLongitude(next.effLon + ((next.arriveUtc - now) / HOUR) * 15),
    prev,
    next,
    progress,
    visitedCount,
  };
}

/** 특정 도시 도착까지 남은 시간(ms). 이미 지났으면 0 */
export function timeUntil(cityId: string, now: number, route: Stop[]): number {
  const stop = route.find((s) => s.id === cityId);
  if (!stop) throw new Error(`경로에 없는 도시: ${cityId}`);
  return Math.max(0, stop.arriveUtc - now);
}

/** 전체 여정 진행률 0~1. 첫 도착이 0, 마지막 도착이 1 */
export function journeyProgress(now: number, route: Stop[]): number {
  if (route.length === 0) return 0;
  return progressBetween(now, route[0].arriveUtc, route[route.length - 1].arriveUtc);
}

/**
 * 진행률 0~1을 첫 도착(start)과 마지막 도착(end) 시각만으로 구한다.
 * 첫 화면은 전체 경로 없이 요약(route-summary.ts)만 가지고 있어서 이걸 쓴다.
 */
export function progressBetween(now: number, start: number, end: number): number {
  if (start === end) return now < start ? 0 : 1; // 도시가 하나뿐이면 도착 전 0, 도착 뒤 1
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

/**
 * 여정의 큰 단계: 출발 전 / 여정 중 / 끝남. 첫 도착과 마지막 도착 시각만으로 정한다.
 * santaAt(now, route).status와 같은 결과다(before ↔ before, visiting·flying ↔ journey, after ↔ after).
 * 마지막 도시에서도 DWELL_MS만큼 머문 뒤에 끝난다.
 */
export function journeyPhase(
  now: number,
  firstArriveUtc: number,
  lastArriveUtc: number,
): "before" | "journey" | "after" {
  if (now < firstArriveUtc) return "before";
  if (now < lastArriveUtc + DWELL_MS) return "journey";
  return "after";
}
