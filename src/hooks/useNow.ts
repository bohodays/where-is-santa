"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  clockNow,
  demoSearch,
  estimateClockOffset,
  parseClockConfig,
  retimeDemoClock,
  startDemoClock,
  withOffset,
  type ClockConfig,
} from "@/lib/santa/clock";
import { sheetEntryOnTop } from "./sheetHistory";

/*
 * 화면에서 쓰는 "현재 시각". 페이지 안에서 시계 하나를 같이 쓴다.
 * - 실제 모드: 처음 쓸 때 서버 응답의 Date 헤더와 비교해 기기 시계를 한 번 보정한다.
 *   CDN 캐시 응답(HIT)도 Date는 현재 시각이라 서버 함수 없이 HEAD 요청으로 충분하다.
 * - 데모 모드: 주소에 ?demo=<ISO 시각>&speed=<배속>을 주면 그 시각부터 배속으로 흐른다. 보정하지 않는다.
 *   예) /?demo=2026-12-25T00:20:00%2B09:00&speed=60
 *   화면의 데모 패널(startDemo·changeDemoSpeed·stopDemo)로도 켜고 끈다. 그때 주소도 같이 바꿔서 새로고침해도 이어진다.
 */
let config: ClockConfig | null = null;
const listeners = new Set<() => void>();
/** 서버와 비교해 구한 기기 시계 보정값. 데모를 끄고 실제 시각으로 돌아올 때 다시 쓴다 */
let realOffsetMs = 0;
let syncStarted = false;
/** 시트가 열려 있어 주소 바꾸기를 미뤄 두었나(아래 writeUrl) */
let urlPending = false;

function getConfig(): ClockConfig {
  if (config === null) {
    config = parseClockConfig(window.location.search, Date.now());
    if (config.mode === "real") void syncWithServer();
    // 시트가 닫히며 방문 기록 칸이 빠지면(popstate), 미뤄 둔 주소 바꾸기를 바로 한다.
    // 늦추면 안 된다: Next.js 라우터도 popstate에서 주소를 읽어 나중에 그 주소로 되돌려 쓴다. 바로 쓰면 라우터가 그 뒤에 우리 주소를 받는다.
    // 시트는 한 번에 하나라 미뤄 둔 동안의 popstate는 곧 시트 칸이 빠진 것이다(뒤로 가기로 닫을 때는 시트가 아직 수를 줄이기 전이라 수를 보지 않는다)
    window.addEventListener("popstate", () => {
      if (urlPending) writeUrl(true);
    });
  }
  return config;
}

async function syncWithServer(): Promise<void> {
  syncStarted = true;
  const sentAt = Date.now();
  try {
    const response = await fetch(window.location.pathname, { method: "HEAD", cache: "no-store" });
    const offset = estimateClockOffset({
      sentAt,
      receivedAt: Date.now(),
      serverDate: response.headers.get("date"),
    });
    if (offset === null || config === null) return;
    realOffsetMs = offset;
    config = withOffset(config, offset); // 데모 중이면 그대로 둔다
    notify();
  } catch {
    // 네트워크가 안 되면 기기 시계를 그대로 쓴다
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * 주소의 ?demo=&speed=를 지금 시계에 맞춘다(방문 기록은 늘리지 않는다).
 * 시트가 더한 방문 기록 칸 위에서 바꾸면 시트를 닫을 때 그 칸과 함께 사라지므로, 그 칸이 빠질 때(popstate)까지 미룬다.
 */
function writeUrl(sheetJustPopped = false): void {
  if (config === null) return;
  if (!sheetJustPopped && sheetEntryOnTop()) {
    urlPending = true;
    return;
  }
  urlPending = false;
  const { pathname, search, hash } = window.location;
  const next = demoSearch(search, config, Date.now());
  if (next !== search)
    window.history.replaceState(window.history.state, "", pathname + next + hash);
}

/** 화면의 데모 조작으로 시계를 바꾼다. <html data-demo>(맨 위 "데모 모드" 띠)와 주소도 같이 맞춘다 */
function setConfig(next: ClockConfig): void {
  config = next;
  if (next.mode === "demo") document.documentElement.setAttribute("data-demo", "on");
  else document.documentElement.removeAttribute("data-demo");
  writeUrl();
  notify();
}

/** 우리 동네 도착(homeArriveUtc) 20분 전으로 시간 이동해 speed배로 흐르게 한다 */
export function startDemo(homeArriveUtc: number, speed: number): void {
  getConfig();
  setConfig(startDemoClock(homeArriveUtc, speed, Date.now()));
}

/** 데모 중 배속만 바꾼다. 지금 데모 시각에서 이어서 흐른다 */
export function changeDemoSpeed(speed: number): void {
  setConfig(retimeDemoClock(getConfig(), speed, Date.now()));
}

/** 데모를 끝내고 실제 시각(서버로 보정한 시계)으로 돌아간다 */
export function stopDemo(): void {
  setConfig({ mode: "real", offsetMs: realOffsetMs });
  // 데모 주소로 들어와 아직 서버와 비교한 적이 없으면 지금 한다
  if (!syncStarted) void syncWithServer();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 지금 시계 설정(실제/데모, 배속). 데모 띠와 데모 패널이 쓴다. 서버 렌더와 첫 렌더에서는 null.
 * 시각처럼 1초마다 바뀌지 않고, 데모를 켜고 끄거나 보정값이 들어올 때만 다시 그린다.
 */
export function useClockConfig(): ClockConfig | null {
  return useSyncExternalStore(subscribe, getConfig, () => null);
}

function readNow(): number {
  return clockNow(getConfig(), Date.now());
}

/**
 * 1초(tickMs)마다 바뀌는 현재 시각. 글자로 보여주는 화면은 이걸 쓴다.
 * 서버 렌더와 브라우저 시각이 달라 생기는 불일치를 피하려고 처음 렌더에서는 null이다.
 */
export function useNow(tickMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(readNow());
    update();
    listeners.add(update); // 보정값이 들어오거나 데모를 켜고 끄면 바로 다시 그린다
    const id = window.setInterval(update, tickMs);
    return () => {
      window.clearInterval(id);
      listeners.delete(update);
    };
  }, [tickMs]);

  return now;
}

/**
 * 프레임마다 시각이 필요한 애니메이션(requestAnimationFrame)용.
 * 다시 렌더하지 않고, 부를 때마다 보정된 현재 시각을 돌려주는 함수를 준다. 마운트 전에는 null.
 */
export function useClock(): (() => number) | null {
  const [read, setRead] = useState<(() => number) | null>(null);

  useEffect(() => {
    getConfig();
    setRead(() => readNow);
  }, []);

  return read;
}
