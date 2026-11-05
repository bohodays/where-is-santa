'use client';

import { useEffect, useState } from 'react';

/**
 * 화면에서 쓰는 "현재 시각".
 * 데모 모드: URL에 ?demo=<ISO 시각>&speed=<배속> 을 주면 그 시각부터 배속으로 흐른다.
 * 예) /?demo=2026-12-25T00:20:00%2B09:00&speed=60
 *
 * 서버 렌더 시각과 브라우저 시각이 달라 생기는 불일치를 피하려고
 * 처음 렌더에서는 null을 돌려주고, 마운트 후부터 값을 채운다.
 */
export function useNow(tickMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    const speed = Number(params.get('speed') ?? '1') || 1;
    const demoStart = demo ? Date.parse(demo) : NaN;
    const realStart = Date.now();
    const base = Number.isFinite(demoStart) ? demoStart : realStart;

    const read = () => base + (Date.now() - realStart) * (Number.isFinite(demoStart) ? speed : 1);
    setNow(read());
    const id = window.setInterval(() => setNow(read()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}
