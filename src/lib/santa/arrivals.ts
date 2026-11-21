// 도착 순서 목록(ArrivalList)에 보일 줄. 경로가 661곳이라 전부 보이지 않고 지금 앞뒤만 고른다. 순수 함수.

import type { Stop } from "./route";
import { santaAt, type SantaState } from "./santa";

export type ArrivalRow =
  | { kind: "stop"; stop: Stop; passed: boolean; isHome: boolean }
  | { kind: "now"; santa: SantaState } // 산타가 지금 있는 곳(여정 중에만)
  | { kind: "gap"; hidden: number }; // 다음 도시와 우리 동네 사이에 건너뛴 도시 수

type Options = {
  /** 지금 앞에 보일 지난 도시 수 */
  before?: number;
  /** 지금 뒤에 보일 다음 도시 수("다음 도시 더 보기"로 늘린다) */
  after?: number;
};

/**
 * 지난 도시 before곳, 지금, 다음 도시 after곳. 우리 동네가 그보다 뒤에 있으면 건너뛴 수와 함께 맨 끝에 붙인다.
 * - 출발 전: 지난 도시도 지금도 없이 첫 도시부터 예정 목록
 * - 끝난 뒤: 마지막 지난 도시들만
 */
export function arrivalRows(
  now: number,
  route: Stop[],
  homeId: string,
  { before = 2, after = 5 }: Options = {},
): ArrivalRow[] {
  const santa = santaAt(now, route);
  const visited = santa.visitedCount;
  const homeIndex = route.findIndex((s) => s.id === homeId);
  const row = (i: number): ArrivalRow => ({
    kind: "stop",
    stop: route[i],
    passed: i < visited,
    isHome: i === homeIndex,
  });

  const rows: ArrivalRow[] = [];
  for (let i = Math.max(0, visited - before); i < visited; i++) rows.push(row(i));
  if (santa.status === "visiting" || santa.status === "flying") rows.push({ kind: "now", santa });
  const end = Math.min(route.length, visited + after);
  for (let i = visited; i < end; i++) rows.push(row(i));
  if (homeIndex >= end) {
    if (homeIndex > end) rows.push({ kind: "gap", hidden: homeIndex - end });
    rows.push(row(homeIndex));
  }
  return rows;
}
