'use client';

import { useEffect, useState } from 'react';
import {
  clockNow,
  estimateClockOffset,
  parseClockConfig,
  withOffset,
  type ClockConfig,
} from '@/lib/santa/clock';

/*
 * 화면에서 쓰는 "현재 시각". 페이지 안에서 시계 하나를 같이 쓴다.
 * - 실제 모드: 처음 쓸 때 서버 응답의 Date 헤더와 비교해 기기 시계를 한 번 보정한다.
 *   CDN 캐시 응답(HIT)도 Date는 현재 시각이라 서버 함수 없이 HEAD 요청으로 충분하다.
 * - 데모 모드: 주소에 ?demo=<ISO 시각>&speed=<배속>을 주면 그 시각부터 배속으로 흐른다. 보정하지 않는다.
 *   예) /?demo=2026-12-25T00:20:00%2B09:00&speed=60
 */
let config: ClockConfig | null = null;
const listeners = new Set<() => void>();

function getConfig(): ClockConfig {
  if (config === null) {
    config = parseClockConfig(window.location.search, Date.now());
    if (config.mode === 'real') void syncWithServer();
  }
  return config;
}

async function syncWithServer(): Promise<void> {
  const sentAt = Date.now();
  try {
    const response = await fetch(window.location.pathname, { method: 'HEAD', cache: 'no-store' });
    const offset = estimateClockOffset({
      sentAt,
      receivedAt: Date.now(),
      serverDate: response.headers.get('date'),
    });
    if (offset === null || config === null) return;
    config = withOffset(config, offset);
    listeners.forEach((notify) => notify());
  } catch {
    // 네트워크가 안 되면 기기 시계를 그대로 쓴다
  }
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
    listeners.add(update); // 보정값이 들어오면 바로 다시 그린다
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
