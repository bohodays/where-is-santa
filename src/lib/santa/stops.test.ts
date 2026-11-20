// 경로 데이터(세계 도시 + 시군구) 검사. 데이터를 다시 만들 때(npm run build:route) 이상한 값이 들어오면 여기서 잡는다.
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { buildRoute } from "./route";
import { SIGUNGU } from "./sigungu";
import { DEFAULT_HOME_ID, STOPS, sigunguLabel, worldCityLabel } from "./stops";
import { WORLD_CITIES } from "./world-cities";

const MIN = 60_000;
const HOUR = 60 * MIN;
/** 2026년 한국 시각(KST)을 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);
const route = buildRoute(STOPS, 2026);

describe("세계 도시 (GeoNames)", () => {
  test("400곳 남짓이고, 한국 도시는 없다(국내는 시군구)", () => {
    assert.ok(WORLD_CITIES.length >= 400 && WORLD_CITIES.length <= 420, `${WORLD_CITIES.length}곳`);
    assert.equal(WORLD_CITIES.filter((c) => c.cc === "KR").length, 0);
  });

  test("좌표와 시간대 값이 말이 된다", () => {
    for (const c of WORLD_CITIES) {
      assert.ok(Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180, `${c.name}: ${c.lat}, ${c.lon}`);
      // 시간대는 −12~+14시간, 15분 단위(네팔 +5:45 등)
      assert.ok(c.utcOffset >= -12 && c.utcOffset <= 14, `${c.name}: ${c.utcOffset}`);
      assert.ok(Number.isInteger(c.utcOffset * 4), `${c.name}: ${c.utcOffset}`);
    }
  });

  test("12월 기준 시간대: 서머타임과 30·45분 시간대가 반영되어 있다", () => {
    const offset = (name: string) => WORLD_CITIES.find((c) => c.name === name)?.utcOffset;
    assert.equal(offset("시드니"), 11); // 남반구 여름, 서머타임
    assert.equal(offset("런던"), 0); // 북반구 겨울
    assert.equal(offset("뉴델리"), 5.5);
    assert.equal(offset("카트만두"), 5.75);
    assert.equal(offset("아피아"), 13); // 날짜변경선 서쪽으로 옮긴 사모아
  });
});

describe("한글 이름과 나라 표시 (2026-11-21 사람 검수)", () => {
  const city = (name: string, country?: string) => {
    const found = WORLD_CITIES.filter(
      (c) => c.name === name && (!country || c.country === country),
    );
    assert.equal(found.length, 1, `${name} ${country ?? ""}: ${found.length}곳`);
    return found[0];
  };

  test("이름에는 괄호를 넣지 않는다(같은 이름은 나라 표시로 구분)", () => {
    for (const c of WORLD_CITIES) assert.match(c.name, /^[가-힣]+( [가-힣]+)*$/, c.id);
  });

  test("같은 이름이거나 헷갈리기 쉬운 도시는 나라를 앞에 붙여 보인다", () => {
    assert.equal(worldCityLabel(city("하이데라바드", "인도")), "인도 하이데라바드");
    assert.equal(worldCityLabel(city("하이데라바드", "파키스탄")), "파키스탄 하이데라바드");
    assert.equal(worldCityLabel(city("산티아고")), "칠레 산티아고");
    assert.equal(worldCityLabel(city("다카")), "방글라데시 다카");
    assert.equal(worldCityLabel(city("다카르")), "세네갈 다카르");
    assert.equal(worldCityLabel(city("살바도르")), "브라질 살바도르");
    assert.equal(worldCityLabel(city("킹스턴", "자메이카")), "자메이카 킹스턴");
    assert.equal(worldCityLabel(city("도쿄")), "도쿄"); // 나머지는 이름만
  });

  test("대만·홍콩은 '중국'으로 표시하지 않는다", () => {
    for (const name of ["타이베이", "타이중", "가오슝"]) assert.equal(city(name).country, "대만");
    assert.equal(city("홍콩").country, "홍콩");
  });

  test("정한 표기를 지킨다: 키이우(키예프 아님), 치타공, 살바도르", () => {
    assert.equal(city("키이우").cc, "UA");
    assert.equal(city("치타공").cc, "BD");
    assert.equal(city("살바도르").cc, "BR");
    assert.ok(!WORLD_CITIES.some((c) => ["키예프", "사우바도르"].includes(c.name)));
  });

  test("키리티마티(세계에서 가장 먼저 자정이 되는 곳)에서 출발한다", () => {
    const first = route[0];
    assert.equal(first.name, "키리티마티");
    assert.ok(first.arriveUtc >= kst(12, 24, 19, 25) && first.arriveUtc < kst(12, 24, 19, 35));
  });
});

describe("경로 전체 (세계 도시 + 시군구)", () => {
  test("id와 이름이 겹치지 않는다(이름이 같으면 '다음 도착: 킹스턴'이 어디인지 모른다)", () => {
    assert.equal(STOPS.length, WORLD_CITIES.length + SIGUNGU.length);
    assert.equal(new Set(STOPS.map((s) => s.id)).size, STOPS.length);
    const names = STOPS.map((s) => s.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    assert.deepEqual(dupes, []);
  });

  test("화면 이름은 모두 한글(띄어쓰기 허용)", () => {
    for (const s of STOPS) assert.match(s.name, /^[가-힣]+( [가-힣]+)*$/, s.id);
  });

  test("여정은 이브 밤에 시작해 하루 남짓 걸린다", () => {
    const first = route[0];
    const last = route[route.length - 1];
    assert.ok(first.arriveUtc >= kst(12, 24, 19) && first.arriveUtc <= kst(12, 24, 21), first.name);
    assert.ok(last.arriveUtc - first.arriveUtc < 26 * HOUR, last.name);
  });

  test("도시 사이가 1시간 넘게 비지 않는다(태평양도 빈 경도 구간을 채웠다)", () => {
    for (let i = 1; i < route.length; i++) {
      const gap = route[i].arriveUtc - route[i - 1].arriveUtc;
      assert.ok(gap <= HOUR, `${route[i - 1].name} → ${route[i].name}: ${Math.round(gap / MIN)}분`);
    }
  });

  test("국내 시군구는 모두 한국 시각 밤 12시 16분~42분 사이에 들른다", () => {
    for (const s of route.filter((r) => r.id.startsWith("kr-"))) {
      assert.ok(s.arriveUtc >= kst(12, 25, 0, 16) && s.arriveUtc < kst(12, 25, 0, 43), s.name);
    }
  });

  test("기본 동네는 서울 중구", () => {
    assert.equal(STOPS.find((s) => s.id === DEFAULT_HOME_ID)?.name, "서울 중구");
  });
});

describe("sigunguLabel: 시군구를 화면 이름으로", () => {
  const label = (sido: string, name: string) => {
    const s = SIGUNGU.find((x) => x.sido === sido && x.name === name);
    if (!s) throw new Error(`없음: ${sido} ${name}`);
    return sigunguLabel(s);
  };

  test("특별시·광역시의 구·군은 시를 붙인다", () => {
    assert.equal(label("서울특별시", "마포구"), "서울 마포구");
    assert.equal(label("부산광역시", "중구"), "부산 중구");
    assert.equal(label("인천광역시", "강화군"), "인천 강화군");
    assert.equal(label("대구광역시", "군위군"), "대구 군위군");
  });

  test("세종은 '세종'", () => {
    assert.equal(label("세종특별자치시", "세종시"), "세종");
  });

  test("도의 시·군은 그대로, 다른 도에 같은 이름이 있으면 도를 붙인다", () => {
    assert.equal(label("강원특별자치도", "춘천시"), "춘천시");
    assert.equal(label("경기도", "수원시 장안구"), "수원시 장안구");
    assert.equal(label("강원특별자치도", "고성군"), "강원 고성군");
    assert.equal(label("경상남도", "고성군"), "경남 고성군");
  });
});
