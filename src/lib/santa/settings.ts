// 설정(순수 함수). 저장 형식을 만들고 읽고, 화면에 켤 <html> 속성을 정한다. 저장·적용은 useSettings가 한다.
// 저장 값은 기기 안에서 누구나 고칠 수 있는 외부 데이터라 칸마다 검사하고, 틀린 칸만 기본값으로 둔다.

import type { MapToneSetting } from "./sun";

export type Settings = {
  /** 지도 밝기. 자동 = 우리 동네 해 기준(useMapTone) */
  mapTone: MapToneSetting;
  largeText: boolean;
  highContrast: boolean;
  /** 움직임 줄이기. null = 기기 설정(prefers-reduced-motion)을 따른다 */
  reduceMotion: boolean | null;
};

export const DEFAULT_SETTINGS: Settings = {
  mapTone: "auto",
  largeText: false,
  highContrast: false,
  reduceMotion: null,
};

/** localStorage 키. 저장 형식을 바꾸면 v를 올린다 */
export const SETTINGS_STORAGE_KEY = "where-is-santa:settings";
const VERSION = 1;

export function serializeSettings(s: Settings): string {
  return JSON.stringify({ v: VERSION, ...s });
}

const MAP_TONES: readonly MapToneSetting[] = ["auto", "day", "night"];

/** 저장된 글자를 설정으로. 없거나 망가졌으면 기본값, 칸 하나만 틀리면 그 칸만 기본값 */
export function parseStoredSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return DEFAULT_SETTINGS;
  const d = data as Record<string, unknown>;
  if (d.v !== VERSION) return DEFAULT_SETTINGS;
  return {
    mapTone: MAP_TONES.includes(d.mapTone as MapToneSetting)
      ? (d.mapTone as MapToneSetting)
      : DEFAULT_SETTINGS.mapTone,
    largeText: typeof d.largeText === "boolean" ? d.largeText : DEFAULT_SETTINGS.largeText,
    highContrast:
      typeof d.highContrast === "boolean" ? d.highContrast : DEFAULT_SETTINGS.highContrast,
    reduceMotion:
      typeof d.reduceMotion === "boolean" || d.reduceMotion === null
        ? d.reduceMotion
        : DEFAULT_SETTINGS.reduceMotion,
  };
}

/** 움직임 줄이기가 실제로 켜져 있나(저장 값이 없으면 기기 설정) */
export const motionReduced = (s: Settings, deviceReduced: boolean): boolean =>
  s.reduceMotion ?? deviceReduced;

/**
 * 움직임 줄이기 스위치를 바꿨을 때 저장할 값. 기기 설정과 같아지면 null로 돌아가
 * 다시 기기 설정을 따른다(기기에서 설정을 바꾸면 함께 바뀐다).
 */
export function nextReduceMotion(wanted: boolean, deviceReduced: boolean): boolean | null {
  return wanted === deviceReduced ? null : wanted;
}

/**
 * 설정을 <html> 속성으로(docs/design-tokens.md). null이면 속성을 지운다.
 * data-motion: "reduce" = 켬, "full" = 기기가 줄이기여도 사람이 끔. 없으면 기기 설정(CSS 미디어 쿼리)을 따른다.
 * 지도 밝기(data-map-tone)는 시각과 동네가 필요해서 useMapTone이 따로 켠다.
 */
export function settingsAttributes(s: Settings): Record<string, string | null> {
  return {
    "data-text-size": s.largeText ? "large" : null,
    "data-contrast": s.highContrast ? "high" : null,
    "data-motion": s.reduceMotion === null ? null : s.reduceMotion ? "reduce" : "full",
  };
}

/**
 * 첫 화면을 그리기 전에 <head>에서 실행할 짧은 스크립트(app/layout.tsx).
 * React가 뜬 뒤에 큰 글씨를 켜면 화면이 한 번 그려진 뒤 커지면서 밀린다(레이아웃 이동). 그래서 그리기 전에 속성을 켠다.
 * 검사와 속성 이름은 위 함수와 같게 둔다(settings.test.ts가 실제로 실행해 확인한다).
 */
export const SETTINGS_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_STORAGE_KEY,
)})||"null");if(!s||s.v!==${VERSION})return;var d=document.documentElement;if(s.largeText===true)d.setAttribute("data-text-size","large");if(s.highContrast===true)d.setAttribute("data-contrast","high");if(s.reduceMotion===true)d.setAttribute("data-motion","reduce");if(s.reduceMotion===false)d.setAttribute("data-motion","full")}catch(e){}})();`;
