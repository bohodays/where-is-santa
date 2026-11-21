import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { Stop } from "@/lib/santa/route";

// 지도 스타일과 지도 위에 그리는 데이터. 순수 함수만 둔다(테스트: mapStyle.test.ts).
// - 타일 지도: OpenFreeMap 벡터 타일에 우리 스타일(바다·육지·국경만, 4개 레이어)을 입힌다.
//   positron 스타일(55개 레이어)을 그대로 쓰지 않는 이유: 색을 디자인 토큰(--map-*)으로 맞추고, 저사양 폰에서 그릴 것을 줄인다.
// - 윤곽 지도: OpenFreeMap이 안 되면 Natural Earth 육지 윤곽(public/maps/)으로 바꾼다(docs/spike-map-fallback.md).
// 두 스타일 모두 자정선·들른 도시 레이어를 갖고 있어서, 윤곽 지도로 바꿔도 다시 붙일 필요가 없다(데이터만 다시 넣는다).

/** 지도 색. globals.css의 --map-* 토큰 값(readMapColors) */
export type MapColors = {
  sea: string;
  land: string;
  landLine: string;
  route: string;
};

export const TILE_SOURCE_URL = "https://tiles.openfreemap.org/planet";
export const OUTLINE_DATA_URL = "/maps/ne_110m_land.json";
/** 메르카토르 지도가 그리는 위도 끝(북극·남극은 그리지 못한다) */
export const MAX_LAT = 85;

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/** 자정선·들른 도시 소스와 레이어. 두 스타일이 같이 쓴다 */
function overlays(colors: MapColors): Pick<StyleSpecification, "sources" | "layers"> {
  return {
    sources: {
      midnight: { type: "geojson", data: EMPTY },
      visited: { type: "geojson", data: EMPTY },
    },
    layers: [
      {
        id: "midnight-line",
        type: "line",
        source: "midnight",
        paint: { "line-color": colors.route, "line-width": 2, "line-dasharray": [2, 2] },
      },
      {
        id: "visited-dots",
        type: "circle",
        source: "visited",
        paint: { "circle-color": colors.route, "circle-radius": 2.5, "circle-opacity": 0.85 },
      },
    ],
  };
}

/** 타일 지도 스타일: 육지(바탕) 위에 바다와 국경을 그린다 */
export function tileStyle(colors: MapColors): StyleSpecification {
  const top = overlays(colors);
  return {
    version: 8,
    sources: { openmaptiles: { type: "vector", url: TILE_SOURCE_URL }, ...top.sources },
    layers: [
      { id: "land", type: "background", paint: { "background-color": colors.land } },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "fill-color": colors.sea },
      },
      {
        id: "border",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: [
          "all",
          ["==", ["get", "admin_level"], 2],
          ["!=", ["get", "maritime"], 1],
          ["!=", ["get", "disputed"], 1],
        ],
        paint: { "line-color": colors.landLine, "line-width": 0.8 },
      },
      {
        id: "border-disputed",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["all", ["!=", ["get", "maritime"], 1], ["==", ["get", "disputed"], 1]],
        paint: { "line-color": colors.landLine, "line-width": 0.8, "line-dasharray": [2, 2] },
      },
      ...top.layers,
    ],
  };
}

/** 윤곽 지도 스타일: 바다(바탕) 위에 Natural Earth 육지를 그린다. 외부 서버 없이 우리 파일만 쓴다 */
export function outlineStyle(colors: MapColors): StyleSpecification {
  const top = overlays(colors);
  return {
    version: 8,
    sources: { land: { type: "geojson", data: OUTLINE_DATA_URL }, ...top.sources },
    layers: [
      { id: "sea", type: "background", paint: { "background-color": colors.sea } },
      {
        id: "land",
        type: "fill",
        source: "land",
        paint: { "fill-color": colors.land, "fill-outline-color": colors.landLine },
      },
      ...top.layers,
    ],
  };
}

/**
 * 낮/밤 지도가 바뀔 때 다시 칠할 레이어 색 [레이어 id, 속성, 값]. 지도를 다시 만들지 않고 색만 바꾼다(setPaintProperty).
 * 스타일을 만드는 함수(tileStyle·outlineStyle)와 같은 색을 쓰는지 mapStyle.test.ts가 검사한다.
 */
/** MapLibre가 아는 칠하기 속성 이름("fill-color" 등). 철자가 틀리면 타입 검사에서 걸린다 */
type PaintProperty = Parameters<MapLibreMap["setPaintProperty"]>[1];
type Paint = [layerId: string, property: PaintProperty, value: string];

export function colorPaint(mode: "tiles" | "outline", colors: MapColors): Paint[] {
  const overlay: Paint[] = [
    ["midnight-line", "line-color", colors.route],
    ["visited-dots", "circle-color", colors.route],
  ];
  if (mode === "tiles") {
    return [
      ["land", "background-color", colors.land],
      ["water", "fill-color", colors.sea],
      ["border", "line-color", colors.landLine],
      ["border-disputed", "line-color", colors.landLine],
      ...overlay,
    ];
  }
  return [
    ["sea", "background-color", colors.sea],
    ["land", "fill-color", colors.land],
    ["land", "fill-outline-color", colors.landLine],
    ...overlay,
  ];
}

/** 자정선: 그 경도의 세로선(남위 85도 ~ 북위 85도) */
export function midnightLine(lon: number): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [lon, -MAX_LAT],
            [lon, MAX_LAT],
          ],
        },
      },
    ],
  };
}

/** 들른 도시: 경로의 앞에서 count곳(santaAt의 visitedCount) */
export function visitedPoints(route: Stop[], count: number): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: route.slice(0, count).map((s) => ({
      type: "Feature",
      properties: { id: s.id },
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
    })),
  };
}

/** 위도를 지도가 그리는 범위로 자른다(산타가 북극에 있을 때 등) */
export const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
