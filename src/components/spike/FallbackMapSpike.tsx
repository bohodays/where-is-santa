'use client';

// 지도 장애 대응 시험(A+B). 본 화면 코드가 아니다. 시험이 끝나면 지운다.
// A: 지도 JS를 못 불러오면 글자(카운트다운)만 남긴다.
// B: OpenFreeMap 스타일·타일이 실패하거나 응답이 없으면 자체 윤곽 지도(Natural Earth)로 바꾼다.
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CITIES } from '@/lib/santa/cities';
import { buildRoute } from '@/lib/santa/route';
import { santaAt } from '@/lib/santa/santa';
import { useClock } from '@/hooks/useNow';

const ROUTE = buildRoute(CITIES, 2026);
const TILE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_TIMEOUT_MS = 10_000; // 이 안에 타일 지도가 안 뜨면 윤곽 지도로
const TILE_ERROR_LIMIT = 3; // 타일 오류가 이만큼 쌓이면 윤곽 지도로
const MAX_LAT = 85;

const OUTLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: { land: { type: 'geojson', data: '/maps/ne_110m_land.json' } },
  layers: [
    { id: 'ocean', type: 'background', paint: { 'background-color': '#dfe7ef' } },
    { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#f7f5f0', 'fill-outline-color': '#b8c2cc' } },
  ],
};

type MapState = 'loading' | 'tiles' | 'outline' | 'none';

export function FallbackMapSpike() {
  const read = useClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MapState>('loading');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const container = containerRef.current;
    if (!read || !container) return;
    const startedAt = performance.now();
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let raf = 0;
    let timer = 0;

    const santaLngLat = (): [number, number] => {
      const s = santaAt(read(), ROUTE);
      return [s.lon, Math.max(-MAX_LAT, Math.min(MAX_LAT, s.lat))];
    };

    void (async () => {
      let lib: typeof import('maplibre-gl');
      try {
        lib = await import('maplibre-gl');
      } catch {
        if (!cancelled) {
          setState('none');
          setDetail('지도 JS를 불러오지 못함');
        }
        return;
      }
      if (cancelled) return;

      lib.setWorkerUrl(`/maplibre/maplibre-gl-worker-${lib.getVersion()}.js`);
      const created = new lib.Map({
        container,
        style: TILE_STYLE,
        center: santaLngLat(),
        zoom: 1.4,
        attributionControl: { compact: true },
      });
      map = created;

      let mode: 'tiles' | 'outline' = 'tiles';
      let tileErrors = 0;
      const elapsed = () => `${Math.round(performance.now() - startedAt).toLocaleString('ko-KR')}ms`;
      const toOutline = (reason: string) => {
        if (mode === 'outline') return;
        mode = 'outline';
        window.clearTimeout(timer);
        created.setStyle(OUTLINE_STYLE);
        setState('outline');
        setDetail(`${reason} → 윤곽 지도로 전환 (${elapsed()})`);
      };

      timer = window.setTimeout(() => {
        if (!created.isStyleLoaded()) toOutline(`${STYLE_TIMEOUT_MS / 1000}초 동안 응답 없음`);
      }, STYLE_TIMEOUT_MS);

      created.on('load', () => {
        if (mode !== 'tiles') return;
        window.clearTimeout(timer);
        setState('tiles');
        setDetail(`타일 지도 준비 (${elapsed()})`);
      });
      created.on('error', (event) => {
        if (mode === 'outline') return;
        const sourceId = (event as { sourceId?: unknown }).sourceId;
        if (!created.isStyleLoaded() && sourceId === undefined) {
          toOutline('스타일을 불러오지 못함');
        } else if (typeof sourceId === 'string' && ++tileErrors >= TILE_ERROR_LIMIT) {
          toOutline(`타일 오류 ${tileErrors}번`);
        }
      });

      const el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText =
        'width:18px;height:18px;border-radius:50%;background:#d6453b;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)';
      const marker = new lib.Marker({ element: el }).setLngLat(santaLngLat()).addTo(created);
      const loop = () => {
        marker.setLngLat(santaLngLat());
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      map?.remove();
    };
  }, [read]);

  return (
    <section className="flex flex-col gap-2">
      <div
        ref={containerRef}
        data-map-state={state}
        className={`h-[55vh] w-full overflow-hidden rounded-3xl bg-[#dfe7ef] ${state === 'none' ? 'hidden' : ''}`}
      />
      {state === 'none' && (
        <p className="rounded-2xl bg-white/10 p-4 text-[15px] text-white">
          지도를 불러오지 못했어요. 산타 소식은 위에서 계속 볼 수 있어요.
        </p>
      )}
      <p className="text-[13px] text-white/80" data-map-detail>
        시험 정보: 지도 상태 {state} {detail && `· ${detail}`}
      </p>
    </section>
  );
}
