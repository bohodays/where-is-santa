// 산타 상태(santaAt의 결과)를 사람이 읽는 문장으로. 지도 위 알약(SantaLocationBanner)이 쓴다.
// 순수 함수: 지금 시각은 인자로 받는다.

import { formatRemaining } from "./format";
import type { SantaState } from "./santa";

const MIN = 60_000;
/**
 * 두 도시가 이보다 멀면 "A에서 B로 가는 중", 가까우면 가까운 쪽 도시 이름으로 "○○ 상공".
 * 시간이 아니라 거리로 정한다. 도착 시각은 경도로만 정해져서, 남북으로 먼 도시(베이징 → 홍콩)도 몇 분이면 닿기 때문이다.
 */
export const NEAR_KM = 300;
const EARTH_RADIUS_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** 두 지점 사이 지구 표면 거리(km). 하버사인 공식 */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type SantaDescription = {
  /** 위 줄. 화면 낭독기가 읽는다(aria-live). 도시나 상태가 바뀔 때만 바뀌고, 시간이 흐른다고 바뀌지 않는다 */
  headline: string;
  /** 아래 줄. 남은 시간이 들어가 1분마다 바뀐다. 화면 낭독기가 읽지 않게 aria-live 밖에 둔다 */
  detail: string | null;
};

const HANGUL_FIRST = 0xac00; // "가"
const HANGUL_LAST = 0xd7a3; // "힣"
const JONG_COUNT = 28; // 받침 종류(없음 포함)
const JONG_RIEUL = 8; // ㄹ 받침 번호

/**
 * 이름 뒤에 "로"·"으로"를 붙인다. 받침이 없거나 ㄹ 받침이면 "로", 그 밖의 받침이면 "으로".
 * 한글 글자 코드는 (초성 × 21 + 중성) × 28 + 종성 순서라, (코드 − "가") % 28 이 받침 번호다.
 * 한글로 끝나지 않으면 판단할 수 없어 "(으)로".
 */
export function withRo(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (!(code >= HANGUL_FIRST && code <= HANGUL_LAST)) return `${name}(으)로`;
  const jong = (code - HANGUL_FIRST) % JONG_COUNT;
  return jong === 0 || jong === JONG_RIEUL ? `${name}로` : `${name}으로`;
}

/** "19분 뒤". 1분이 안 남으면 "곧"("1분 이내 뒤"는 어색하다) */
function untilText(ms: number): string {
  return ms < MIN ? "곧" : `${formatRemaining(ms)} 뒤`;
}

export function describeSanta(santa: SantaState, now: number): SantaDescription {
  const { status, prev, next } = santa;

  if (status === "before") {
    return {
      headline: "산타는 북극에서 출발 준비 중",
      detail: next ? `첫 도착: ${next.name}, ${untilText(next.arriveUtc - now)}` : null,
    };
  }
  if (status === "after" || !prev) {
    return { headline: "산타는 북극으로 돌아갔어요", detail: null };
  }

  const detail = next
    ? `다음 도착: ${next.name}, ${untilText(next.arriveUtc - now)}`
    : "마지막 도시예요";

  if (status === "visiting" || !next) {
    return { headline: `지금 산타는 ${prev.name}에서 선물 배달 중`, detail };
  }

  // 비행 중
  if (distanceKm(prev, next) > NEAR_KM) {
    return { headline: `지금 산타는 ${prev.name}에서 ${withRo(next.name)} 가는 중`, detail };
  }
  const nearer = santa.progress < 0.5 ? prev : next;
  return { headline: `지금 산타는 ${nearer.name} 상공`, detail };
}
