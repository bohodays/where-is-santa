// 산타가 들르는 곳 전체: 세계 도시(world-cities.ts, GeoNames) + 국내 시군구(sigungu.ts, SGIS).
// 국내는 시군구마다 들러서 "우리 동네" 도착 시각이 경로와 정확히 맞는다. 도착 시각은 buildRoute()가 계산한다.

import type { City } from "./cities";
import { KOREA_UTC_OFFSET, sigunguLabel, sigunguStopId } from "./neighborhoods";
import { SIGUNGU } from "./sigungu";
import { WORLD_CITIES, type WorldCity } from "./world-cities";

// 시군구 이름 붙이기는 동네 고르기도 쓴다(neighborhoods.ts). 테스트·다른 코드가 여기서 부르던 이름을 그대로 둔다
export { sigunguLabel };

/**
 * 세계 도시를 화면에 보일 이름으로. 나라를 함께 보일 도시는 "칠레 산티아고"처럼 나라를 앞에 붙인다(시군구의 "강원 고성군"과 같은 순서).
 * 이름이 같은 도시(킹스턴, 하이데라바드)와 헷갈리기 쉬운 도시(다카·다카르)는 생성 스크립트가 showCountry를 켠다.
 */
export function worldCityLabel(c: WorldCity): string {
  return c.showCountry ? `${c.country} ${c.name}` : c.name;
}

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
