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

/** 도시에서 떠나는 시각. 다음 도시까지 시간이 짧으면 머무는 시간을 절반으로 줄인다 */
function departAt(stop: Stop, next: Stop): number {
  return stop.arriveUtc + Math.min(DWELL_MS, (next.arriveUtc - stop.arriveUtc) / 2);
}

/**
 * 부드럽게 하기 전의 위도: 머무는 동안은 그 도시, 비행 중에는 두 도시 사이를 진행률만큼(시간에 대해 꺾은선).
 * 여정 앞뒤로는 첫 도시·마지막 도시 위도로 이어 둔다(평균 창이 여정 밖으로 나갈 때).
 */
function pathLat(t: number, route: Stop[]): number {
  const i = lastArrivedIndex(route, t);
  if (i === -1) return route[0].lat;
  const prev = route[i];
  const next = route[i + 1];
  if (!next) return prev.lat;
  const leave = departAt(prev, next);
  if (t <= leave) return prev.lat;
  return prev.lat + ((next.lat - prev.lat) * (t - leave)) / (next.arriveUtc - leave);
}

/*
 * 산타가 화면에 보이는 위도를 부드럽게 한다(결정 2026-11-22, docs/components.md SantaMap).
 * 도착이 경도로만 정해져서, 도시가 촘촘한 곳(한국: 25분에 261곳)에서는 위도가 1~6초마다 위아래로 바뀌어 떨려 보인다.
 *
 * "가까운 위도끼리만 평균"한다(이미지 처리의 양방향 필터). 지금을 가운데로 시간 폭 안의 위도를 평균하되,
 * 지금 위도와 차이가 큰 값일수록 덜 센다. 그래서
 * - 한국처럼 위도가 모여 있는 곳(33~38.5도)은 서로 평균되어 떨리지 않고
 * - 런던(51도) 옆에 서아프리카(5도)가 1~2분 간격으로 끼어 있어도 섞이지 않아 런던에 도착할 때 런던 가까이에 있다
 *
 * 값은 실제 경로로 재서 정했다(세계 지도 확대 1 기준):
 * | 방식 | 한국 위 1px 넘는 흔들림 | 도착 순간 어긋남 중앙값 / 상위 10% | 런던 |
 * | 부드럽게 안 함 | 137번 | 0 / 0px | 0px |
 * | 그냥 2분 평균 | 9번 | 5 / 57px | 93px |
 * | 가까운 위도만 5분·8도 | 8번 | 3 / 9px | 15px |
 */
/** 평균을 내는 시간 폭. 가운데가 가장 크고 양 끝이 0인 삼각형 가중치라, 창이 움직여도 값이 튀지 않는다 */
export const LAT_SMOOTH_MS = 5 * 60_000;
/** 위도 차이가 이 정도면 가중치가 약 3분의 1(가우스 e^-1). 한국 전체(약 5.5도)는 서로 섞이고, 수십 도 떨어진 곳은 섞이지 않는다 */
export const LAT_SMOOTH_DEG = 8;
/** 평균을 낼 때 위도를 읽는 간격. 시각에 고정된 눈금(1초 배수)이라 같은 시각이면 늘 같은 값이 나온다 */
const SAMPLE_MS = 1_000;

export function smoothLat(
  now: number,
  route: Stop[],
  windowMs = LAT_SMOOTH_MS,
  rangeDeg = LAT_SMOOTH_DEG,
): number {
  const center = pathLat(now, route);
  if (windowMs <= 0) return center;
  const half = windowMs / 2;
  let weightSum = 0;
  let valueSum = 0;
  for (let k = Math.ceil((now - half) / SAMPLE_MS); k * SAMPLE_MS <= now + half; k++) {
    const t = k * SAMPLE_MS;
    const lat = pathLat(t, route);
    const inTime = 1 - Math.abs(t - now) / half; // 삼각형: 가운데 1, 양 끝 0
    const nearLat = Math.exp(-(((lat - center) / rangeDeg) ** 2)); // 가우스: 위도가 멀수록 0에 가깝게
    weightSum += inTime * nearLat;
    valueSum += inTime * nearLat * lat;
  }
  return weightSum > 0 ? valueSum / weightSum : center;
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
      lat: visiting ? smoothLat(now, route) : NORTH_POLE.lat,
      lon: visiting ? last.lon : NORTH_POLE.lon,
      prev,
      next: null,
      progress: visiting ? 0 : 1,
      visitedCount,
    };
  }

  // 위도는 늘 부드럽게 한 값(smoothLat). 도시가 촘촘한 곳에서 위아래로 떨리지 않게 한다
  const lat = smoothLat(now, route);
  const leave = departAt(prev, next);

  if (now < leave) {
    return {
      status: "visiting",
      lat,
      lon: prev.lon,
      prev,
      next,
      progress: 0,
      visitedCount,
    };
  }

  // 비행 중에는 자정선을 탄다(결정 2026-11-22, docs/components.md SantaMap).
  // 경도 = 지금 자정인 경도. 다음 도시 도착 시각에 정확히 그 도시 경도에 닿고, 늘 서쪽으로 1시간에 15도씩 움직인다.
  // 위도 = 두 도시 사이를 진행률만큼 간 값을 시간에 걸쳐 평균(smoothLat). 대권으로 날면 남북으로 튀는 구간에서 지도를 가로지른다.
  // 연도 없이 계산한다: 자정선은 다음 도시 경도에서 남은 시간만큼 동쪽(1시간에 15도)이다.
  const progress = (now - leave) / (next.arriveUtc - leave);
  return {
    status: "flying",
    lat,
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
