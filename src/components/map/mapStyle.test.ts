import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { buildRoute } from "@/lib/santa/route";
import { CITIES } from "@/lib/santa/cities";
import {
  clampLat,
  colorPaint,
  midnightLine,
  outlineStyle,
  tileStyle,
  visitedPoints,
  type MapColors,
} from "./mapStyle";

const COLORS: MapColors = {
  sea: "#0b1830",
  land: "#1a2e52",
  landLine: "#2b4675",
  route: "#f2c14e",
};
const ids = (style: ReturnType<typeof tileStyle>) => style.layers.map((l) => l.id);

describe("지도 스타일", () => {
  test("타일 지도는 레이어가 6개뿐이다(육지·바다·국경 2·자정선·들른 도시)", () => {
    assert.deepEqual(ids(tileStyle(COLORS)), [
      "land",
      "water",
      "border",
      "border-disputed",
      "midnight-line",
      "visited-dots",
    ]);
  });

  test("윤곽 지도는 외부 서버 없이 우리 파일만 쓰고, 자정선·들른 도시 레이어를 똑같이 갖는다", () => {
    const style = outlineStyle(COLORS);
    assert.deepEqual(ids(style), ["sea", "land", "midnight-line", "visited-dots"]);
    const urls = JSON.stringify(style.sources);
    assert.ok(!urls.includes("http"), urls);
  });

  test("색은 넘겨준 토큰 값을 그대로 쓴다", () => {
    const text = JSON.stringify(tileStyle(COLORS));
    for (const color of Object.values(COLORS)) assert.ok(text.includes(color), color);
  });
});

describe("낮/밤 다시 칠하기", () => {
  const DAY: MapColors = { sea: "#d9e6e6", land: "#fbf7ee", landLine: "#c9bfa9", route: "#c23a30" };

  test.each(["tiles", "outline"] as const)(
    "%s: 다시 칠한 색이 처음부터 낮 색으로 만든 스타일과 같다",
    (mode) => {
      const style = mode === "tiles" ? tileStyle(DAY) : outlineStyle(DAY);
      for (const [id, property, value] of colorPaint(mode, DAY)) {
        const layer = style.layers.find((l) => l.id === id);
        assert.ok(layer, `${mode}에 ${id} 레이어가 없음`);
        assert.equal(
          (layer.paint as Record<string, unknown>)[property],
          value,
          `${id} ${property}`,
        );
      }
    },
  );

  test.each(["tiles", "outline"] as const)("%s: 색이 있는 레이어는 모두 다시 칠한다", (mode) => {
    const style = mode === "tiles" ? tileStyle(DAY) : outlineStyle(DAY);
    const painted = new Set(colorPaint(mode, DAY).map(([id, property]) => `${id} ${property}`));
    for (const layer of style.layers) {
      for (const [property, value] of Object.entries(layer.paint ?? {})) {
        if (property.endsWith("color")) {
          assert.ok(
            painted.has(`${layer.id} ${property}`),
            `${layer.id} ${property} (${String(value)})`,
          );
        }
      }
    }
  });
});

describe("지도 위 데이터", () => {
  test("자정선은 그 경도의 남위 85도~북위 85도 세로선", () => {
    const line = midnightLine(-157.5).features[0].geometry;
    assert.deepEqual(line, {
      type: "LineString",
      coordinates: [
        [-157.5, -85],
        [-157.5, 85],
      ],
    });
  });

  test("들른 도시는 경로 앞에서부터 count곳, 좌표는 [경도, 위도] 순서", () => {
    const route = buildRoute(CITIES, 2026);
    const points = visitedPoints(route, 3).features;
    assert.equal(points.length, 3);
    assert.deepEqual(points[0].geometry, {
      type: "Point",
      coordinates: [route[0].lon, route[0].lat],
    });
    assert.equal(visitedPoints(route, 0).features.length, 0);
  });

  test("북극(90도)은 지도 끝(85도)으로 자른다", () => {
    assert.equal(clampLat(90), 85);
    assert.equal(clampLat(-90), -85);
    assert.equal(clampLat(37.5), 37.5);
  });
});
