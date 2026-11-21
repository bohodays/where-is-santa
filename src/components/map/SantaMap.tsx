"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { ROUTE_YEAR } from "@/lib/santa/route-summary";
import { midnightLongitude, type Stop } from "@/lib/santa/route";
import { santaAt } from "@/lib/santa/santa";
import { Button } from "../Button";
import { MapAttribution } from "./MapAttribution";
import {
  clampLat,
  midnightLine,
  outlineStyle,
  tileStyle,
  visitedPoints,
  type MapColors,
} from "./mapStyle";

// 세계 지도: 자정선, 들른 도시, 산타, 우리 동네. 여정 중에만 보인다(출발 전·끝난 뒤는 NorthPoleScene).
// - 지도 JS·CSS는 import()로 나중에 받는다. 첫 화면 JS에 넣지 않는다(CLAUDE.md)
// - 장애 대응(docs/spike-map-fallback.md): OpenFreeMap 스타일 실패·타일 오류 3번·10초 응답 없음 → 윤곽 지도,
//   지도 JS를 못 받음 → 글자만
// - 지도는 화면 낭독기에서 숨긴다. 산타 위치는 SantaLocationBanner의 aria-live 문장으로 알린다(CLAUDE.md)

const STYLE_TIMEOUT_MS = 10_000;
const TILE_ERROR_LIMIT = 3;
/** 자정선을 다시 그리는 간격. 1초에 0.004도 움직여서 프레임마다 그릴 필요가 없다 */
const LINE_UPDATE_MS = 1_000;
/** 산타를 따라갈 때 지도 가운데를 옮기는 간격 */
const FOLLOW_UPDATE_MS = 1_000;
/** 처음 위도. 세계 지도를 보여주되 사람이 많이 사는 북반구를 조금 더 */
const START_LAT = 20;

let library: Promise<typeof import("maplibre-gl")> | null = null;

/** 지도 JS와 CSS를 받는다. 페이지 안에서 한 번만 받고, 실패하면 다시 시도할 수 있게 비운다. 출발 전에 미리 불러 둘 때도 쓴다 */
export function loadMapLibrary(): Promise<typeof import("maplibre-gl")> {
  library ??= Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")])
    .then(([lib]) => lib)
    .catch((error: unknown) => {
      library = null;
      throw error;
    });
  return library;
}

