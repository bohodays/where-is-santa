import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  DEFAULT_HOME,
  HOME_BOOT_SCRIPT,
  HOME_STORAGE_KEY,
  parseStoredHome,
  serializeHome,
} from "./home";
import { NEIGHBORHOODS } from "./neighborhoods";

const byLabel = (label: string) => {
  const n = NEIGHBORHOODS.find((x) => x.label === label);
  if (!n) throw new Error(label);
  return n;
};

describe("우리 동네 저장 형식", () => {
  test("저장했다 읽으면 같은 동네, 도착 시각은 목록과 같다", () => {
    for (const label of [
      "서울 마포구",
      "목포시",
      "울릉군",
      "제주시",
      "인천 옹진군",
      "화성시 동탄구",
    ]) {
      const n = byLabel(label);
      const home = parseStoredHome(serializeHome(n));
      assert.deepEqual(home, {
        id: n.id,
        name: n.label,
        lat: n.lat,
        lon: n.lon,
        arriveUtc: n.arriveUtc,
      });
    }
  });

  test("목록의 모든 동네가 검사 범위 안이다(저장하고 다시 읽을 수 있다)", () => {
    for (const n of NEIGHBORHOODS) assert.ok(parseStoredHome(serializeHome(n)), n.label);
  });

  test("저장 형식에는 좌표·이름만, 도착 시각은 넣지 않는다", () => {
    assert.deepEqual(Object.keys(JSON.parse(serializeHome(byLabel("목포시")))).sort(), [
      "id",
      "lat",
      "lon",
      "name",
      "v",
    ]);
  });

  test("기본 동네는 서울 중구", () => {
    assert.equal(DEFAULT_HOME.name, "서울 중구");
    assert.equal(DEFAULT_HOME.id, "kr-11020");
  });

  test("없거나 망가진 값은 null(기본 동네를 쓴다)", () => {
    const good = JSON.parse(serializeHome(byLabel("서울 마포구"))) as Record<string, unknown>;
    const bad = (patch: Record<string, unknown>) => JSON.stringify({ ...good, ...patch });
    assert.equal(parseStoredHome(null), null);
    assert.equal(parseStoredHome(""), null);
    assert.equal(parseStoredHome("{"), null);
    assert.equal(parseStoredHome("[]"), null);
    assert.equal(parseStoredHome("null"), null);
    assert.equal(parseStoredHome(bad({ v: 2 })), null); // 다른 저장 형식
    assert.equal(parseStoredHome(bad({ id: "gn-1835848" })), null); // 국내 동네가 아니다
    assert.equal(parseStoredHome(bad({ id: 11440 })), null);
    assert.equal(parseStoredHome(bad({ name: "" })), null);
    assert.equal(parseStoredHome(bad({ name: "가".repeat(31) })), null);
    assert.equal(parseStoredHome(bad({ lat: 51.5 })), null); // 한국 밖
    assert.equal(parseStoredHome(bad({ lon: "126.9" })), null);
    assert.equal(parseStoredHome(bad({ lat: Number.NaN })), null);
  });
});

describe("HOME_BOOT_SCRIPT: 첫 화면에 '동네를 골랐는가' 켜기", () => {
  test("parseStoredHome이 읽을 수 있는 값일 때만 data-home=chosen", () => {
    const good = JSON.parse(serializeHome(byLabel("화성시 병점구"))) as Record<string, unknown>;
    const cases: (string | null)[] = [
      null,
      "",
      "{",
      "[]",
      "null",
      serializeHome(byLabel("서울 마포구")),
      serializeHome(byLabel("화성시 병점구")), // 긴 새 id(kr-x-...)
      JSON.stringify({ ...good, v: 2 }),
      JSON.stringify({ ...good, id: "gn-1835848" }),
      JSON.stringify({ ...good, id: "kr-a b" }),
      JSON.stringify({ ...good, name: "" }),
      JSON.stringify({ ...good, lat: 51.5 }),
      JSON.stringify({ ...good, lon: "126.9" }),
    ];
    for (const raw of cases) {
      const attrs: Record<string, string> = {};
      new Function("localStorage", "document", HOME_BOOT_SCRIPT)(
        { getItem: (k: string) => (k === HOME_STORAGE_KEY ? raw : null) },
        { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
      );
      const expected = parseStoredHome(raw) === null ? {} : { "data-home": "chosen" };
      assert.deepEqual(attrs, expected, String(raw));
    }
  });
});
