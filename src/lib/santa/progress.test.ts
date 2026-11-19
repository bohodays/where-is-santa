import { test } from "vitest";
import assert from "node:assert/strict";
import { CITIES } from "./cities";
import { buildRoute, type Stop } from "./route";
import { journeyProgress } from "./santa";

const route = buildRoute(CITIES, 2026);
/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0, s = 0) =>
  Date.UTC(2026, m - 1, d, h - 9, min, s);

test("출발 전은 0, 마지막 도착 뒤는 1", () => {
  assert.equal(journeyProgress(kst(11, 19, 21, 0), route), 0);
  assert.equal(journeyProgress(route[0].arriveUtc, route), 0);
  assert.equal(journeyProgress(route.at(-1)!.arriveUtc, route), 1);
  assert.equal(journeyProgress(kst(12, 26, 0, 0), route), 1);
});

test("한국 시각 밤 12시 5분이면 약 18% (시안의 장면)", () => {
  // 첫 도착(키리티마티) 12/24 10:29:26.4 UTC, 마지막 도착(파고파고) 12/25 11:22:48 UTC
  // 지난 시간 4시간 35분 33.6초(16533.6초) ÷ 전체 24시간 53분 21.6초(89601.6초) = 0.184524…
  const p = journeyProgress(kst(12, 25, 0, 5), route);
  assert.ok(Math.abs(p - 16533.6 / 89601.6) < 1e-6, `진행률 ${p}`);
  assert.equal(Math.round(p * 100), 18);
});

test("시간이 흐르면 진행률은 줄지 않는다", () => {
  let last = 0;
  for (
    let t = route[0].arriveUtc - 60_000;
    t <= route.at(-1)!.arriveUtc + 60_000;
    t += 10 * 60_000
  ) {
    const p = journeyProgress(t, route);
    assert.ok(p >= last && p >= 0 && p <= 1, `${new Date(t).toISOString()}: ${p}`);
    last = p;
  }
});

test("경로가 비었거나 도시가 하나뿐이어도 0~1 사이 값을 낸다", () => {
  assert.equal(journeyProgress(0, []), 0);
  const one: Stop[] = [route[0]];
  assert.equal(journeyProgress(route[0].arriveUtc - 1, one), 0);
  assert.equal(journeyProgress(route[0].arriveUtc, one), 1);
});
