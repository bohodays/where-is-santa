// 시간대 경계 사례 테스트.
// 기대 시각은 코드 결과를 복사하지 않고 "도착 = 12/25 00:00 UTC − 보정 경도 ÷ 15시간"으로 직접 계산해 적었다.
import { test } from "vitest";
import assert from "node:assert/strict";
import { CITIES, type City } from "./cities";
import {
  buildRoute,
  effectiveLongitude,
  localClockHour,
  midnightLongitude,
  wrapLongitude,
  type Stop,
} from "./route";
import { santaAt, DWELL_MS } from "./santa";

const HOUR = 3_600_000;
const MIN = 60_000;
const YEAR = 2026;

const route = buildRoute(CITIES, YEAR);

// 샘플 53곳에 없는 경계 도시. 이 테스트 안에서만 쓴다.
const EDGE_CITIES: City[] = [
  { id: "uelen", name: "우엘렌", lat: 66.16, lon: -169.7, utcOffset: 12 }, // 서경이지만 러시아 시간
  { id: "chatham", name: "채텀", lat: -43.95, lon: -176.5, utcOffset: 13.75 }, // 45분 단위 + 날짜변경선
  { id: "taveuni", name: "타베우니", lat: -16.8, lon: -179.87, utcOffset: 12 }, // 180도 바로 동쪽의 피지
  { id: "attu", name: "애투", lat: 52.9, lon: 172.9, utcOffset: -10 }, // 동경이지만 미국 시간
  { id: "marquesas", name: "마르키즈", lat: -9.8, lon: -139.5, utcOffset: -9.5 }, // 음수 30분 단위
  { id: "stjohns", name: "세인트존스", lat: 47.56, lon: -52.71, utcOffset: -3.5 }, // 음수 30분 단위
];
const edgeRoute = buildRoute([...CITIES, ...EDGE_CITIES], YEAR);

function find(id: string, stops: Stop[] = route): Stop {
  const found = stops.find((s) => s.id === id);
  if (!found) throw new Error(`경로에 없는 도시: ${id}`);
  return found;
}

/** 12월 d일 h:m:s(.ms)를 UTC로 읽은 epoch ms */
const dec = (d: number, h: number, m: number, s = 0, ms = 0) => Date.UTC(YEAR, 11, d, h, m, s, ms);

function assertNear(actual: number, expected: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= 1, `${label}: 차이 ${actual - expected}ms`);
}

/** 도착 순간의 현지 시계를 UTC처럼 읽은 값. 날짜까지 비교할 때 쓴다 */
const localArrival = (stop: Stop) => stop.arriveUtc + stop.utcOffset * HOUR;

// ---- 30분·45분 단위 시간대 ----

test.each([
  // [도시, 도착 UTC, 도착 현지 시계]
  ["kathmandu", dec(24, 18, 18, 43, 200), dec(25, 0, 3, 43, 200)], // +5:45
  ["delhi", dec(24, 18, 51, 9, 600), dec(25, 0, 21, 9, 600)], // +5:30
  ["mumbai", dec(24, 19, 8, 28, 800), dec(25, 0, 38, 28, 800)], // +5:30
])("30분·45분 시간대 %s: 도착 시각과 현지 시계가 정확하다", (id, utc, local) => {
  assertNear(find(id).arriveUtc, utc, "도착 UTC");
  assertNear(localArrival(find(id)), local, "현지 시계");
});

test.each([
  ["chatham", dec(24, 11, 46, 0), dec(25, 1, 31, 0)], // +13:45, 날짜변경선 보정
  ["stjohns", dec(25, 3, 30, 50, 400), dec(25, 0, 0, 50, 400)], // -3:30
  ["marquesas", dec(25, 9, 18, 0), dec(24, 23, 48, 0)], // -9:30, 현지 자정 12분 전
])("음수·날짜변경선 쪽 분 단위 시간대 %s", (id, utc, local) => {
  const stop = find(id, edgeRoute);
  assertNear(stop.arriveUtc, utc, "도착 UTC");
  assertNear(localArrival(stop), local, "현지 시계");
});

test("화면용 현지 시각도 시간대의 분을 버리지 않는다", () => {
  assert.ok(Math.abs(localClockHour(find("kathmandu")) - 3 / 60) < 1e-9); // 00:03
  assert.ok(Math.abs(localClockHour(find("delhi")) - 21 / 60) < 1e-9); // 00:21
  assert.ok(Math.abs(localClockHour(find("marquesas", edgeRoute)) - (23 + 48 / 60)) < 1e-9); // 23:48
});

