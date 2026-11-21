// 우리 동네(순수 함수). 저장 형식을 만들고 읽는다. 저장·읽기 자체(localStorage)는 useHome이 한다.
// 이름과 좌표를 함께 저장해서, 첫 화면은 시군구 목록(neighborhoods.ts)을 받지 않고 바로 카운트다운을 보여준다.
// 저장 값은 기기 안에서 누구나 고칠 수 있는 외부 데이터라 읽을 때 모양과 범위를 검사한다(CLAUDE.md: 경계에서 검증).

import type { Neighborhood } from "./neighborhoods";
import { arrivalUtc, effectiveLongitude } from "./route";
import { ROUTE_SUMMARY, ROUTE_YEAR } from "./route-summary";

const KOREA_UTC_OFFSET = 9;

/** 화면이 쓰는 우리 동네 */
export type Home = {
  /** 경로의 id(kr-11440). 도착 순서 목록에서 우리 동네 줄을 찾는다 */
  id: string;
  /** 화면 이름. 예) "서울 마포구" */
  name: string;
  lat: number;
  lon: number;
  arriveUtc: number;
};

export const DEFAULT_HOME: Home = {
  id: ROUTE_SUMMARY.defaultHome.id,
  name: ROUTE_SUMMARY.defaultHome.name,
  lat: ROUTE_SUMMARY.defaultHome.lat,
  lon: ROUTE_SUMMARY.defaultHome.lon,
  arriveUtc: ROUTE_SUMMARY.defaultHome.arriveUtc,
};

/** localStorage 키. 저장 형식을 바꾸면 v를 올린다(옛 값은 읽지 않고 기본 동네로) */
export const HOME_STORAGE_KEY = "where-is-santa:home";
const VERSION = 1;

type StoredHome = { v: typeof VERSION; id: string; name: string; lat: number; lon: number };

export function serializeHome(n: Neighborhood): string {
  const stored: StoredHome = { v: VERSION, id: n.id, name: n.label, lat: n.lat, lon: n.lon };
  return JSON.stringify(stored);
}

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * 저장된 글자를 우리 동네로. 없거나 형식이 틀리면 null(기본 동네를 쓴다).
 * 범위: 국내 시군구 id(kr-), 이름 1~30자, 한국 언저리 좌표(독도·마라도 포함). 도착 시각은 저장하지 않고 좌표로 다시 계산한다.
 */
export function parseStoredHome(raw: string | null): Home | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.v !== VERSION) return null;
  const { id, name, lat, lon } = data;
  if (typeof id !== "string" || !/^kr-[\w-]{1,40}$/.test(id)) return null;
  if (typeof name !== "string" || name.length < 1 || name.length > 30) return null;
  if (typeof lat !== "number" || !(lat >= 32 && lat <= 39)) return null;
  if (typeof lon !== "number" || !(lon >= 124 && lon <= 132)) return null;
  return {
    id,
    name,
    lat,
    lon,
    arriveUtc: arrivalUtc(effectiveLongitude(lon, KOREA_UTC_OFFSET), ROUTE_YEAR),
  };
}

/**
 * 첫 화면을 그리기 전에 <head>에서 실행할 짧은 스크립트(app/layout.tsx). 동네를 골랐으면 <html data-home="chosen">.
 * 서버가 그린 첫 화면에는 "지금은 서울 기준이에요" 안내가 늘 들어 있다(동네를 골랐는지 서버는 모른다).
 * 고른 사람에게는 이 속성으로 처음부터 숨긴다(globals.css). React가 뜬 뒤 안내가 생기거나 없어지며 화면이 밀리지 않게.
 * 검사는 parseStoredHome과 같게 둔다(home.test.ts가 실제로 실행해 비교한다).
 * 정규식의 \w는 이 글자(템플릿 문자열) 안이라 \\w로 적는다. \w로 적으면 그냥 w가 되어 모든 동네를 "안 고름"으로 본다.
 */
export const HOME_BOOT_SCRIPT = `(function(){try{var h=JSON.parse(localStorage.getItem(${JSON.stringify(
  HOME_STORAGE_KEY,
)})||"null");if(h&&typeof h==="object"&&!Array.isArray(h)&&h.v===${VERSION}&&typeof h.id==="string"&&/^kr-[\\w-]{1,40}$/.test(h.id)&&typeof h.name==="string"&&h.name.length>=1&&h.name.length<=30&&typeof h.lat==="number"&&h.lat>=32&&h.lat<=39&&typeof h.lon==="number"&&h.lon>=124&&h.lon<=132)document.documentElement.setAttribute("data-home","chosen")}catch(e){}})();`;
