import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { describeSanta, distanceKm, withRo } from "./describe";
import type { Stop } from "./route";
import { santaAt } from "./santa";

const SEC = 1_000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 11, 24, 15, 30); // 기준 시각(한국 시각 12/25 밤 12시 30분)

/** 이름, 도착 시각(T0부터 분), 좌표만 정한 가짜 도시 */
function stop(name: string, minutes: number, lat: number, lon: number): Stop {
  return { id: name, name, lat, lon, utcOffset: 9, effLon: lon, arriveUtc: T0 + minutes * MIN };
}

// 부산 → 대구는 가까운 구간(약 90km), 대구 → 베이징은 먼 구간(약 1,000km)
const BUSAN = { lat: 35.18, lon: 129.08 };
const DAEGU = { lat: 35.87, lon: 128.6 };
const BEIJING = { lat: 39.9, lon: 116.4 };
const route: Stop[] = [
  stop("부산", 0, BUSAN.lat, BUSAN.lon),
  stop("대구", 5, DAEGU.lat, DAEGU.lon),
  stop("베이징", 185, BEIJING.lat, BEIJING.lon),
];
const at = (now: number) => describeSanta(santaAt(now, route), now);

describe("withRo: 받침에 따라 '로'·'으로'", () => {
  test("받침이 없거나 ㄹ 받침이면 '로'", () => {
    assert.equal(withRo("도쿄"), "도쿄로");
    assert.equal(withRo("서울"), "서울로"); // ㄹ 받침
    assert.equal(withRo("호놀룰루"), "호놀룰루로");
  });

  test("ㄹ이 아닌 받침이 있으면 '으로'", () => {
    assert.equal(withRo("부산"), "부산으로");
    assert.equal(withRo("베이징"), "베이징으로");
    assert.equal(withRo("서울 마포구"), "서울 마포구로");
    assert.equal(withRo("인천 중구"), "인천 중구로");
  });

  test("한글로 끝나지 않으면 '(으)로'", () => {
    assert.equal(withRo("NYC"), "NYC(으)로");
    assert.equal(withRo(""), "(으)로");
  });
});

describe("distanceKm: 두 지점 사이 거리", () => {
  test("알려진 거리와 1% 안으로 맞는다", () => {
    const near = (a: number, b: number) => Math.abs(a - b) / b < 0.01;
    assert.ok(near(distanceKm(BUSAN, DAEGU), 88), `부산-대구 ${distanceKm(BUSAN, DAEGU)}`);
    assert.ok(near(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }), 111.19)); // 적도 경도 1도
    assert.ok(near(distanceKm({ lat: 0, lon: 179.5 }, { lat: 0, lon: -179.5 }), 111.19)); // 날짜변경선 건너기
  });
});

describe("describeSanta: 지도 위 위치 문장", () => {
  test("출발 전: 북극에서 준비 중, 첫 도착까지 남은 시간", () => {
    assert.deepEqual(at(T0 - 37 * DAY - 2 * HOUR), {
      headline: "산타는 북극에서 출발 준비 중",
      detail: "첫 도착: 부산, 37일 2시간 뒤",
    });
  });

  test("도시에 머무는 동안: 선물 배달 중, 다음 도착", () => {
    assert.deepEqual(at(T0 + 10 * SEC), {
      headline: "지금 산타는 부산에서 선물 배달 중",
      detail: "다음 도착: 대구, 4분 뒤",
    });
  });

  test("가까운 도시 사이: 가까운 쪽 이름으로 '상공'", () => {
    assert.equal(at(T0 + 2 * MIN).headline, "지금 산타는 부산 상공"); // 비행 구간의 약 1/3
    assert.equal(at(T0 + 3 * MIN).headline, "지금 산타는 대구 상공"); // 비행 구간의 절반 넘음
    assert.equal(at(T0 + 3 * MIN).detail, "다음 도착: 대구, 2분 뒤");
  });

  test("먼 도시 사이: 'A에서 B로 가는 중'", () => {
    assert.deepEqual(at(T0 + 65 * MIN), {
      headline: "지금 산타는 대구에서 베이징으로 가는 중",
      detail: "다음 도착: 베이징, 2시간 뒤",
    });
  });

  test("비행 시간이 짧아도 멀면 '가는 중' (도착 시각은 경도로만 정해진다)", () => {
    // 베이징 → 홍콩: 경도가 비슷해 5분이면 닿지만 거리는 약 2,000km
    const short = [stop("베이징", 0, 39.9, 116.4), stop("홍콩", 5, 22.32, 114.17)];
    const now = T0 + 2 * MIN;
    assert.equal(
      describeSanta(santaAt(now, short), now).headline,
      "지금 산타는 베이징에서 홍콩으로 가는 중",
    );
  });

  test("거리 기준 300km 경계 (적도 위 경도 2.6도 ≈ 289km, 2.8도 ≈ 311km)", () => {
    const headline = (lonB: number) => {
      const r = [stop("가", 0, 0, 100), stop("나", 5, 0, 100 + lonB)];
      const now = T0 + 2 * MIN;
      return describeSanta(santaAt(now, r), now).headline;
    };
    assert.equal(headline(2.6), "지금 산타는 가 상공");
    assert.equal(headline(2.8), "지금 산타는 가에서 나로 가는 중");
  });

  test("1분이 안 남으면 '곧', 딱 1분이면 '1분 뒤'", () => {
    assert.equal(at(T0 + 4 * MIN + 30 * SEC).detail, "다음 도착: 대구, 곧");
    assert.equal(at(T0 + 4 * MIN).detail, "다음 도착: 대구, 1분 뒤");
  });

  test("마지막 도시에 머무는 동안", () => {
    assert.deepEqual(at(T0 + 185 * MIN + 10 * SEC), {
      headline: "지금 산타는 베이징에서 선물 배달 중",
      detail: "마지막 도시예요",
    });
  });

  test("끝난 뒤: 북극으로 돌아감", () => {
    assert.deepEqual(at(T0 + 186 * MIN), {
      headline: "산타는 북극으로 돌아갔어요",
      detail: null,
    });
  });

  test("headline은 시간이 흘러도 도시가 바뀔 때만 바뀐다 (화면 낭독기가 자주 읽지 않게)", () => {
    // 먼 구간을 1분씩 지나가는 동안 headline은 하나뿐이다
    const headlines = new Set<string>();
    for (let m = 6; m < 185; m++) headlines.add(at(T0 + m * MIN).headline);
    assert.deepEqual([...headlines], ["지금 산타는 대구에서 베이징으로 가는 중"]);
  });
});
