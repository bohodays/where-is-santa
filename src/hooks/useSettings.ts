"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  motionReduced,
  nextReduceMotion,
  parseStoredSettings,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  settingsAttributes,
  type Settings,
} from "@/lib/santa/settings";
import { cacheByRaw, useStoredString } from "./storedValue";

/*
 * 설정(localStorage, storedValue.ts). 큰 글씨·고대비·움직임 줄이기는 <html> 속성으로 바로 반영한다(docs/design-tokens.md).
 * 첫 화면은 layout.tsx의 짧은 스크립트(SETTINGS_BOOT_SCRIPT)가 그리기 전에 같은 속성을 켠다. 여기서는 바뀔 때 맞춘다.
 * 지도 밝기는 시각·동네가 필요해서 useMapTone(now, home, settings.mapTone)이 켠다.
 */

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const parse = cacheByRaw(parseStoredSettings);

function subscribeDevice(onChange: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** 기기의 "동작 줄이기"가 켜져 있나. 서버 렌더에서는 모르므로 false */
function useDeviceReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeDevice,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

/**
 * 지금 움직임을 줄여야 하나(자바스크립트로 움직이는 것용: 지도 이동 등). CSS는 같은 규칙을 globals.css가 따른다.
 * 설정이 <html data-motion>에 있으면 그것, 없으면 기기 설정.
 */
export function isMotionReduced(): boolean {
  const motion = document.documentElement.dataset.motion;
  if (motion === "reduce") return true;
  if (motion === "full") return false;
  return window.matchMedia(REDUCE_QUERY).matches;
}

export type SettingsState = {
  settings: Settings;
  /** 움직임 줄이기가 실제로 켜져 있나(저장 값, 없으면 기기 설정) */
  reduceMotion: boolean;
  /** 기기 설정이 움직임 줄이기인가(설정 화면 설명 글자용) */
  deviceReducedMotion: boolean;
  update: (patch: Partial<Omit<Settings, "reduceMotion">>) => void;
  /** 움직임 줄이기 스위치. 기기 설정과 같아지면 다시 기기 설정을 따른다 */
  setReduceMotion: (on: boolean) => void;
};

export function useSettings(): SettingsState {
  const [raw, write] = useStoredString(SETTINGS_STORAGE_KEY);
  const known = raw !== undefined;
  const settings = known ? parse(raw) : DEFAULT_SETTINGS;
  const deviceReducedMotion = useDeviceReducedMotion();

  // 저장 값을 읽은 뒤에만 속성을 맞춘다. 그 전에 맞추면 첫 화면 스크립트가 켠 속성을 기본값으로 지워 버린다
  useEffect(() => {
    if (!known) return;
    const html = document.documentElement;
    for (const [name, value] of Object.entries(settingsAttributes(settings))) {
      if (value === null) html.removeAttribute(name);
      else html.setAttribute(name, value);
    }
  }, [known, settings]);

  const update = useCallback(
    (patch: Partial<Omit<Settings, "reduceMotion">>) =>
      write(serializeSettings({ ...settings, ...patch })),
    [settings, write],
  );
  const setReduceMotion = useCallback(
    (on: boolean) =>
      write(
        serializeSettings({ ...settings, reduceMotion: nextReduceMotion(on, deviceReducedMotion) }),
      ),
    [settings, deviceReducedMotion, write],
  );

  return {
    settings,
    reduceMotion: motionReduced(settings, deviceReducedMotion),
    deviceReducedMotion,
    update,
    setReduceMotion,
  };
}
