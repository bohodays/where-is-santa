import { test } from "vitest";
import assert from "node:assert/strict";
import { CITIES } from "./cities";
import { buildRoute } from "./route";
import { santaAt, timeUntil } from "./santa";
import {
  MAX_ROUND_TRIP_MS,
  MIN_OFFSET_MS,
  DEMO_BOOT_SCRIPT,
  DEMO_LEAD_MS,
  clockNow,
  demoOffered,
  demoSearch,
  demoSpeedLabel,
  estimateClockOffset,
  nearestDemoSpeed,
  parseClockConfig,
  retimeDemoClock,
  startDemoClock,
  toKstIso,
  withOffset,
} from "./clock";
import { ROUTE_SUMMARY } from "./route-summary";

const SEC = 1_000;
const MIN = 60_000;
const route = buildRoute(CITIES, 2026);
/** 한국 시각(KST)을 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0, s = 0) =>
  Date.UTC(2026, m - 1, d, h - 9, min, s);

/** 진짜 시각 trueAt에 HEAD 요청을 보냈을 때, 기기 시계가 skew만큼 틀린 폰에서 보이는 값 */
function sample(trueAt: number, skew: number, roundTrip = 200) {
  const serverAt = trueAt + roundTrip / 2; // 서버가 응답을 만든 진짜 시각
  return {
    sentAt: trueAt + skew,
    receivedAt: trueAt + roundTrip + skew,
    serverDate: new Date(serverAt).toUTCString(), // Date 헤더는 초 단위로 잘린다
  };
}

// ---- 데모 주소 해석 ----

test("주소에 demo가 없으면 실제 시각, 보정값 0", () => {
  assert.deepEqual(parseClockConfig("", 1000), { mode: "real", offsetMs: 0 });
  assert.deepEqual(parseClockConfig("?speed=60", 1000), { mode: "real", offsetMs: 0 });
});

test("demo 시각과 배속을 읽는다", () => {
  const config = parseClockConfig("?demo=2026-12-25T00:20:00%2B09:00&speed=60", 5000);
  assert.deepEqual(config, {
    mode: "demo",
    startAt: kst(12, 25, 0, 20),
    speed: 60,
    realStartAt: 5000,
  });
});

test("배속이 없거나 0·음수·숫자가 아니면 1배속이다 (음수면 시간이 거꾸로 흐르던 버그)", () => {
  for (const speed of ["", "&speed=0", "&speed=-60", "&speed=abc", "&speed=Infinity"]) {
    const config = parseClockConfig(`?demo=2026-12-25T00:20:00%2B09:00${speed}`, 0);
    assert.equal(config.mode === "demo" && config.speed, 1, `speed 값: "${speed}"`);
  }
});

test("demo 시각을 읽을 수 없으면 실제 시각으로 연다", () => {
  assert.deepEqual(parseClockConfig("?demo=크리스마스&speed=60", 0), { mode: "real", offsetMs: 0 });
});

// ---- 시각 계산 ----

test("실제 시각 = 기기 시각 + 보정값", () => {
  assert.equal(clockNow({ mode: "real", offsetMs: 0 }, 1_000_000), 1_000_000);
  assert.equal(clockNow({ mode: "real", offsetMs: 10 * MIN }, 1_000_000), 1_000_000 + 10 * MIN);
});

test("데모 시각은 시작 시각부터 배속으로 흐른다", () => {
  const config = parseClockConfig("?demo=2026-12-25T00:20:00%2B09:00&speed=60", 5000);
  assert.equal(clockNow(config, 5000), kst(12, 25, 0, 20));
  assert.equal(clockNow(config, 5000 + 10 * SEC), kst(12, 25, 0, 30)); // 10초 × 60배 = 10분
});

test("데모 모드는 기기 시계 보정과 상관없다", () => {
  const config = parseClockConfig("?demo=2026-12-25T00:20:00%2B09:00&speed=60", 5000);
  assert.deepEqual(withOffset(config, 10 * MIN), config);
  assert.deepEqual(withOffset({ mode: "real", offsetMs: 0 }, 10 * MIN), {
    mode: "real",
    offsetMs: 10 * MIN,
  });
});

// ---- 서버 시각으로 보정값 구하기 ----

