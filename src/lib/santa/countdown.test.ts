import { test } from "vitest";
import assert from "node:assert/strict";
import { ARRIVED_FOR_MS, homeCountdown } from "./countdown";

const MIN = 60_000;
const ARRIVE = Date.UTC(2026, 11, 24, 15, 32); // 서울 도착 근처(한국 시각 밤 12시 32분)

test("도착 전에는 남은 시간을 준다", () => {
  assert.deepEqual(homeCountdown(ARRIVE - 27 * MIN, ARRIVE), {
    kind: "waiting",
    remainingMs: 27 * MIN,
  });
  assert.deepEqual(homeCountdown(ARRIVE - 1, ARRIVE), { kind: "waiting", remainingMs: 1 });
});

test("도착한 순간부터 잠시 동안은 '왔어요'", () => {
  assert.deepEqual(homeCountdown(ARRIVE, ARRIVE), { kind: "arrived" });
  assert.deepEqual(homeCountdown(ARRIVE + ARRIVED_FOR_MS - 1, ARRIVE), { kind: "arrived" });
});

test("그 뒤로는 '다녀갔어요'", () => {
  assert.deepEqual(homeCountdown(ARRIVE + ARRIVED_FOR_MS, ARRIVE), { kind: "visited" });
  assert.deepEqual(homeCountdown(ARRIVE + 3 * 60 * MIN, ARRIVE), { kind: "visited" });
});

test("'왔어요'는 5분 동안 보인다", () => {
  assert.equal(ARRIVED_FOR_MS, 5 * MIN);
});