/** 지금 화면의 지도 색(globals.css의 --map-* 토큰). 낮/밤 지도 모드를 그대로 따른다 */
function readMapColors(): MapColors {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => css.getPropertyValue(name).trim();
  return {
    sea: get("--map-sea"),
    land: get("--map-land"),
    landLine: get("--map-land-line"),
    route: get("--map-route"),
  };
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 산타 표시(빨간 원 + 흰 고깔). 북극 마을 그림의 산타와 같은 모양 */
function santaElement(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="34" height="34" viewBox="0 0 34 34" class="drop-shadow">
    <circle cx="17" cy="17" r="15" class="fill-santa stroke-surface" stroke-width="2"/>
    <path d="M9 22 L17 7 L25 22 Z" class="fill-surface"/>
    <rect x="7" y="21" width="20" height="4" rx="2" class="fill-surface"/>
  </svg>`;
  return el;
}

/** 우리 동네 표시: 흰 점(빨간 테두리) + 이름 */
function homeElement(name: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "flex flex-col items-center gap-0.5";
  const dot = document.createElement("span");
  // 들른 도시(금색 점)와 헷갈리지 않게 흰 점 + 빨간 테두리
  dot.className = "size-3.5 rounded-pill border-[3px] border-santa bg-surface";
  const label = document.createElement("span");
  label.className = "whitespace-nowrap text-map-label font-bold text-map-label-strong";
  label.textContent = name; // innerHTML이 아니라 textContent: 이름을 글자로만 넣는다
  el.append(dot, label);
  return el;
}

type MapMode = "loading" | "tiles" | "outline" | "none";

type SantaMapProps = {
  route: Stop[];
  /** 보정된 현재 시각을 읽는 함수(useClock). 프레임마다 부른다 */
  readNow: () => number;
  home: { name: string; lat: number; lon: number };
  /** 스토리·시험용: 처음부터 윤곽 지도로, 또는 지도 JS를 못 받은 것처럼 */
  forceMode?: "outline" | "none";
};

export function SantaMap({ route, readNow, home, forceMode }: SantaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const followRef = useRef(true);
  const [mode, setMode] = useState<MapMode>("loading");
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (forceMode === "none") {
      setMode("none");
      return;
    }
    let cancelled = false;
    let raf = 0;
    let timer = 0;

    void (async () => {
      let lib: typeof import("maplibre-gl");
      try {
        lib = await loadMapLibrary();
      } catch {
        if (!cancelled) setMode("none");
        return;
      }
      if (cancelled) return;

      lib.setWorkerUrl(`/maplibre/maplibre-gl-worker-${lib.getVersion()}.js`);
      const colors = readMapColors();
      let current: "tiles" | "outline" = forceMode === "outline" ? "outline" : "tiles";
      const start = santaAt(readNow(), route);
      const map = new lib.Map({
        container,
        style: current === "tiles" ? tileStyle(colors) : outlineStyle(colors),
        center: [start.lon, START_LAT],
        zoom: 1,
        minZoom: 0.5,
        maxZoom: 6, // 더 확대하면 받을 타일이 많아진다. 동네 이름은 우리 표시로 충분하다
        attributionControl: false, // 출처는 지도 밖 글자(MapAttribution)로
        keyboard: false,
        dragRotate: false,
        touchPitch: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      // 지도 영역은 화면 낭독기에서 숨긴다. 숨긴 영역 안에 Tab으로 갈 수 있는 것이 있으면 안 된다(axe aria-hidden-focus)
      map.getCanvas().setAttribute("tabindex", "-1");

      const toOutline = () => {
        if (current === "outline") return;
        current = "outline";
        window.clearTimeout(timer);
        map.setStyle(outlineStyle(colors));
      };
      // 타일 지도가 정말 되는지는 "타일이 하나라도 왔는가"로 본다.
      // 스타일은 코드 안에 있어서 늘 바로 읽히므로(시험 때처럼 원격 스타일 URL이 아니다), 스타일이 읽혔는지로는 알 수 없다.
      // - 타일이 오기 전에 타일 소스 오류(TileJSON 실패 등) → 바로 윤곽 지도
      // - 타일이 온 뒤에는 오류가 TILE_ERROR_LIMIT번 쌓이면 윤곽 지도
      // - STYLE_TIMEOUT_MS 안에 타일이 하나도 안 오면(응답 없음) 윤곽 지도
      let tilesSeen = false;
      if (current === "tiles") {
        timer = window.setTimeout(() => {
          if (!tilesSeen) toOutline();
        }, STYLE_TIMEOUT_MS);
        let tileErrors = 0;
        map.on("error", (event) => {
          if (current === "outline") return;
          const sourceId = (event as { sourceId?: unknown }).sourceId;
          if (sourceId !== undefined && sourceId !== "openmaptiles") return; // 우리 데이터(자정선 등) 오류는 상관없다
          if (!tilesSeen || ++tileErrors >= TILE_ERROR_LIMIT) toOutline();
        });
        map.on("sourcedata", (event) => {
          if (current !== "tiles" || tilesSeen) return;
          if (event.sourceId === "openmaptiles" && event.tile) {
            tilesSeen = true;
            window.clearTimeout(timer);
            setMode("tiles");
          }
        });
      }

      // 스타일을 (다시) 읽을 때마다 자정선·들른 도시 데이터를 처음부터 넣는다.
      // 타일 지도는 첫 타일이 와야 "tiles"(위), 윤곽 지도는 스타일을 읽으면 바로 "outline"
      let shownVisited = -1;
      let lineAt = 0;
      map.on("style.load", () => {
        shownVisited = -1;
        lineAt = 0;
        if (current === "outline") setMode("outline");
      });
      // 사람이 지도를 끌면 따라가기를 멈춘다. 다시 켜는 버튼이 나온다
      map.on("dragstart", () => {
        followRef.current = false;
        setFollow(false);
      });

      new lib.Marker({ element: homeElement(home.name), anchor: "top" })
        .setLngLat([home.lon, home.lat])
        .addTo(map);
      const santa = new lib.Marker({ element: santaElement() })
        .setLngLat([start.lon, clampLat(start.lat)])
        .addTo(map);

      let followAt = 0;
      const frame = () => {
        const now = readNow();
        const s = santaAt(now, route);
        santa.setLngLat([s.lon, clampLat(s.lat)]);
        if (map.isStyleLoaded()) {
          if (s.visitedCount !== shownVisited) {
            shownVisited = s.visitedCount;
            map
              .getSource<import("maplibre-gl").GeoJSONSource>("visited")
              ?.setData(visitedPoints(route, s.visitedCount));
          }
          const t = performance.now();
          if (t - lineAt >= LINE_UPDATE_MS) {
            lineAt = t;
            map
              .getSource<import("maplibre-gl").GeoJSONSource>("midnight")
              ?.setData(midnightLine(midnightLongitude(now, ROUTE_YEAR)));
          }
          if (followRef.current && t - followAt >= FOLLOW_UPDATE_MS) {
            followAt = t;
            map.jumpTo({ center: [s.lon, map.getCenter().lat] });
          }
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [route, readNow, home, forceMode]);

  const followSanta = () => {
    followRef.current = true;
    setFollow(true);
    const s = santaAt(readNow(), route);
    mapRef.current?.easeTo({
      center: [s.lon, START_LAT],
      zoom: 1,
      duration: prefersReducedMotion() ? 0 : 800,
    });
  };

  return (
    <div className="absolute inset-0 bg-map-sea" data-map-mode={mode}>
      {/*
        MapLibre CSS가 지도 칸을 position: relative로 바꾼다(.maplibregl-map). 지도 칸에 absolute inset-0을 주면 덮여서 높이가 0이 된다.
        그래서 자리 잡기는 바깥 칸(absolute)이 하고, 지도 칸은 h-full w-full로 채운다(1주차 시험에서도 겪은 문제)
      */}
      <div aria-hidden="true" className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {mode === "none" && (
        <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 break-keep text-center text-body text-map-text">
          지도를 불러오지 못했어요. 산타 소식은 위에서 계속 볼 수 있어요.
        </p>
      )}
      {/* 아래 시트가 지도를 24px 덮으므로(-mt-6) 그 위에 둔다. 버튼은 위, 출처는 아래 줄(좁은 화면에서 서로 밀어 줄바꿈되지 않게) */}
      <div className="absolute bottom-8 left-2 right-2 flex flex-col items-end gap-2">
        {!follow && mode !== "none" && (
          <Button
            variant="secondary"
            className="whitespace-nowrap shadow-float"
            onClick={followSanta}
          >
            산타 따라가기
          </Button>
        )}
        <div className="self-stretch">
          {(mode === "tiles" || mode === "outline") && <MapAttribution mode={mode} />}
        </div>
      </div>
    </div>
  );
}
