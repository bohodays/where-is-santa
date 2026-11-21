// 산타 위도를 부드럽게 하기(smoothLat, 가까운 위도끼리만 평균). 결정 2026-11-22: 도시가 촘촘한 한국에서 산타가 위아래로 떨리지 않게,
// 그러면서 남북으로 크게 튀는 곳(런던 옆 서아프리카 등)에서는 도착 도시를 벗어나지 않게.
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import type { City } from "./cities";
import { buildRoute } from "./route";
import { ROUTE_YEAR } from "./route-summary";
import { DWELL_MS, LAT_SMOOTH_DEG, LAT_SMOOTH_MS, santaAt, smoothLat } from "./santa";
import { STOPS } from "./stops";

const MIN = 60_000;
/** 세계 지도(확대 1)에서 그 위도 근처 위도 1도의 화면 거리(px). 메르카토르라 극으로 갈수록 커진다 */
const pxPerDeg = (lat: number) =>
  1024 / 360 / Math.cos((Math.min(80, Math.abs(lat)) * Math.PI) / 180);
const PX_PER_DEG_KOREA = pxPerDeg(36.5);

describe("도시가 드문 곳은 거의 그대로", () => {
  // 도시 셋이 2시간 간격(경도 30도씩), 위도는 0 → 20 → 0
  const cities: City[] = [
    { id: "a", name: "가", lat: 0, lon: 60, utcOffset: 4 },
    { id: "b", name: "나", lat: 20, lon: 30, utcOffset: 2 },
    { id: "c", name: "다", lat: 0, lon: 0, utcOffset: 0 },
  ];
  const route = buildRoute(cities, ROUTE_YEAR);
  const [a, b] = route;

  test("비행 중간에는 두 도시 사이를 진행률만큼 간 위도와 거의 같다(평균 창 안이 곧은 선)", () => {
    const leave = a.arriveUtc + DWELL_MS;
    const mid = (leave + b.arriveUtc) / 2;
    const raw = a.lat + ((b.lat - a.lat) * (mid - leave)) / (b.arriveUtc - leave);
    assert.ok(Math.abs(smoothLat(mid, route) - raw) < 1e-3);
  });

  test("도착 순간에도 도시 위도와 0.3도 안쪽", () => {
    assert.ok(Math.abs(santaAt(b.arriveUtc, route).lat - b.lat) < 0.3);
  });

  test("평균 폭이 0이면 부드럽게 하기 전과 같다", () => {
    assert.equal(smoothLat(b.arriveUtc, route, 0), b.lat);
  });
});

describe("실제 경로", () => {
  const route = buildRoute(STOPS, ROUTE_YEAR);
  const korea = route.filter((s) => s.id.startsWith("kr-"));
  const start = korea[0].arriveUtc;
  const end = korea[korea.length - 1].arriveUtc;

  /** 위아래 방향이 바뀔 때까지 움직인 거리(px) 목록 */
  function swings(windowMs: number): number[] {
    const out: number[] = [];
    let run = 0;
    let dir = 0;
    let prev = smoothLat(start, route, windowMs);
    for (let t = start + 500; t <= end; t += 500) {
      const v = smoothLat(t, route, windowMs);
      const sign = Math.sign(v - prev);
      if (sign && dir && sign !== dir) {
        out.push(run * PX_PER_DEG_KOREA);
        run = 0;
      }
      if (sign) dir = sign;
      run += Math.abs(v - prev);
      prev = v;
    }
    return out;
  }

  test("한국 위를 지날 때 1px 넘게 위아래로 흔들리는 일이 거의 없다(부드럽게 하기 전 137번)", () => {
    const before = swings(0).filter((s) => s >= 1).length;
    const after = swings(LAT_SMOOTH_MS).filter((s) => s >= 1).length;
    assert.ok(before > 100, `부드럽게 하기 전 ${before}번`);
    assert.ok(after <= 15, `부드럽게 한 뒤 ${after}번`);
  });

  test("한국 위에서 0.1초에 0.6도(약 2px) 넘게 움직이지 않는다(삼각형 가중치: 창 끝 점이 들고 날 때 튀지 않게)", () => {
    let prev = smoothLat(start, route);
    for (let t = start + 100; t <= end; t += 100) {
      const lat = smoothLat(t, route);
      assert.ok(
        Math.abs(lat - prev) < 0.6,
        `${new Date(t).toISOString()}: ${Math.abs(lat - prev)}도`,
      );
      prev = lat;
    }
  });

  test("한국 시군구에 도착하는 순간 산타는 그 시군구 가까이에 있다(위도 차이 중앙값 1도 안쪽)", () => {
    const gaps = korea
      .map((s) => Math.abs(santaAt(s.arriveUtc, route).lat - s.lat))
      .sort((x, y) => x - y);
    const median = gaps[Math.floor(gaps.length / 2)];
    assert.ok(median < 1, `중앙값 ${median}도`);
  });

  test("남북으로 크게 튀는 곳의 큰 도시도 도착 순간 산타가 가까이 있다(그냥 평균하면 런던 93px, 케이프타운 170px)", () => {
    const offsetPx = (name: string) => {
      const stop = route.find((s) => s.name === name)!;
      return Math.abs(santaAt(stop.arriveUtc, route).lat - stop.lat) * pxPerDeg(stop.lat);
    };
    for (const name of ["런던", "케이프타운", "칠레 산티아고", "카이로", "뉴욕", "서울 중구"]) {
      assert.ok(offsetPx(name) < 20, `${name}: ${offsetPx(name).toFixed(1)}px`);
    }
  });

  test("모든 도시: 도착 순간 어긋남 상위 10%도 12px 안쪽", () => {
    const offsets = route
      .map((s) => Math.abs(santaAt(s.arriveUtc, route).lat - s.lat) * pxPerDeg(s.lat))
      .sort((x, y) => x - y);
    const p90 = offsets[Math.floor(offsets.length * 0.9)];
    assert.ok(p90 < 12, `${p90.toFixed(1)}px`);
  });

  test("평균은 5분 폭, 위도 차이 8도 기준", () => {
    assert.equal(LAT_SMOOTH_MS, 5 * MIN);
    assert.equal(LAT_SMOOTH_DEG, 8);
  });
});