test("오프셋이 달라도 경도가 같으면 같은 순간에 도착한다 (시계 자정 규칙이 아니다)", () => {
  const stops = buildRoute(
    [
      { id: "a", name: "A", lat: 10, lon: 80, utcOffset: 5.5 },
      { id: "b", name: "B", lat: 20, lon: 80, utcOffset: 5.75 },
      { id: "c", name: "C", lat: 30, lon: 80, utcOffset: 8 },
    ],
    YEAR,
  );
  assert.equal(new Set(stops.map((s) => s.arriveUtc)).size, 1);
});

// ---- 넓은 단일 시간대 ----

test("카슈가르: 베이징 시간대지만 현지 시계로 새벽 2시 56분에 도착한다", () => {
  assertNear(find("kashgar").arriveUtc, dec(24, 18, 56, 2, 400), "도착 UTC");
  assertNear(localArrival(find("kashgar")), dec(25, 2, 56, 2, 400), "현지 시계");
});

test("카슈가르: 베이징보다 2시간 41분 늦고, 경도 순서대로 델리와 뭄바이 사이에 온다", () => {
  assertNear(find("beijing").arriveUtc, dec(24, 16, 14, 24), "베이징 도착 UTC");
  const gap = find("kashgar").arriveUtc - find("beijing").arriveUtc;
  assertNear(gap, ((116.4 - 75.99) / 15) * HOUR, "베이징과의 간격");

  const ids = route.map((s) => s.id);
  assert.deepEqual(ids.slice(ids.indexOf("kathmandu"), ids.indexOf("mumbai") + 1), [
    "kathmandu",
    "delhi",
    "kashgar",
    "mumbai",
  ]);
});

// ---- 날짜변경선 ----

test("보정 기준의 경계: 차이가 정확히 180이면 보정하지 않고, 넘으면 보정한다", () => {
  assert.equal(effectiveLongitude(0, 12), 0);
  assert.equal(effectiveLongitude(-0.01, 12), -0.01 + 360);
  assert.equal(effectiveLongitude(0, -12), 0);
  assert.equal(effectiveLongitude(0.01, -12), 0.01 - 360);
});

test("보정 기준은 시간대의 분까지 계산한다 (규칙을 고정하려는 가상 조합)", () => {
  assert.equal(effectiveLongitude(20, 13.75), 20 + 360); // 206.25 − 20 = 186.25 > 180
  assert.equal(effectiveLongitude(40, -9.5), 40 - 360); // −142.5 − 40 = −182.5 < −180
});

test.each([
  ["kiritimati", dec(24, 10, 29, 26, 400), dec(25, 0, 29, 26, 400)], // +14
  ["apia", dec(24, 11, 27, 2, 400), dec(25, 0, 27, 2, 400)], // +13
  ["pagopago", dec(25, 11, 22, 48), dec(25, 0, 22, 48)], // -11
  ["honolulu", dec(25, 10, 31, 26, 400), dec(25, 0, 31, 26, 400)], // -10
])("날짜변경선 양쪽 %s: 현지 날짜까지 12월 25일로 맞다", (id, utc, local) => {
  assertNear(find(id).arriveUtc, utc, "도착 UTC");
  assertNear(localArrival(find(id)), local, "현지 시계");
});

test("이웃한 아피아와 파고파고는 거의 하루 차이로 도착한다", () => {
  const gap = find("pagopago").arriveUtc - find("apia").arriveUtc;
  assertNear(gap, ((188.24 + 170.7) / 15) * HOUR, "간격"); // 약 23시간 56분
});

test("경도가 0.5도 차이인 키리티마티와 호놀룰루는 하루 넘게 차이 난다", () => {
  const gap = find("honolulu").arriveUtc - find("kiritimati").arriveUtc;
  assertNear(gap, 24 * HOUR + 2 * MIN, "간격");
});

test("경도와 시간대가 반대인 곳: 우엘렌은 앞쪽으로, 애투는 맨 뒤로 간다", () => {
  assertNear(find("uelen", edgeRoute).arriveUtc, dec(24, 11, 18, 48), "우엘렌");
  assertNear(find("attu", edgeRoute).arriveUtc, dec(25, 12, 28, 24), "애투");
  assert.equal(edgeRoute.at(-1)?.id, "attu");

  const ids = edgeRoute.map((s) => s.id);
  assert.ok(ids.indexOf("uelen") < ids.indexOf("taveuni"));
  assert.ok(ids.indexOf("taveuni") < ids.indexOf("suva")); // 180도 동쪽 피지가 수바보다 먼저
});

