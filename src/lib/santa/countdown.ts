// 우리 동네 카운트다운의 상태. CountdownCard가 쓴다. 순수 함수: 지금 시각은 인자로 받는다.

const MIN = 60_000;

/**
 * 도착한 뒤 "산타가 왔어요"를 보여주는 시간.
 * 산타가 도시에 머무는 시간(DWELL_MS, 30초)보다 길게 둔다. 30초면 화면을 보고 있어도 놓치기 쉽다.
 */
export const ARRIVED_FOR_MS = 5 * MIN;

export type HomeCountdown =
  | { kind: "waiting"; remainingMs: number } // 도착 전
  | { kind: "arrived" } // 막 도착함(ARRIVED_FOR_MS 동안)
  | { kind: "visited" }; // 다녀감

export function homeCountdown(now: number, arriveUtc: number): HomeCountdown {
  if (now < arriveUtc) return { kind: "waiting", remainingMs: arriveUtc - now };
  if (now < arriveUtc + ARRIVED_FOR_MS) return { kind: "arrived" };
  return { kind: "visited" };
}
