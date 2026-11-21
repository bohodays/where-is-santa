"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * localStorage에 글자로 저장하는 값(고른 동네, 설정). 이 기기 브라우저에만 두고 서버로 보내지 않는다(CLAUDE.md 개인정보).
 * useSyncExternalStore: React 밖에 있는 값(localStorage)을 읽는 React의 방법.
 * - 서버 렌더와 첫 화면(hydration)은 저장 값을 모른다(undefined). 바로 저장 값으로 다시 그린다
 * - 다른 탭에서 바꾸면(storage 이벤트) 이 탭도 따라 바뀐다
 * localStorage는 사생활 보호 모드·차단 설정에서 오류를 낼 수 있어 늘 try/catch로 감싼다. 그때는 이번 방문 동안만 기억한다.
 */

const CHANGE_EVENT = "where-is-santa:stored-change";
/** localStorage를 못 쓸 때 이번 방문 동안만 기억하는 값 */
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장할 수 없으면 이번 방문 동안만(memory)
  }
  // storage 이벤트는 바꾼 탭에는 오지 않아서 이 탭에도 알린다
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function subscribeTo(key: string) {
  return (onChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) onChange();
    };
    const onLocal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onLocal);
    };
  };
}

const subscribers = new Map<string, ReturnType<typeof subscribeTo>>();

/**
 * 저장된 글자와 쓰기 함수. 글자는 서버 렌더·첫 화면에서 undefined(아직 모름), 저장 값이 없으면 null.
 * 글자가 같으면 같은 값이라 쓰는 쪽이 글자 기준으로 캐시하면 렌더마다 새 객체가 생기지 않는다.
 */
export function useStoredString(
  key: string,
): [raw: string | null | undefined, write: (value: string) => void] {
  let subscribe = subscribers.get(key);
  if (!subscribe) {
    subscribe = subscribeTo(key);
    subscribers.set(key, subscribe);
  }
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => read(key),
    () => undefined,
  );
  const set = useCallback((value: string) => write(key, value), [key]);
  return [raw, set];
}

/** 글자 → 값 변환을 글자 기준으로 한 번만(같은 글자면 같은 객체) */
export function cacheByRaw<T>(parse: (raw: string | null) => T) {
  let lastRaw: string | null | undefined;
  let last: T;
  let filled = false;
  return (raw: string | null): T => {
    if (!filled || raw !== lastRaw) {
      lastRaw = raw;
      last = parse(raw);
      filled = true;
    }
    return last;
  };
}
