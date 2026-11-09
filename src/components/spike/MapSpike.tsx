'use client';

// 지도 성능 시험용 화면. 본 화면 코드가 아니다. 시험이 끝나면 지운다.
// 측정 목표(기획서): 모바일 LCP 2.5초 이내, 저사양 폰에서 산타 이동 60fps.
import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, getVersion, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CITIES } from '@/lib/santa/cities';
import { buildRoute, type Stop } from '@/lib/santa/route';
import { greatCircle, santaAt } from '@/lib/santa/santa';
import { useNow } from '@/hooks/useNow';

const ROUTE = buildRoute(CITIES, 2026);
const STYLES = {
  positron: 'https://tiles.openfreemap.org/styles/positron',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
} as const;
type StyleName = keyof typeof STYLES;
const DEMO_QUERY = '?demo=2026-12-25T00:20:00%2B09:00&speed=60';
const STEPS_PER_HOP = 16; // 구간마다 대권 경로를 몇 점으로 그릴지
const MAX_LAT = 85; // 메르카토르 지도는 극지방을 그릴 수 없다
const LONG_FRAME_MS = 50;

type LngLat = [number, number];
type Options = {
  style: StyleName;
  marker: 'dom' | 'layer';
  follow: boolean;
  speed: number;
  hasDemo: boolean;
};
type Metrics = {
  lcp: number | null;
  fcp: number | null;
  mapLoad: number | null;
  mapIdle: number | null;
  fpsNow: number;
  fpsAvg: number;
  fpsMin: number | null;
  longFrames: number;
  jsKB: number;
  jsFiles: number;
  tileRequests: number;
};
type LineData = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'MultiLineString'; coordinates: LngLat[][] };
};
type PointData = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'Point'; coordinates: LngLat };
};

function readOptions(): Options {
  const p = new URLSearchParams(window.location.search);
  const style = p.get('style');
  return {
    style: style && style in STYLES ? (style as StyleName) : 'positron',
    marker: p.get('marker') === 'layer' ? 'layer' : 'dom',
    follow: p.get('follow') === '1',
    // useNow는 배속을 밖으로 알려주지 않아서, 프레임 사이 보간에 쓰려고 같은 규칙으로 다시 읽는다.
    // (시험에서 확인할 점: 본 구현에서는 useNow가 보간에 필요한 값을 함께 내줘야 한다)
    speed: p.get('demo') ? Number(p.get('speed') ?? '1') || 1 : 1,
    hasDemo: p.get('demo') !== null,
  };
}

/** 두 도시 사이 대권 경로를 점으로. until(0~1)까지만 */
function hopPoints(a: Stop, b: Stop, until = 1): LngLat[] {
  const points: LngLat[] = [];
  for (let k = 0; k <= STEPS_PER_HOP; k++) {
    const t = k / STEPS_PER_HOP;
    if (t > until) break;
    const p = greatCircle(a, b, t);
    points.push([p.lon, p.lat]);
  }
  return points;
}

/** 날짜변경선(±180)을 건너는 곳에서 선을 끊는다. 안 끊으면 지구를 가로지르는 선이 그려진다 */
function splitAtDateline(points: LngLat[]): LngLat[][] {
  const lines: LngLat[][] = [];
  let current: LngLat[] = [];
  for (const point of points) {
    const last = current.at(-1);
    if (last && Math.abs(point[0] - last[0]) > 180) {
      const unwrapped = point[0] + (point[0] < last[0] ? 360 : -360);
      const edge = unwrapped > last[0] ? 180 : -180;
      const ratio = (edge - last[0]) / (unwrapped - last[0]);
      const lat = last[1] + (point[1] - last[1]) * ratio;
      current.push([edge, lat]);
      lines.push(current);
      current = [[-edge, lat]];
    }
    current.push(point);
  }
  if (current.length > 1) lines.push(current);
  return lines;
}

function line(points: LngLat[]): LineData {
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: splitAtDateline(points) } };
}

function point(lngLat: LngLat): PointData {
  return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: lngLat } };
}

