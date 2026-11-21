import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { nearestNeighborhoods, OUTSIDE_KOREA_KM, searchNeighborhoods } from "./neighborhood-search";
import { NEIGHBORHOODS } from "./neighborhoods";
import { buildRoute } from "./route";
import { ROUTE_SUMMARY, ROUTE_YEAR } from "./route-summary";
import { STOPS } from "./stops";

const labels = (q: string) => searchNeighborhoods(q, NEIGHBORHOODS).map((n) => n.label);

describe("NEIGHBORHOODS: 동네 고르기 목록", () => {
  test("시군구 256곳, 경로의 국내 도시와 id·이름·도착 시각이 같다", () => {
    assert.equal(NEIGHBORHOODS.length, 256);
    const route = new Map(buildRoute(STOPS, ROUTE_YEAR).map((s) => [s.id, s]));
    for (const n of NEIGHBORHOODS) {
      const stop = route.get(n.id);
      assert.ok(stop, n.id);
      assert.equal(n.label, stop.name);
      assert.equal(n.arriveUtc, stop.arriveUtc, n.label);
    }
  });

  test("기본 동네(서울 중구)가 목록에 있고 요약 값과 같다", () => {
    const home = NEIGHBORHOODS.find((n) => n.id === ROUTE_SUMMARY.defaultHome.id);
    assert.equal(home?.label, ROUTE_SUMMARY.defaultHome.name);
    assert.equal(home?.arriveUtc, ROUTE_SUMMARY.defaultHome.arriveUtc);
  });
});

describe("searchNeighborhoods: 이름으로 찾기", () => {
  test("시안 장면: ㅁㅍ → 마포구, 목포시", () => {
    assert.deepEqual(labels("ㅁㅍ").slice(0, 2), ["서울 마포구", "목포시"]);
  });

  test("이름이 검색어로 시작하는 동네가 먼저, 가운데에 있는 동네는 뒤에", () => {
    // 광역시의 "남구"가 먼저(이름 가나다순, 같으면 시도 순), 이름 가운데에 있으면 앞에 있을수록 먼저.
    // 마지막 "구"는 치는 중인 "군"일 수도 있어서 해남군도 찾는다
    assert.deepEqual(labels("남구"), [
      "광주 남구",
      "대구 남구",
      "부산 남구",
      "울산 남구",
      "서울 강남구",
      "해남군",
      "포항시 남구",
      "천안시 동남구",
    ]);
    // "수원시 장안구"는 "장안"으로 찾으면 이름 가운데(시 이름 뒤)에 있다
    assert.deepEqual(labels("장안"), ["수원시 장안구"]);
  });

  test("시도 이름으로도 찾는다. 이름에 맞는 동네가 먼저", () => {
    const seoul = labels("서울");
    assert.equal(seoul.length, 25); // 서울 25개 구
    const gangwon = searchNeighborhoods("강원", NEIGHBORHOODS);
    assert.ok(gangwon.length >= 18 && gangwon.every((n) => n.sido === "강원특별자치도"));
    // "강서"는 강서구(서울·부산)가 이름에 맞는다
    assert.deepEqual(labels("강서"), ["부산 강서구", "서울 강서구"]);
  });

  test("빈 검색어는 빈 목록, 없는 동네도 빈 목록", () => {
    assert.deepEqual(labels(""), []);
    assert.deepEqual(labels("   "), []);
    assert.deepEqual(labels("런던"), []);
  });
});

describe("nearestNeighborhoods: 내 위치로 찾기", () => {
  const nearest = (lat: number, lon: number) => {
    const [first] = nearestNeighborhoods({ lat, lon }, NEIGHBORHOODS);
    return { label: first.neighborhood.label, km: first.km };
  };

  test("도시 안: 서울시청 → 서울 중구, 해운대 → 부산 해운대구", () => {
    assert.equal(nearest(37.5663, 126.9779).label, "서울 중구");
    assert.equal(nearest(35.1631, 129.1635).label, "부산 해운대구");
  });

  test("가까운 순서로 3곳, 거리(km)와 함께", () => {
    const found = nearestNeighborhoods({ lat: 37.5663, lon: 126.9779 }, NEIGHBORHOODS);
    assert.equal(found.length, 3);
    assert.ok(found[0].km <= found[1].km && found[1].km <= found[2].km);
  });

  test("대표점에서 먼 섬도 제 동네가 먼저(섬 위치가 없으면 이웃 군이 먼저 나왔다)", () => {
    assert.equal(nearest(34.07, 125.11).label, "신안군"); // 가거도. 섬 위치 없이는 진도군
    assert.equal(nearest(34.68, 125.43).label, "신안군"); // 흑산도
    assert.equal(nearest(37.66, 125.7).label, "인천 옹진군"); // 연평도. 섬 위치 없이는 강화군
    assert.equal(nearest(33.95, 126.3).label, "제주시"); // 추자도. 섬 위치 없이는 진도군
    assert.equal(nearest(37.24, 131.87).label, "울릉군"); // 독도
    assert.equal(nearest(33.12, 126.27).label, "서귀포시"); // 마라도
  });

  test(`한국 밖이면 가장 가까운 동네도 ${OUTSIDE_KOREA_KM}km보다 멀다`, () => {
    assert.ok(nearest(33.59, 130.4).km > OUTSIDE_KOREA_KM); // 후쿠오카
    assert.ok(nearest(40.12, 124.39).km > OUTSIDE_KOREA_KM); // 단둥
    assert.ok(nearest(31.23, 121.47).km > OUTSIDE_KOREA_KM); // 상하이
    // 한국 안에서 가장 먼 곳(가거도·독도)도 섬 위치 덕에 그 안이다
    assert.ok(nearest(34.07, 125.11).km < 20);
    assert.ok(nearest(37.24, 131.87).km < 20);
  });
});