test("모든 도시의 현지 도착은 날짜까지 포함해 12월 25일 자정 앞뒤 4시간 안이다", () => {
  // 시각만 보면 하루 밀린 오류를 놓치므로 날짜까지 비교한다
  for (const stop of edgeRoute) {
    const local = localArrival(stop);
    assert.ok(
      local >= dec(24, 20, 0) && local <= dec(25, 4, 0),
      `${stop.name}: ${new Date(local).toISOString()}`,
    );
  }
});

test("날짜변경선을 건너는 비행은 180도 근처로 지나간다 (지구 반대쪽으로 돌지 않는다)", () => {
  const from = find("nukualofa"); // 서경 175.2
  const to = find("suva"); // 동경 178.44
  assert.equal(route[route.indexOf(from) + 1], to);

  const samples = 20;
  const depart = from.arriveUtc + DWELL_MS;
  for (let i = 1; i < samples; i++) {
    const now = depart + ((to.arriveUtc - depart) * i) / samples;
    const s = santaAt(now, route);
    assert.equal(s.status, "flying");
    assert.ok(Math.abs(s.lon) >= 175, `경도 ${s.lon}`);
  }
});

// 2026-11-22 바꿈: 비행 중 산타는 두 도시 사이 최단 경로(대권) 대신 자정선 위에 있다.
// 도착이 경도로만 정해져 남북으로 크게 튀는 구간이 많아서(실제 경로 660구간 중 141개가 3,000km 넘음),
// 대권으로 날면 산타가 몇 초 만에 지도를 가로지른다. 자정선을 타면 늘 서쪽으로 천천히 움직이고 도착 순간에 정확히 그 도시에 닿는다.
test("모든 구간에서 비행 중 산타는 자정선 위에 있고, 위도는 두 도시 사이를 진행률만큼 간다", () => {
  for (let i = 0; i + 1 < edgeRoute.length; i++) {
    const [from, to] = [edgeRoute[i], edgeRoute[i + 1]];
    const gap = to.arriveUtc - from.arriveUtc;
    if (gap <= 0) continue; // 같은 순간 도착은 비행이 없다
    const depart = from.arriveUtc + Math.min(DWELL_MS, gap / 2);

    for (const ratio of [0.25, 0.5, 0.75]) {
      const now = depart + (to.arriveUtc - depart) * ratio;
      const pos = santaAt(now, edgeRoute);
      assert.equal(pos.status, "flying");
      const lonGap = Math.abs(wrapLongitude(pos.lon - midnightLongitude(now, YEAR)));
      assert.ok(lonGap < 1e-9, `${from.name} → ${to.name}: 자정선과 ${lonGap}도 차이`);
      const lat = from.lat + (to.lat - from.lat) * ratio;
      assert.ok(Math.abs(pos.lat - lat) < 1e-9, `${from.name} → ${to.name}: 위도 ${pos.lat}`);
    }
  }
});

// ---- 도착이 몰리는 경우 ----

test("두 도시가 24초 차이면 머무는 시간은 절반인 12초로 줄어든다", () => {
  const taipei = find("taipei");
  const shanghai = find("shanghai");
  assertNear(shanghai.arriveUtc - taipei.arriveUtc, 24_000, "간격");

  assert.equal(santaAt(taipei.arriveUtc + 11_000, route).status, "visiting");
  const flying = santaAt(taipei.arriveUtc + 13_000, route);
  assert.equal(flying.status, "flying");
  assert.equal(flying.next?.id, "shanghai");
});

test("같은 순간에 도착하는 도시가 있어도 위치가 깨지지 않고 둘 다 지나온 것으로 센다", () => {
  const stops = buildRoute(
    [
      { id: "east", name: "동쪽", lat: 0, lon: 90, utcOffset: 6 },
      { id: "same1", name: "같은 경도 1", lat: 10, lon: 80, utcOffset: 5.5 },
      { id: "same2", name: "같은 경도 2", lat: 20, lon: 80, utcOffset: 8 },
      { id: "west", name: "서쪽", lat: 30, lon: 70, utcOffset: 5 },
    ],
    YEAR,
  );
  const arrive = stops[1].arriveUtc;

  for (const offset of [-1, 0, 1, DWELL_MS, DWELL_MS + 1]) {
    const s = santaAt(arrive + offset, stops);
    assert.ok(
      Number.isFinite(s.lat) && Number.isFinite(s.lon) && Number.isFinite(s.progress),
      `${offset}ms 뒤`,
    );
    assert.ok(s.progress >= 0 && s.progress <= 1, `${offset}ms 뒤 진행률 ${s.progress}`);
  }
  assert.equal(santaAt(arrive - 1, stops).visitedCount, 1);
  assert.equal(santaAt(arrive, stops).visitedCount, 3);
});