const FULL_ROUTE = line(ROUTE.slice(0, -1).flatMap((stop, i) => hopPoints(stop, ROUTE[i + 1])));

function traveledLine(now: number): LineData {
  const santa = santaAt(now, ROUTE);
  if (!santa.prev) return line([]);
  const i = ROUTE.indexOf(santa.prev);
  const points = ROUTE.slice(0, i).flatMap((stop, h) => hopPoints(stop, ROUTE[h + 1]));
  if (santa.status === 'flying' && santa.next) {
    points.push(...hopPoints(santa.prev, santa.next, santa.progress), [santa.lon, santa.lat]);
  } else {
    points.push([santa.prev.lon, santa.prev.lat]);
  }
  return line(points);
}

function santaLngLat(now: number): LngLat {
  const s = santaAt(now, ROUTE);
  return [s.lon, Math.max(-MAX_LAT, Math.min(MAX_LAT, s.lat))];
}

const EMPTY_METRICS: Metrics = {
  lcp: null,
  fcp: null,
  mapLoad: null,
  mapIdle: null,
  fpsNow: 0,
  fpsAvg: 0,
  fpsMin: null,
  longFrames: 0,
  jsKB: 0,
  jsFiles: 0,
  tileRequests: 0,
};

const ms = (v: number | null) => (v === null ? '-' : `${Math.round(v).toLocaleString('ko-KR')}ms`);