test("기기 시계가 맞으면 보정하지 않는다 (Date 헤더의 초 단위 오차는 무시)", () => {
  for (const ms of [0, 1, 499, 500, 999]) {
    const offset = estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + ms, 0));
    assert.equal(offset, 0, `서버 밀리초 ${ms}`);
  }
});

test("기기 시계가 5분 느리면 +5분, 3분 빠르면 -3분 보정한다 (오차 1초 이내)", () => {
  const slow = estimateClockOffset(sample(kst(12, 24, 23, 0, 0), -5 * MIN));
  const fast = estimateClockOffset(sample(kst(12, 24, 23, 0, 0), 3 * MIN));
  assert.ok(slow !== null && Math.abs(slow - 5 * MIN) <= SEC, `느린 폰 보정값 ${slow}`);
  assert.ok(fast !== null && Math.abs(fast + 3 * MIN) <= SEC, `빠른 폰 보정값 ${fast}`);
});

test(`보정 기준 ${MIN_OFFSET_MS / SEC}초: 그보다 작은 차이는 무시하고 넘으면 보정한다`, () => {
  assert.equal(estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + 500, -1 * SEC)), 0);
  const offset = estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + 500, -3 * SEC));
  assert.ok(offset !== null && Math.abs(offset - 3 * SEC) <= SEC, `보정값 ${offset}`);
});

test(`왕복이 ${MAX_ROUND_TRIP_MS / SEC}초를 넘거나 거꾸로면 그 측정은 버린다`, () => {
  assert.equal(
    estimateClockOffset(sample(kst(12, 24, 23, 0, 0), -5 * MIN, MAX_ROUND_TRIP_MS + 1)),
    null,
  );
  assert.equal(
    estimateClockOffset({ sentAt: 2000, receivedAt: 1000, serverDate: new Date(0).toUTCString() }),
    null,
  );
});

test("Date 헤더가 없거나 읽을 수 없으면 버린다", () => {
  assert.equal(estimateClockOffset({ sentAt: 0, receivedAt: 100, serverDate: null }), null);
  assert.equal(estimateClockOffset({ sentAt: 0, receivedAt: 100, serverDate: "어제" }), null);
});

// ---- 그 시각을 재현: 기기 시계가 틀린 폰의 이브 밤 ----

test("기기 시계가 10분 느린 폰에서도 보정하면 산타 위치와 서울 카운트다운이 맞다", () => {
  const trueNow = kst(12, 24, 23, 40); // 서울 도착 52분 전
  const skew = -10 * MIN;
  const offset = estimateClockOffset(sample(trueNow, skew));
  assert.ok(offset !== null);

  const deviceNow = trueNow + skew;
  const uncorrected = clockNow({ mode: "real", offsetMs: 0 }, deviceNow);
  const corrected = clockNow({ mode: "real", offsetMs: offset }, deviceNow);

  // 보정하지 않으면 카운트다운이 10분 늘어난다
  assert.equal(
    timeUntil("seoul", uncorrected, route) - timeUntil("seoul", trueNow, route),
    10 * MIN,
  );
  // 보정하면 진짜 시각과 1초 안으로 맞는다
  assert.ok(
    Math.abs(timeUntil("seoul", corrected, route) - timeUntil("seoul", trueNow, route)) <= SEC,
  );
  assert.equal(santaAt(corrected, route).next?.id, santaAt(trueNow, route).next?.id);
});

// ---- 데모 모드: 시간 이동, 배속 바꾸기, 주소 ----

test("이브 밤으로 시간 이동: 우리 동네 도착 20분 전부터 1초=1분이면 20초 뒤 도착", () => {
  const arrive = kst(12, 24, 23, 50);
  const config = startDemoClock(arrive, 60, 5_000);
  assert.equal(DEMO_LEAD_MS, 20 * MIN);
  assert.equal(clockNow(config, 5_000), arrive - 20 * MIN);
  assert.equal(clockNow(config, 5_000 + 20 * SEC), arrive);
});

test("배속을 바꿔도 데모 시각이 튀지 않고 이어서 흐른다", () => {
  const start = startDemoClock(kst(12, 24, 23, 50), 60, 0);
  const at = 10 * SEC; // 실제로 10초 지남 → 데모로 10분 지남
  const before = clockNow(start, at);
  const faster = retimeDemoClock(start, 600, at);
  assert.equal(clockNow(faster, at), before);
  assert.equal(clockNow(faster, at + SEC), before + 10 * MIN);
  // 실제 모드는 그대로
  const real = { mode: "real", offsetMs: 300 } as const;
  assert.equal(retimeDemoClock(real, 600, at), real);
});

