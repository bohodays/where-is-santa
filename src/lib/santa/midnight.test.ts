// 자정선: "지금 해 기준으로 막 12월 25일 0시가 된 경도". 지도에 세로선으로 그리고, 산타는 비행 중 이 선을 탄다.
// 기대값은 코드 결과를 복사하지 않고 도착 규칙(도착 = 12/25 00:00 UTC − 보정 경도 ÷ 15시간)을 거꾸로 풀어 적었다.
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { buildRoute, midnightLongitude, wrapLongitude } from "./route";
import { ROUTE_YEAR } from "./route-summary";
import { santaAt } from "./santa";
import { STOPS } from "./stops";

const HOUR = 3_600_000;
const XMAS = Date.UTC(2026, 11, 25);
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe("wrapLongitude: 경도를 −180~180으로", () => {
  test("범위 안은 그대로, 밖은 360도씩 돌린다", () => {
    assert.equal(wrapLongitude(126.98), 126.98);
    assert.ok(near(wrapLongitude(202.5), -157.5)); // 키리티마티처럼 날짜변경선 보정으로 +360 된 경도
    assert.ok(near(wrapLongitude(-190), 170));
    assert.equal(wrapLongitude(180), -180); // 같은 선이라 한쪽으로 정한다
  });
});

describe("midnightLongitude: 지금 자정인 경도", () => {
  test("12월 25일 0시 UTC에는 경도 0(그리니치)", () => {
    assert.ok(near(midnightLongitude(XMAS, 2026), 0));
  });

  test("1시간마다 서쪽으로 15도", () => {
    assert.ok(near(midnightLongitude(XMAS + HOUR, 2026), -15));
    assert.ok(near(midnightLongitude(XMAS - 2 * HOUR, 2026), 30));
  });

  test("날짜변경선을 넘으면 반대쪽 끝으로 이어진다", () => {
    // 0시 UTC 12시간 전이면 동경 180도, 13시간 전이면 동경 195도 = 서경 165도
    assert.ok(near(Math.abs(midnightLongitude(XMAS - 12 * HOUR, 2026)), 180));
    assert.ok(near(midnightLongitude(XMAS - 13 * HOUR, 2026), -165));
  });

  test("실제 경로 661곳 모두: 도착 순간의 자정선은 그 도시의 경도다", () => {
    for (const stop of buildRoute(STOPS, ROUTE_YEAR)) {
      const gap = Math.abs(wrapLongitude(midnightLongitude(stop.arriveUtc, ROUTE_YEAR) - stop.lon));
      assert.ok(gap < 1e-6, `${stop.name}: ${gap}도`);
    }
  });
});

describe("산타는 지도를 가로질러 튀지 않는다 (실제 경로)", () => {
  test("여정 내내 10초 간격으로 보면 경도는 늘 조금씩만 서쪽으로 움직인다", () => {
    const route = buildRoute(STOPS, ROUTE_YEAR);
    const start = route[0].arriveUtc;
    const end = route[route.length - 1].arriveUtc;
    let prev = santaAt(start, route);
    for (let t = start + 10_000; t <= end; t += 10_000) {
      const s = santaAt(t, route);
      // 10초에 자정선은 0.04도 움직인다. 도시에 머물다 떠날 때 자정선으로 옮겨 타는 0.125도(30초 머묾)를 더해도 0.2도 안쪽
      const step = wrapLongitude(prev.lon - s.lon); // 서쪽으로 가면 양수
      assert.ok(
        step > -1e-9 && step < 0.2,
        `${new Date(t).toISOString()} ${s.next?.name}: ${step}도`,
      );
      prev = s;
    }
  });
});
