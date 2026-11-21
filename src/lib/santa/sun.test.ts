// 해가 떠 있는가(낮/밤 지도). 기준: 서울 12월 24일 해 뜸 약 7시 44분, 해 짐 약 17시 17분(한국천문연구원 표 근처)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { isDaytime, mapToneAt, sunElevation } from "./sun";

/** 2026년 한국 시각(KST)을 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);
const SEOUL = { lat: 37.5598, lon: 126.9959 }; // 서울 중구(기본 동네)

describe("sunElevation: 태양 고도(도)", () => {
  test("서울 동지 무렵 한낮 고도는 약 29도(90 − 37.6 − 23.4)", () => {
    const noon = sunElevation(kst(12, 24, 12, 32), SEOUL.lat, SEOUL.lon); // 서울 남중 약 12시 32분
    assert.ok(Math.abs(noon - 29) < 0.5, `${noon}`);
  });

  test("한밤에는 음수(해가 지평선 아래)", () => {
    assert.ok(sunElevation(kst(12, 25, 0, 32), SEOUL.lat, SEOUL.lon) < -60);
  });
});

describe("isDaytime: 서울 12월 24일", () => {
  test("해 뜨기 전(7시 35분)은 밤, 뜬 뒤(7시 55분)는 낮", () => {
    assert.equal(isDaytime(kst(12, 24, 7, 35), SEOUL.lat, SEOUL.lon), false);
    assert.equal(isDaytime(kst(12, 24, 7, 55), SEOUL.lat, SEOUL.lon), true);
  });

  test("해 지기 전(17시 7분)은 낮, 진 뒤(17시 27분)는 밤", () => {
    assert.equal(isDaytime(kst(12, 24, 17, 7), SEOUL.lat, SEOUL.lon), true);
    assert.equal(isDaytime(kst(12, 24, 17, 27), SEOUL.lat, SEOUL.lon), false);
  });

  test("산타가 오는 이브 밤(밤 12시 32분)은 밤, 크리스마스 낮 12시는 낮", () => {
    assert.equal(isDaytime(kst(12, 25, 0, 32), SEOUL.lat, SEOUL.lon), false);
    assert.equal(isDaytime(kst(12, 25, 12, 0), SEOUL.lat, SEOUL.lon), true);
  });
});

describe("극지방: 해가 안 뜨거나 안 지는 곳", () => {
  test("북위 80도(스발바르)는 12월 한낮에도 밤", () => {
    assert.equal(isDaytime(Date.UTC(2026, 11, 24, 11), 80, 15), false);
  });

  test("남위 80도(남극)는 12월 한밤에도 낮", () => {
    assert.equal(isDaytime(Date.UTC(2026, 11, 24, 0), -80, 0), true);
    assert.equal(isDaytime(Date.UTC(2026, 11, 24, 12), -80, 0), true);
  });
});

describe("mapToneAt: 지도 밝기", () => {
  test("자동이면 우리 동네 해에 맞춘다", () => {
    assert.equal(mapToneAt(kst(12, 25, 0, 32), SEOUL, "auto"), "night");
    assert.equal(mapToneAt(kst(12, 25, 12, 0), SEOUL, "auto"), "day");
  });

  test("밝게·어둡게를 고르면 해와 상관없이 그대로", () => {
    assert.equal(mapToneAt(kst(12, 25, 0, 32), SEOUL, "day"), "day");
    assert.equal(mapToneAt(kst(12, 25, 12, 0), SEOUL, "night"), "night");
  });
});