test("toKstIso: 한국 시각 ISO, 초 단위 버림, 다시 읽으면 같은 시각", () => {
  const t = kst(12, 24, 23, 46, 5) + 999;
  assert.equal(toKstIso(t), "2026-12-24T23:46:05+09:00");
  assert.equal(Date.parse(toKstIso(t)), t - 999);
  assert.equal(toKstIso(kst(12, 25, 0, 0)), "2026-12-25T00:00:00+09:00");
});

test("demoSearch: 데모는 지금 데모 시각과 배속을 쓰고, 실제는 지운다. 다른 검색어는 둔다", () => {
  const config = startDemoClock(kst(12, 24, 23, 50), 60, 0);
  const search = demoSearch("?ref=share", config, 30 * SEC); // 23:30에서 데모로 30분 지남
  const params = new URLSearchParams(search);
  assert.equal(params.get("ref"), "share");
  assert.equal(params.get("demo"), "2026-12-25T00:00:00+09:00");
  assert.equal(params.get("speed"), "60");
  // 쓴 주소를 다시 읽으면 같은 시각·배속의 데모 시계
  const again = parseClockConfig(search, 0);
  assert.equal(again.mode, "demo");
  assert.equal(clockNow(again, 0), clockNow(config, 30 * SEC));

  const real = { mode: "real", offsetMs: 0 } as const;
  assert.equal(demoSearch(search, real, 0), "?ref=share");
  assert.equal(demoSearch("?demo=2026-12-25T00:20:00%2B09:00&speed=60", real, 0), "");
});

test("nearestDemoSpeed·demoSpeedLabel: 선택지 밖 배속은 가까운 선택지로", () => {
  assert.equal(nearestDemoSpeed(1), 1);
  assert.equal(nearestDemoSpeed(60), 60);
  assert.equal(nearestDemoSpeed(30), 60);
  assert.equal(nearestDemoSpeed(5), 1);
  assert.equal(nearestDemoSpeed(3600), 600);
  assert.equal(demoSpeedLabel(60), "1초 = 1분");
  assert.equal(demoSpeedLabel(600), "1초 = 10분");
  assert.equal(demoSpeedLabel(1), "실제 속도");
  assert.equal(demoSpeedLabel(30), "30배 빠르게");
});

test("demoOffered: 진짜 이브(출발 24시간 전~여정 끝)에는 권하지 않는다", () => {
  const depart = ROUTE_SUMMARY.first.arriveUtc;
  const end = ROUTE_SUMMARY.last.arriveUtc;
  const real = { mode: "real", offsetMs: 0 } as const;
  assert.equal(demoOffered(real, kst(11, 22, 12), depart, end), true);
  assert.equal(demoOffered(real, depart - 24 * 60 * MIN - 1, depart, end), true);
  assert.equal(demoOffered(real, kst(12, 24, 17), depart, end), false); // 출발 전 당일
  assert.equal(demoOffered(real, depart + MIN, depart, end), false); // 여정 중
  assert.equal(demoOffered(real, end + MIN, depart, end), true); // 끝난 뒤 "다시 보기"
  const demo = startDemoClock(kst(12, 24, 23, 50), 60, 0);
  assert.equal(demoOffered(demo, depart + MIN, depart, end), true);
});

test("DEMO_BOOT_SCRIPT: parseClockConfig가 데모로 읽는 주소일 때만 data-demo=on", () => {
  const cases = [
    "",
    "?speed=60",
    "?demo=",
    "?demo=어제",
    "?demo=2026-12-25T00:20:00%2B09:00",
    "?demo=2026-12-25T00:20:00%2B09:00&speed=60",
    "?demo=2026-12-24T23:30:00+09:00", // +가 공백이 되어 읽지 못한다(두 쪽 모두)
    "?demo=2026-12-24",
    "?ref=x&demo=2026-12-24T15:00:00Z",
  ];
  for (const search of cases) {
    const attrs: Record<string, string> = {};
    new Function("location", "document", DEMO_BOOT_SCRIPT)(
      { search },
      { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    );
    const expected = parseClockConfig(search, 0).mode === "demo" ? { "data-demo": "on" } : {};
    assert.deepEqual(attrs, expected, search);
  }
});
