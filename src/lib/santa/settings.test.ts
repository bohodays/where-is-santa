import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  motionReduced,
  nextReduceMotion,
  parseStoredSettings,
  serializeSettings,
  SETTINGS_BOOT_SCRIPT,
  SETTINGS_STORAGE_KEY,
  settingsAttributes,
  type Settings,
} from "./settings";

const ALL_ON: Settings = {
  mapTone: "day",
  largeText: true,
  highContrast: true,
  reduceMotion: true,
};

describe("설정 저장 형식", () => {
  test("저장했다 읽으면 같은 설정", () => {
    for (const s of [
      DEFAULT_SETTINGS,
      ALL_ON,
      { ...DEFAULT_SETTINGS, mapTone: "night" as const, reduceMotion: false },
    ]) {
      assert.deepEqual(parseStoredSettings(serializeSettings(s)), s);
    }
  });

  test("없거나 망가진 값은 기본값", () => {
    for (const raw of [null, "", "{", "[]", "null", "1", JSON.stringify({ ...ALL_ON, v: 2 })]) {
      assert.deepEqual(parseStoredSettings(raw), DEFAULT_SETTINGS, String(raw));
    }
  });

  test("칸 하나가 틀리면 그 칸만 기본값, 나머지는 그대로", () => {
    const raw = JSON.stringify({ v: 1, ...ALL_ON, mapTone: "sepia", largeText: "yes" });
    assert.deepEqual(parseStoredSettings(raw), { ...ALL_ON, mapTone: "auto", largeText: false });
    const motion = JSON.stringify({ v: 1, ...DEFAULT_SETTINGS, reduceMotion: "on" });
    assert.equal(parseStoredSettings(motion).reduceMotion, null);
  });
});

describe("움직임 줄이기: 기기 설정 따르기", () => {
  test("저장 값이 없으면 기기 설정, 있으면 저장 값", () => {
    assert.equal(motionReduced(DEFAULT_SETTINGS, true), true);
    assert.equal(motionReduced(DEFAULT_SETTINGS, false), false);
    assert.equal(motionReduced({ ...DEFAULT_SETTINGS, reduceMotion: false }, true), false);
    assert.equal(motionReduced({ ...DEFAULT_SETTINGS, reduceMotion: true }, false), true);
  });

  test("스위치를 기기 설정과 같게 바꾸면 다시 기기 설정을 따른다(null)", () => {
    assert.equal(nextReduceMotion(false, true), false); // 기기는 줄이기인데 끔
    assert.equal(nextReduceMotion(true, true), null); // 다시 켜면 기기를 따른다
    assert.equal(nextReduceMotion(true, false), true);
    assert.equal(nextReduceMotion(false, false), null);
  });
});

describe("<html> 속성", () => {
  test("기본값은 속성 없음", () => {
    assert.deepEqual(settingsAttributes(DEFAULT_SETTINGS), {
      "data-text-size": null,
      "data-contrast": null,
      "data-motion": null,
    });
  });

  test("켠 설정만 속성이 붙고, 움직임은 켬/끔을 나눈다", () => {
    assert.deepEqual(settingsAttributes(ALL_ON), {
      "data-text-size": "large",
      "data-contrast": "high",
      "data-motion": "reduce",
    });
    assert.equal(
      settingsAttributes({ ...DEFAULT_SETTINGS, reduceMotion: false })["data-motion"],
      "full",
    );
  });

  test("첫 화면 스크립트가 settingsAttributes와 같은 속성을 켠다", () => {
    const cases: (string | null)[] = [
      null,
      "{",
      serializeSettings(DEFAULT_SETTINGS),
      serializeSettings(ALL_ON),
      serializeSettings({ ...DEFAULT_SETTINGS, largeText: true, reduceMotion: false }),
      JSON.stringify({ ...ALL_ON, v: 2 }),
    ];
    for (const raw of cases) {
      const attrs: Record<string, string> = {};
      const fakeWindow = {
        localStorage: { getItem: (k: string) => (k === SETTINGS_STORAGE_KEY ? raw : null) },
        document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
      };
      new Function("localStorage", "document", SETTINGS_BOOT_SCRIPT)(
        fakeWindow.localStorage,
        fakeWindow.document,
      );
      const expected = Object.fromEntries(
        Object.entries(settingsAttributes(parseStoredSettings(raw))).filter(([, v]) => v !== null),
      );
      assert.deepEqual(attrs, expected, String(raw));
    }
  });
});
