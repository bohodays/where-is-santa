"use client";

import { useCallback } from "react";
import {
  DEFAULT_HOME,
  HOME_STORAGE_KEY,
  parseStoredHome,
  serializeHome,
  type Home,
} from "@/lib/santa/home";
import type { Neighborhood } from "@/lib/santa/neighborhoods";
import { cacheByRaw, useStoredString } from "./storedValue";

/*
 * 고른 동네(localStorage, storedValue.ts). 서버로 보내지 않는다.
 * 서버 렌더와 첫 화면은 저장 값을 모른다(known: false). 화면은 "우리 동네까지"로 그리고, 바로 저장 값으로 다시 그린다.
 * 기본 동네로 그리면 마포구를 고른 사람도 새로고침 때 잠깐 "서울 중구"를 본다.
 */

// 같은 글자면 같은 객체를 돌려준다. 렌더마다 새 객체면 지도(SantaMap)가 동네가 바뀐 줄 안다
const parse = cacheByRaw(parseStoredHome);

export type HomeState = {
  home: Home;
  /** 사람이 직접 고른 동네인가. false면 기본 동네(서울 중구) */
  chosen: boolean;
  /** 저장 값을 읽었나. 서버 렌더와 첫 화면(hydration)에서는 false라 home은 아직 기본 동네다 */
  known: boolean;
  setHome: (n: Neighborhood) => void;
};

export function useHome(): HomeState {
  const [raw, write] = useStoredString(HOME_STORAGE_KEY);
  const stored = raw === undefined ? null : parse(raw);
  const setHome = useCallback((n: Neighborhood) => write(serializeHome(n)), [write]);
  return {
    home: stored ?? DEFAULT_HOME,
    chosen: stored !== null,
    known: raw !== undefined,
    setHome,
  };
}
