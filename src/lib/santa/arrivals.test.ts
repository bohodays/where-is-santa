import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { arrivalRows, type ArrivalRow } from "./arrivals";
import type { City } from "./cities";
import { buildRoute } from "./route";
import { santaAt } from "./santa";

// 경도 1도 = 4분 간격으로 도착하는 가짜 도시 12곳(A가 먼저). 우리 동네는 J(10번째)
const cities: City[] = "ABCDEFGHIJKL".split("").map((name, i) => ({
  id: name,
  name,
  lat: 35,
  lon: 140 - i,
  utcOffset: 9,
}));
const route = buildRoute(cities, 2026);
const at = (id: string) => route.find((s) => s.id === id)!.arriveUtc;
const HOME = "J";
/** 행을 짧은 글자로: 지나감 "A·", 지금 "▶", 예정 "E", 우리 동네 "J*", 건너뜀 "…3" */
const show = (rows: ArrivalRow[]) =>
  rows
    .map((r) =>
      r.kind === "gap"
        ? `…${r.hidden}`
        : r.kind === "now"
          ? "▶"
          : `${r.stop.id}${r.passed ? "·" : ""}${r.isHome ? "*" : ""}`,
    )
    .join(" ");
const rows = (now: number, after = 3) => show(arrivalRows(now, route, HOME, { before: 2, after }));

describe("arrivalRows: 도착 순서 목록에 보일 줄", () => {
  test("출발 전: 첫 도시부터 예정 목록, 지금 줄 없음, 멀리 있는 우리 동네는 건너뛰고 따로", () => {
    assert.equal(rows(at("A") - 60_000), "A B C …6 J*");
  });

  test("여정 중: 지난 도시 2곳, 지금, 다음 도시 3곳, 그리고 우리 동네", () => {
    assert.equal(rows(at("E") + 60_000), "D· E· ▶ F G H …1 J*");
  });

  test("우리 동네가 다음 도시 안에 들면 건너뜀 없이 그 자리에", () => {
    assert.equal(rows(at("H") + 60_000), "G· H· ▶ I J* K");
  });

  test("우리 동네를 지난 뒤에는 지난 도시로 표시", () => {
    assert.equal(rows(at("J") + 60_000), "I· J·* ▶ K L");
  });

  test("다음 도시 더 보기: 보일 다음 도시 수를 늘린다", () => {
    assert.equal(rows(at("B") + 60_000, 3), "A· B· ▶ C D E …4 J*");
    assert.equal(rows(at("B") + 60_000, 10), "A· B· ▶ C D E F G H I J* K L");
  });

  test("끝난 뒤: 지난 도시만, 지금 줄 없음", () => {
    assert.equal(rows(at("L") + 3_600_000), "K· L·");
  });

  test('지금 줄은 santaAt의 상태를 함께 준다("지금" 줄 글자에 쓴다)', () => {
    const now = at("E") + 60_000;
    const row = arrivalRows(now, route, HOME).find((r) => r.kind === "now");
    assert.deepEqual(row, { kind: "now", santa: santaAt(now, route) });
  });
});
