// 산타가 들르는 곳 전체: 세계 도시(world-cities.ts, GeoNames) + 국내 시군구(sigungu.ts, SGIS).
// 국내는 시군구마다 들러서 "우리 동네" 도착 시각이 경로와 정확히 맞는다. 도착 시각은 buildRoute()가 계산한다.

import type { City } from "./cities";
import { SIGUNGU, type Sigungu } from "./sigungu";
import { WORLD_CITIES, type WorldCity } from "./world-cities";

const KOREA_UTC_OFFSET = 9;

/** 시도 이름을 짧게. 화면 문장("지금 산타는 서울 마포구 상공")에 쓴다 */
const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

/**
 * 시군구를 화면에 보일 이름으로. 이름만으로 어디인지 알 수 있게 한다.
 * - 특별시·광역시의 구·군: 시도를 붙인다("서울 마포구", "인천 강화군"). 중구·동구는 여러 시에 있다
 * - 세종: "세종"
 * - 도의 시·군: 그대로("춘천시", "수원시 장안구"). 다른 도에 같은 이름이 있으면 도를 붙인다("강원 고성군")
 */
export function sigunguLabel(s: Sigungu, all: Sigungu[] = SIGUNGU): string {
  const short = SIDO_SHORT[s.sido];
  if (!short) throw new Error(`모르는 시도: ${s.sido}`);
  if (s.sido === "세종특별자치시") return "세종";
  if (s.sido.endsWith("시")) return `${short} ${s.name}`;
  const sameName = all.some((o) => o.name === s.name && o.sido !== s.sido);
  return sameName ? `${short} ${s.name}` : s.name;
}

/**
 * 세계 도시를 화면에 보일 이름으로. 나라를 함께 보일 도시는 "칠레 산티아고"처럼 나라를 앞에 붙인다(시군구의 "강원 고성군"과 같은 순서).
 * 이름이 같은 도시(킹스턴, 하이데라바드)와 헷갈리기 쉬운 도시(다카·다카르)는 생성 스크립트가 showCountry를 켠다.
 */
export function worldCityLabel(c: WorldCity): string {
  return c.showCountry ? `${c.country} ${c.name}` : c.name;
}

/** 시군구 id를 경로의 id로. 세계 도시(gn-)와 겹치지 않게 kr-를 붙인다 */
export const sigunguStopId = (s: Sigungu) => `kr-${s.id}`;

export const STOPS: City[] = [
  ...WORLD_CITIES.map((c) => ({
    id: c.id,
    name: worldCityLabel(c),
    lat: c.lat,
    lon: c.lon,
    utcOffset: c.utcOffset,
  })),
  ...SIGUNGU.map((s) => ({
    id: sigunguStopId(s),
    name: sigunguLabel(s),
    lat: s.lat,
    lon: s.lon,
    utcOffset: KOREA_UTC_OFFSET,
  })),
];

/** 동네를 고르기 전 기본 동네: 서울 중구(서울시청). 화면 문구는 "서울 기준" */
export const DEFAULT_HOME_ID = "kr-11020";
