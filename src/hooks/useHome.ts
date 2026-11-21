"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_HOME,
  HOME_STORAGE_KEY,
  parseStoredHome,
  serializeHome,
  type Home,
} from "@/lib/santa/home";
import type { Neighborhood } from "@/lib/santa/neighborhoods";

/*
 * 고른 동네(localStorage). 이 기기 브라우저에만 저장하고 서버로 보내지 않는다(CLAUDE.md 개인정보).
 * useSyncExternalStore: React 밖에 있는 값(localStorage)을 읽는 React의 방법.
 * - 서버 렌더와 첫 화면(hydration)은 저장 값을 모른다(known: false). 화면은 "우리 동네까지"로 그리고, 바로 저장 값으로 다시 그린다.
 *   기본 동네로 그리면 마포구를 고른 사람도 새로고침 때 잠깐 "서울 중구"를 본다
 * - 다른 탭에서 동네를 바꾸면(storage 이벤트) 이 탭도 따라 바뀐다
 * localStorage는 사생활 보호 모드·차단 설정에서 오류를 낼 수 있어 늘 try/catch로 감싼다. 그때는 이번 방문 동안만 기억한다.
 */

const CHANGE_EVENT = "where-is-santa:home-change";
/** localStorage를 못 쓸 때 이번 방문 동안만 기억하는 값 */
let memoryValue: string | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(HOME_STORAGE_KEY) ?? memoryValue;
  } catch {
    return memoryValue;
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === HOME_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage); // 다른 탭
  window.addEventListener(CHANGE_EVENT, onChange); // 이 탭(storage 이벤트는 바꾼 탭에는 오지 않는다)
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 서버 렌더·첫 화면: 아직 저장 값을 모른다 */
const UNKNOWN = undefined;

// 같은 글자면 같은 객체를 돌려준다. 렌더마다 새 객체면 지도(SantaMap)가 동네가 바뀐 줄 안다
let cachedRaw: string | null = null;
let cachedHome: Home | null = null;
function parseCached(raw: string | null): Home | null {
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedHome = parseStoredHome(raw);
  }
  return cachedHome;
}

export type HomeState = {
  home: Home;
  /** 사람이 직접 고른 동네인가. false면 기본 동네(서울 중구) */
  chosen: boolean;
  /** 저장 값을 읽었나. 서버 렌더와 첫 화면(hydration)에서는 false라 home은 아직 기본 동네다 */
  known: boolean;
  setHome: (n: Neighborhood) => void;
};

export function useHome(): HomeState {
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, readRaw, () => UNKNOWN);
  const stored = raw === UNKNOWN ? null : parseCached(raw);

  const setHome = useCallback((n: Neighborhood) => {
    const value = serializeHome(n);
    memoryValue = value;
    try {
      window.localStorage.setItem(HOME_STORAGE_KEY, value);
    } catch {
      // 저장할 수 없으면 이번 방문 동안만(memoryValue)
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { home: stored ?? DEFAULT_HOME, chosen: stored !== null, known: raw !== UNKNOWN, setHome };
}
