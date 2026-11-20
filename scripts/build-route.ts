// 세계 도시 목록(src/lib/santa/world-cities.ts)을 만든다. 실행: npm run build:route
// 원본: GeoNames cities15000 (인구 1.5만 이상 도시, CC BY 4.0). 저장소 바로 아래 GEONAMES/cities15000.txt에 둔다(.gitignore 대상).
// 도착 시각은 여기서 계산하지 않는다. 화면이 buildRoute()로 계산해서, 도착 규칙은 route.ts 한 곳에만 있다.
// 국내는 GeoNames 대신 시군구 데이터(sigungu.ts)를 쓰므로 한국 도시는 뺀다. 둘을 합치는 곳은 src/lib/santa/stops.ts.
// 근거와 고르는 규칙: docs/data-route.md
import { readFileSync, writeFileSync, writeSync } from "node:fs";

const SOURCE = "GEONAMES/cities15000.txt";
const NAMES_FILE = "scripts/city-names-ko.json";
const OUT = "src/lib/santa/world-cities.ts";

/** 세계 도시 목표 개수(수도 + 인구 순 채우기). 빈 경도 구간 채우기로 조금 늘어날 수 있다 */
const TARGET = 400;
/** 한 나라에서 받는 최대 도시 수(수도 포함). 인구 순으로만 고르면 중국이 3분의 1을 차지한다 */
const PER_COUNTRY = 10;
/** 경도를 이 폭(도)으로 나눠, 도시가 없는 구간은 그 구간에서 가장 큰 도시를 넣는다(태평양 등) */
const BAND_DEG = 5;
/** 큰 도시에서 이보다 가까운 도시는 같은 곳으로 보고 뺀다(뉴욕의 퀸스, 카이로 옆 기자 등). 수도는 늘 넣는다 */
const SAME_PLACE_KM = 50;
/**
 * 도시로 치지 않는 GeoNames 종류. PPLX: 도시 안 구역, PPLQ: 버려진 곳, PPLH: 옛 마을, PPLW: 무너진 곳,
 * PPLF: 농장 마을, PPLR: 종교 시설 마을, STLMT: 정착지
 */
const NOT_CITY = new Set(["PPLX", "PPLQ", "PPLH", "PPLW", "PPLF", "PPLR", "STLMT"]);
/** 시간대(UTC 차이)를 잴 날짜. 산타가 나는 날 기준이라 남반구 서머타임도 반영된다 */
const OFFSET_AT = Date.UTC(2026, 11, 24, 12);

type Row = {
  id: string;
  name: string;
  alt: string[];
  lat: number;
  lon: number;
  code: string; // GeoNames feature code. PPLC = 수도
  cc: string; // 나라 코드
  pop: number;
  tz: string;
};

// GeoNames 덤프 설명서의 열 순서: 0 id, 1 name, 3 alternatenames, 4 lat, 5 lon, 7 feature code, 8 country, 14 population, 17 timezone
function parse(line: string): Row {
  const c = line.split("\t");
  const row = {
    id: c[0],
    name: c[1],
    alt: c[3] ? c[3].split(",") : [],
    lat: Number(c[4]),
    lon: Number(c[5]),
    code: c[7],
    cc: c[8],
    pop: Number(c[14]),
    tz: c[17],
  };
  // 경계에서 검증한다(CLAUDE.md). 열이 밀리거나 빈 값이면 여기서 멈춘다
  if (!/^\d+$/.test(row.id) || !Number.isFinite(row.lat) || !Number.isFinite(row.lon) || !row.tz) {
    throw new Error(`GeoNames 줄을 읽을 수 없음: ${line.slice(0, 80)}`);
  }
  return row;
}

/** 12월 24일 기준 그 시간대의 UTC 차이(시간). 예) Asia/Seoul → 9, America/St_Johns → -3.5 */
function utcOffsetHours(timeZone: string): number {
  const text = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(OFFSET_AT)
    .find((p) => p.type === "timeZoneName")?.value;
  if (text === "GMT") return 0;
  const m = /^GMT([+-])(\d{2}):(\d{2})$/.exec(text ?? "");
  if (!m) throw new Error(`시간대 차이를 읽을 수 없음: ${timeZone} → ${text}`);
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60);
}