export function MapSpike() {
  const now = useNow();
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<{ base: number; at: number } | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [copied, setCopied] = useState(false);

  // useNow 값(1초마다)을 기준점으로 두고, 프레임마다 그 사이를 보간한다
  useEffect(() => {
    if (now !== null) clockRef.current = { base: now, at: performance.now() };
  }, [now]);

  useEffect(() => setOptions(readOptions()), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!options || !options.hasDemo || !container) return;

    const stats = { lcp: null as number | null, mapLoad: null as number | null, mapIdle: null as number | null };
    const lcpObserver = new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (last) stats.lcp = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    setWorkerUrl(`/maplibre/maplibre-gl-worker-${getVersion()}.js`);
    const clock = () => {
      const c = clockRef.current;
      return c ? c.base + (performance.now() - c.at) * options.speed : null;
    };
    const start = clock() ?? Date.now();
    const map = new MapLibreMap({
      container,
      style: STYLES[options.style],
      center: santaLngLat(start),
      zoom: 1.6,
      attributionControl: { compact: true },
    });

    const el = document.createElement('div');
    el.setAttribute('aria-label', '산타');
    el.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#d6453b;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)';
    const marker = options.marker === 'dom' ? new Marker({ element: el }).setLngLat(santaLngLat(start)) : null;

    let raf = 0;
    let frames = 0;
    let totalFrames = 0;
    let lastFrame = performance.now();
    let windowStart = lastFrame;
    let measureFrom = 0; // 지도 준비 2초 뒤부터 최저 FPS를 잰다
    let longFrames = 0;
    let fpsNow = 0;
    let fpsMin: number | null = null;
    let lastLineUpdate = 0;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = t - lastFrame;
      lastFrame = t;
      const current = clock();
      if (current === null) return;

      const lngLat = santaLngLat(current);
      if (marker) marker.setLngLat(lngLat);
      else map.getSource<GeoJSONSource>('santa')?.setData(point(lngLat));
      if (options.follow) map.jumpTo({ center: lngLat });
      if (t - lastLineUpdate > 1000) {
        map.getSource<GeoJSONSource>('done')?.setData(traveledLine(current));
        lastLineUpdate = t;
      }

      if (measureFrom && t > measureFrom) {
        frames++;
        totalFrames++;
        if (dt > LONG_FRAME_MS) longFrames++;
        if (t - windowStart >= 1000) {
          fpsNow = (frames * 1000) / (t - windowStart);
          fpsMin = fpsMin === null ? fpsNow : Math.min(fpsMin, fpsNow);
          frames = 0;
          windowStart = t;
        }
      } else {
        windowStart = t;
      }
    };

    map.on('load', () => {
      stats.mapLoad = performance.now();
      map.addSource('route', { type: 'geojson', data: FULL_ROUTE });
      map.addSource('done', { type: 'geojson', data: traveledLine(start) });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#d6453b', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [2, 2] },
      });
      map.addLayer({ id: 'done', type: 'line', source: 'done', paint: { 'line-color': '#d6453b', 'line-width': 3 } });
      if (marker) marker.addTo(map);
      else {
        map.addSource('santa', { type: 'geojson', data: point(santaLngLat(start)) });
        map.addLayer({
          id: 'santa',
          type: 'circle',
          source: 'santa',
          paint: { 'circle-radius': 10, 'circle-color': '#d6453b', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' },
        });
      }
      measureFrom = performance.now() + 2000;
      raf = requestAnimationFrame(loop);
    });
    map.once('idle', () => {
      stats.mapIdle = performance.now();
    });

    const report = window.setInterval(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const js = resources.filter((r) => /\/_next\/static\/.+\.js|\/maplibre\//.test(r.name));
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const elapsed = measureFrom ? (performance.now() - measureFrom) / 1000 : 0;
      setMetrics({
        lcp: stats.lcp,
        fcp: fcp ? fcp.startTime : null,
        mapLoad: stats.mapLoad,
        mapIdle: stats.mapIdle,
        fpsNow,
        fpsAvg: elapsed > 0 ? totalFrames / elapsed : 0,
        fpsMin,
        longFrames,
        jsKB: js.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize), 0) / 1024,
        jsFiles: js.length,
        tileRequests: resources.filter((r) => r.name.includes('tiles.openfreemap.org')).length,
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(report);
      lcpObserver.disconnect();
      map.remove();
    };
  }, [options]);

  if (options && !options.hasDemo) {
    return (
      <main className="flex min-h-full flex-col items-start gap-4 p-6 text-white">
        <h1 className="text-xl font-bold">지도 성능 시험</h1>
        <p>산타가 움직이는 시각으로 열어야 측정할 수 있어요.</p>
        <a className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 font-bold text-ink" href={`/spike/map${DEMO_QUERY}`}>
          이브 밤으로 열기
        </a>
      </main>
    );
  }

  const deviceText = options
    ? `코어 ${navigator.hardwareConcurrency ?? '-'} · DPR ${window.devicePixelRatio} · ${window.innerWidth}×${window.innerHeight}`
    : '';
  const summary = [
    `LCP ${ms(metrics.lcp)} · FCP ${ms(metrics.fcp)}`,
    `지도 load ${ms(metrics.mapLoad)} · 지도 다 그림(idle) ${ms(metrics.mapIdle)}`,
    `FPS 지금 ${metrics.fpsNow.toFixed(0)} · 평균 ${metrics.fpsAvg.toFixed(1)} · 최저 ${metrics.fpsMin?.toFixed(0) ?? '-'} · 긴 프레임(>${LONG_FRAME_MS}ms) ${metrics.longFrames}`,
    `JS ${metrics.jsKB.toFixed(0)}KB(${metrics.jsFiles}개) · 타일 요청 ${metrics.tileRequests}`,
    `옵션 style=${options?.style} marker=${options?.marker} follow=${options?.follow ? 1 : 0} speed=${options?.speed}`,
    deviceText,
    options ? navigator.userAgent : '', // 서버 렌더와 첫 화면을 같게 두려고 마운트 뒤에만 읽는다
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="fixed inset-0">
      {/* maplibre-gl.css가 컨테이너를 position: relative로 바꾸므로 inset이 아니라 크기로 채운다 */}
      <div ref={containerRef} className="h-full w-full" />
      <section
        aria-label="측정값"
        className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/90 p-3 text-ink shadow-lg"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <pre className="whitespace-pre-wrap break-all font-sans text-[12px] leading-5">{summary}</pre>
        <button
          type="button"
          onClick={copy}
          className="mt-2 min-h-11 w-full rounded-xl bg-ink text-[15px] font-bold text-white"
        >
          {copied ? '복사했어요' : '결과 복사'}
        </button>
      </section>
    </main>
  );
}
