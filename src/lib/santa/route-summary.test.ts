// 첫 화면용 요약(route-summary.ts)이 전체 경로와 맞는지 검사한다.
// 경로 데이터를 다시 만들어 첫 도시·마지막 도시가 바뀌면 여기서 실패하고, 메시지에 새 값이 나온다.
import { test } from "vitest";
import assert from "node:assert/strict";
import { buildRoute } from "./route";
import { ROUTE_SUMMARY, ROUTE_YEAR } from "./route-summary";
import { DWELL_MS, journeyPhase, santaAt } from "./santa";
import { DEFAULT_HOME_ID, STOPS } from "./stops";

const route = buildRoute(STOPS, ROUTE_YEAR);
const first = route[0];
const last = route[route.length - 1];
const home = route.find((s) => s.id === DEFAULT_HOME_ID)!;
const MIN = 60_000;

test("요약의 첫 도착·마지막 도착·기본 동네가 전체 경로와 같다", () => {
  const show = (s: typeof first) =>
    `{ id: "${s.id}", name: "${s.name}", lat: ${s.lat}, lon: ${s.lon}, utcOffset: ${s.utcOffset} }`;
  for (const [key, expected] of [
    ["first", first],
    ["last", last],
    ["defaultHome", home],
  ] as const) {
    const got = ROUTE_SUMMARY[key];
    assert.deepEqual(
      { id: got.id, name: got.name, lat: got.lat, arriveUtc: got.arriveUtc },
      { id: expected.id, name: expected.name, lat: expected.lat, arriveUtc: expected.arriveUtc },
      `route-summary.ts의 ${key}를 ${show(expected)}로 고친다`,
    );
  }
});

test("journeyPhase는 전체 경로로 계산한 santaAt의 상태와 같다", () => {
  const { first: f, last: l } = ROUTE_SUMMARY;
  const times = [
    f.arriveUtc - 1,
    f.arriveUtc,
    f.arriveUtc + 30 * MIN,
    l.arriveUtc,
    l.arriveUtc + DWELL_MS - 1,
    l.arriveUtc + DWELL_MS,
  ];
  // 여정 전체를 7분 간격으로도 훑는다
  for (let t = f.arriveUtc - 60 * MIN; t <= l.arriveUtc + 60 * MIN; t += 7 * MIN) times.push(t);
  for (const t of times) {
    const status = santaAt(t, route).status;
    const expected = status === "visiting" || status === "flying" ? "journey" : status;
    assert.equal(journeyPhase(t, f.arriveUtc, l.arriveUtc), expected, new Date(t).toISOString());
  }
});
