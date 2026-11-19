// 디자인 토큰 검사: globals.css의 색 조합이 WCAG 2.2 AA 대비를 지키는지, Tailwind가 없는 토큰을 가리키지 않는지.
// 토큰 값을 바꿨는데 여기서 실패하면 기대값을 고치지 말고 색을 고친다(CLAUDE.md 테스트 규칙).
import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import tailwindConfig from "../../tailwind.config";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

/** 선택자 블록 안의 --이름: 값 을 읽는다 */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `globals.css에 ${selector} 블록이 없음`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

const root = block(":root");
const day = { ...root, ...block('[data-map-tone="day"]') };
const high = { ...root, ...block('[data-contrast="high"]') };
const highDay = {
  ...day,
  ...block('[data-contrast="high"]'),
  ...block('[data-contrast="high"][data-map-tone="day"]'),
};

function luminance(hex: string): number {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `6자리 hex 색이 아님: ${hex}`);
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function check(tokens: Record<string, string>, pairs: [string, string, number][], mode: string) {
  for (const [fg, bg, min] of pairs) {
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert.ok(
      ratio >= min,
      `${mode}: ${fg} ${tokens[fg]} / ${bg} ${tokens[bg]} = ${ratio.toFixed(2)}:1 (기준 ${min})`,
    );
  }
}

const TEXT = 4.5; // 본문
const GRAPHIC = 3; // 큰 글자, 아이콘, 스위치 같은 그래픽

test("화면(바텀시트·버튼) 글자 대비는 4.5:1 이상", () => {
  check(
    root,
    [
      ["--color-ink", "--color-surface", TEXT],
      ["--color-ink-soft", "--color-surface", TEXT],
      ["--color-ink-soft", "--color-surface-muted", TEXT],
      ["--color-ink-faint", "--color-surface", TEXT],
      ["--color-link", "--color-surface", TEXT],
      ["--color-link", "--color-surface-muted", TEXT],
      ["--color-on-action", "--color-action", TEXT],
      ["--color-now", "--color-surface", TEXT],
      ["--color-ink", "--color-highlight", TEXT],
    ],
    "기본",
  );
});

test("그래픽(진행 막대, 꺼진 스위치)은 3:1 이상", () => {
  check(
    root,
    [
      ["--color-santa", "--color-line", GRAPHIC],
      ["--color-switch-off", "--color-surface", GRAPHIC],
      ["--color-ink", "--color-surface", GRAPHIC], // 켜진 스위치
    ],
    "기본",
  );
});

test("키보드 포커스 링은 어느 바탕에서나 3:1 이상으로 보인다", () => {
  // 링은 흰 띠와 파란 링 두 겹이다. 둘 중 하나라도 바탕과 3:1 이상이면 보인다.
  const backgrounds: [Record<string, string>, string, string][] = [
    [root, "--color-surface", "시트"],
    [root, "--color-surface-muted", "선택된 항목"],
    [root, "--color-action", "주 버튼"],
    [root, "--color-night", "앱 바탕"],
    [root, "--map-sea", "밤 지도 바다"],
    [root, "--map-land", "밤 지도 육지"],
    [day, "--map-sea", "낮 지도 바다"],
    [day, "--map-land", "낮 지도 육지"],
  ];
  for (const [tokens, bg, where] of backgrounds) {
    const ring = contrast(tokens["--color-focus"], tokens[bg]);
    const halo = contrast(tokens["--color-focus-halo"], tokens[bg]);
    assert.ok(
      Math.max(ring, halo) >= GRAPHIC,
      `${where}: 링 ${ring.toFixed(2)}:1, 흰 띠 ${halo.toFixed(2)}:1 (기준 ${GRAPHIC})`,
    );
  }
});

const MAP_PAIRS: [string, string, number][] = [
  ["--map-label", "--map-sea", TEXT],
  ["--map-label", "--map-land", TEXT],
  ["--map-label-strong", "--map-land", TEXT],
  ["--map-text", "--map-sea", TEXT],
  ["--map-text", "--map-land", TEXT],
  ["--map-attribution", "--map-sea", TEXT],
  ["--map-route", "--map-sea", GRAPHIC],
  ["--map-route", "--map-land", GRAPHIC],
];

test("밤 지도 글자와 경로가 바다·육지 위에서 읽힌다", () => check(root, MAP_PAIRS, "밤 지도"));
test("낮 지도 글자와 경로가 바다·육지 위에서 읽힌다", () => check(day, MAP_PAIRS, "낮 지도"));

test("고대비 모드는 보조 글자도 7:1 이상", () => {
  const pairs: [string, string, number][] = [
    ["--color-ink-soft", "--color-surface", 7],
    ["--color-ink-soft", "--color-surface-muted", 7],
    ["--color-ink-faint", "--color-surface", 7],
    ["--color-switch-off", "--color-surface", 4.5],
  ];
  check(high, pairs, "고대비");
  check(
    high,
    MAP_PAIRS.map(([f, b, m]) => [f, b, m === TEXT ? 7 : m]),
    "고대비 밤 지도",
  );
  check(
    highDay,
    MAP_PAIRS.map(([f, b, m]) => [f, b, m === TEXT ? 7 : m]),
    "고대비 낮 지도",
  );
});

test("Tailwind 설정이 가리키는 CSS 변수는 모두 globals.css에 있다", () => {
  const used = [...JSON.stringify(tailwindConfig.theme).matchAll(/var\((--[\w-]+)\)/g)].map(
    (m) => m[1],
  );
  assert.ok(used.length > 30, `찾은 변수 ${used.length}개`);
  for (const name of used) assert.ok(name in root, `globals.css에 없는 토큰: ${name}`);
});
