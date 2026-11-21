// 동네 고르기에 쓰는 국내 시군구 목록(256곳). 동네 고르기 시트를 열 때 따로 불러온다(useNeighborhoods).
// 첫 화면 JS에 넣지 않는다. 고른 동네는 이름·좌표째 저장해서(home.ts) 첫 화면은 이 목록 없이 카운트다운을 보여준다.
// 검색·가까운 동네 찾기는 데이터가 없는 neighborhood-search.ts에 있다.

import { arrivalUtc, effectiveLongitude } from "./route";
import { ROUTE_YEAR } from "./route-summary";
import { SIGUNGU, type Sigungu } from "./sigungu";

export const KOREA_UTC_OFFSET = 9;

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

/** 시군구 id를 경로의 id로. 세계 도시(gn-)와 겹치지 않게 kr-를 붙인다 */
export const sigunguStopId = (s: Sigungu) => `kr-${s.id}`;

export type Neighborhood = {
  /** 경로의 id와 같다(kr-11440). 도착 순서 목록에서 우리 동네 줄을 찾는다 */
  id: string;
  /** 검색 결과에 크게 보일 이름. 예) "마포구", "수원시 장안구" */
  name: string;
  /** 검색 결과 아래 줄. 예) "서울특별시" */
  sido: string;
  /** 다른 화면에 보일 이름(sigunguLabel). 예) "서울 마포구" */
  label: string;
  lat: number;
  lon: number;
  /** 산타 도착 시각(epoch ms). 경로와 같은 규칙(route.ts) */
  arriveUtc: number;
  /** "내 위치로 찾기"에만 쓰는 먼 섬의 대략 위치(아래 ISLANDS) */
  islands?: { name: string; lat: number; lon: number }[];
};

/**
 * 대표점에서 먼 섬. 대표점(한 점)만 쓰면 가거도·흑산도는 진도군, 연평도는 강화군, 추자도는 진도군이 가장 가깝게 나왔다.
 * "내 위치로 찾기"는 대표점과 이 섬들 중 가장 가까운 점으로 거리를 잰다. 위치는 섬 가운데쯤의 대략 값(소수 둘째 자리)이다.
 * 도착 시각은 그대로 대표점 기준이다(같은 시군구는 한 번에 들른다).
 */
const ISLANDS: Record<string, { name: string; lat: number; lon: number }[]> = {
  "kr-23520": [
    // 인천 옹진군(대표점은 백령도)
    { name: "연평도", lat: 37.66, lon: 125.7 },
    { name: "대청도", lat: 37.83, lon: 124.71 },
    { name: "덕적도", lat: 37.23, lon: 126.13 },
    { name: "자월도", lat: 37.26, lon: 126.31 },
    { name: "영흥도", lat: 37.25, lon: 126.47 },
  ],
  "kr-36680": [
    // 신안군
    { name: "흑산도", lat: 34.68, lon: 125.43 },
    { name: "홍도", lat: 34.68, lon: 125.2 },
    { name: "가거도", lat: 34.07, lon: 125.12 },
    { name: "비금도", lat: 34.76, lon: 125.92 },
    { name: "하의도", lat: 34.61, lon: 126.04 },
    { name: "임자도", lat: 35.08, lon: 126.1 },
  ],
  "kr-39010": [{ name: "추자도", lat: 33.95, lon: 126.32 }], // 제주시
  "kr-37630": [{ name: "독도", lat: 37.24, lon: 131.87 }], // 울릉군
  "kr-36660": [
    // 완도군
    { name: "청산도", lat: 34.18, lon: 126.88 },
    { name: "보길도", lat: 34.15, lon: 126.55 },
    { name: "소안도", lat: 34.16, lon: 126.64 },
  ],
  "kr-36670": [{ name: "조도", lat: 34.3, lon: 126.05 }], // 진도군
  "kr-36020": [
    // 여수시
    { name: "거문도", lat: 34.03, lon: 127.31 },
    { name: "금오도", lat: 34.52, lon: 127.76 },
  ],
  "kr-38050": [
    // 통영시
    { name: "욕지도", lat: 34.63, lon: 128.26 },
    { name: "사량도", lat: 34.84, lon: 128.2 },
    { name: "한산도", lat: 34.78, lon: 128.49 },
  ],
};

export const NEIGHBORHOODS: Neighborhood[] = SIGUNGU.map((s) => {
  const id = sigunguStopId(s);
  return {
    id,
    name: s.name,
    sido: s.sido,
    label: sigunguLabel(s),
    lat: s.lat,
    lon: s.lon,
    arriveUtc: arrivalUtc(effectiveLongitude(s.lon, KOREA_UTC_OFFSET), ROUTE_YEAR),
    ...(ISLANDS[id] && { islands: ISLANDS[id] }),
  };
});