/** 두 지점 사이 거리(km). 하버사인 공식(src/lib/santa/describe.ts의 distanceKm과 같다) */
function distanceKm(a: Row, b: Row): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const HANGUL_NAME = /^[가-힣]+( [가-힣]+)*$/;

/**
 * GeoNames 이름 목록에서 한글 이름을 고른다. "충칭 시"처럼 뒤에 붙은 " 시"는 뗀다.
 * 후보가 하나로 모이면 그 이름, 없거나 여러 개면 null(사람이 city-names-ko.json에 정한다).
 */
function hangulName(row: Row): string | null {
  const names = new Set(
    row.alt.filter((n) => HANGUL_NAME.test(n)).map((n) => n.replace(/ 시$/, "")),
  );
  return names.size === 1 ? [...names][0] : null;
}

const rows = readFileSync(SOURCE, "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map(parse)
  .filter((r) => r.cc !== "KR") // 국내는 시군구 데이터
  .filter((r) => !NOT_CITY.has(r.code))
  .sort((a, b) => b.pop - a.pop || Number(a.id) - Number(b.id)); // 인구가 같으면 id 순(실행마다 같은 결과)

// 사람이 정하는 것(scripts/city-names-ko.json)
type NameFile = {
  _설명?: string;
  /** GeoNames id → 한글 이름. GeoNames에 한글 이름이 없거나 여러 개인 도시 */
  names: Record<string, string>;
  /** 나라를 함께 보일 도시(GeoNames id). 이름이 같은 도시는 따로 적지 않아도 나라를 보인다 */
  showCountry: string[];
  /** 나라 코드 → 한글 나라 이름. 적지 않으면 Intl.DisplayNames("ko")의 이름 */
  countryNames: Record<string, string>;
  /** 인구가 1.5만이 안 돼 원본에 없지만 꼭 넣을 곳(키리티마티 등) */
  extra: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    cc: string;
    timezone: string;
    pop: number;
    source: string;
  }[];
  /** 사람이 남기는 메모(스크립트는 읽지 않는다) */
  notes?: Record<string, string>;
};
const nameFile = JSON.parse(readFileSync(NAMES_FILE, "utf8")) as NameFile;

/** 오류를 알리고 멈춘다. process.exit 전에 글자가 다 나가도록 동기로 쓴다(윈도우 파이프에서 잘리는 문제) */
function fail(message: string): never {
  writeSync(2, `${message}\n`);
  process.exit(1);
}

// 0) 꼭 넣을 곳 1) 수도 2) 인구 순(나라당 PER_COUNTRY까지) 3) 빈 경도 구간
const picked = new Map<string, Row>();
const perCountry = new Map<string, number>();
const add = (r: Row) => {
  if (picked.has(r.id)) return;
  picked.set(r.id, r);
  perCountry.set(r.cc, (perCountry.get(r.cc) ?? 0) + 1);
};
for (const e of nameFile.extra) {
  add({
    id: e.id,
    name: e.name,
    alt: [],
    lat: e.lat,
    lon: e.lon,
    code: "PPL",
    cc: e.cc,
    pop: e.pop,
    tz: e.timezone,
  });
}
for (const r of rows) if (r.code === "PPLC") add(r);
// 인구 순으로 보므로, 이미 고른 도시는 모두 지금 도시보다 크다(수도는 예외지만 같은 곳이면 수도를 남긴다)
const nearPicked = (r: Row) => [...picked.values()].some((p) => distanceKm(p, r) < SAME_PLACE_KM);
for (const r of rows) {
  if (picked.size >= TARGET) break;
  if ((perCountry.get(r.cc) ?? 0) < PER_COUNTRY && !nearPicked(r)) add(r);
}
const band = (lon: number) => Math.floor((lon + 180) / BAND_DEG);
const covered = new Set([...picked.values()].map((r) => band(r.lon)));
const gapFills: Row[] = [];
for (const r of rows) {
  if (!covered.has(band(r.lon))) {
    covered.add(band(r.lon));
    add(r);
    gapFills.push(r);
  }
}

// 나라 이름: 사람이 정한 이름 > Intl.DisplayNames("ko")
const regionNames = new Intl.DisplayNames(["ko"], { type: "region" });
function countryName(cc: string): string {
  const name = nameFile.countryNames[cc] ?? regionNames.of(cc);
  if (!name || name === cc) fail(`나라 이름을 모름: ${cc} (${NAMES_FILE}의 countryNames에 적는다)`);
  return name;
}

// 한글 이름: 사람이 정한 이름 > GeoNames의 한글 이름
const missing: Row[] = [];
const cities = [...picked.values()].map((r) => {
  const name = nameFile.names[r.id] ?? hangulName(r);
  if (name === null) missing.push(r);
  return { r, name: name ?? "", country: countryName(r.cc), showCountry: false };
});

if (missing.length > 0) {
  const list = missing.map((r) => {
    const candidates = r.alt.filter((n) => HANGUL_NAME.test(n)).join("/") || "후보 없음";
    return `  "${r.id}": "",  // ${r.name} (${r.cc}, 인구 ${r.pop}) 후보: ${candidates}`;
  });
  fail(
    `한글 이름을 정해야 하는 도시 ${missing.length}곳 (${NAMES_FILE}의 names에 "id": "이름"으로 적는다):\n${list.join("\n")}`,
  );
}

// 나라를 함께 보일 도시: 사람이 고른 도시 + 이름이 같은 도시("킹스턴"은 자메이카에도 노퍽섬에도 있다)
const nameCount = new Map<string, number>();
for (const c of cities) nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);
for (const c of cities) {
  c.showCountry = nameFile.showCountry.includes(c.r.id) || (nameCount.get(c.name) ?? 0) > 1;
}
// 화면 이름("칠레 산티아고")까지 같으면 구분할 수 없다
const labels = cities.map((c) => (c.showCountry ? `${c.country} ${c.name}` : c.name));
const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
if (dupes.length > 0) fail(`나라를 붙여도 이름이 같은 도시가 있음: ${dupes.join(", ")}`);

const unknownIds = [...Object.keys(nameFile.names), ...nameFile.showCountry].filter(
  (id) => !picked.has(id),
);
if (unknownIds.length > 0)
  fail(`${NAMES_FILE}에 고르지 않은 도시가 있음(지운다): ${unknownIds.join(", ")}`);

const lines = cities
  .sort((a, b) => b.r.pop - a.r.pop || Number(a.r.id) - Number(b.r.id))
  .map(
    ({ r, name, country, showCountry }) =>
      `  { id: "gn-${r.id}", name: "${name}", country: "${country}", ${showCountry ? "showCountry: true, " : ""}lat: ${r.lat}, lon: ${r.lon}, utcOffset: ${utcOffsetHours(r.tz)}, cc: "${r.cc}" },`,
  );

const header = `// 자동 생성 파일. 직접 고치지 말고 npm run build:route 를 실행한다(scripts/build-route.ts).
// 원본: GeoNames cities15000 (https://www.geonames.org, CC BY 4.0). 한국은 빼고 sigungu.ts를 쓴다.
// 고른 규칙: 꼭 넣을 곳 + 수도 전부 + 인구 순(나라당 ${PER_COUNTRY}곳까지, 모두 ${TARGET}곳) + 도시가 없는 경도 ${BAND_DEG}도 구간마다 가장 큰 도시. 근거: docs/data-route.md
// 한글 이름·나라 이름: scripts/city-names-ko.json(사람이 정함) > GeoNames 한글 이름·Intl 나라 이름. utcOffset은 2026년 12월 24일 기준.

import type { City } from "./cities";

export type WorldCity = City & {
  country: string; // 나라 이름(한글)
  showCountry?: true; // 화면에 나라를 함께 보인다("칠레 산티아고"). 이름이 같은 도시가 있거나 헷갈리기 쉬운 도시
  cc: string; // 나라 코드(ISO 3166-1)
};

export const WORLD_CITIES: WorldCity[] = [
`;
writeFileSync(OUT, `${header}${lines.join("\n")}\n];\n`);
console.log(
  `${OUT}: 세계 도시 ${cities.length}곳 (꼭 넣을 곳 ${nameFile.extra.length}, 수도 ${[...picked.values()].filter((r) => r.code === "PPLC").length}, 빈 경도 구간 채움 ${gapFills.length}: ${gapFills.map((r) => r.name).join(", ")}, 나라 함께 보임 ${cities.filter((c) => c.showCountry).length})`,
);
