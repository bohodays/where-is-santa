import type { Config } from "tailwindcss";

// 색·글꼴·크기는 globals.css의 CSS 변수(디자인 토큰)를 가리킨다. 값은 globals.css에서만 바꾼다.
// CSS 변수라서 bg-ink/50 같은 투명도 표기는 쓰지 않는다. 필요하면 토큰을 따로 만든다.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "var(--color-night)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        "ink-faint": "var(--color-ink-faint)",
        line: "var(--color-line)",
        border: "var(--color-border)",
        handle: "var(--color-handle)",
        backdrop: "var(--color-backdrop)",
        santa: "var(--color-santa)",
        action: "var(--color-action)",
        "on-action": "var(--color-on-action)",
        now: "var(--color-now)",
        gold: "var(--color-gold)",
        highlight: "var(--color-highlight)",
        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        "switch-off": "var(--color-switch-off)",
        focus: "var(--color-focus)",
        "focus-halo": "var(--color-focus-halo)",
        scene: {
          ice: "var(--scene-ice)",
          ring: "var(--scene-ring)",
          snow: "var(--scene-snow)",
          house: "var(--scene-house)",
          text: "var(--scene-text)",
          "text-soft": "var(--scene-text-soft)",
        },
        map: {
          sea: "var(--map-sea)",
          land: "var(--map-land)",
          "land-line": "var(--map-land-line)",
          route: "var(--map-route)",
          label: "var(--map-label)",
          "label-strong": "var(--map-label-strong)",
          text: "var(--map-text)",
          attribution: "var(--map-attribution)",
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
      },
      fontSize: {
        countdown: ["var(--text-countdown)", { lineHeight: "1.1" }],
        title: ["var(--text-title)", { lineHeight: "1.4" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.5" }],
        body: ["var(--text-body)", { lineHeight: "1.6" }],
        caption: ["var(--text-caption)", { lineHeight: "1.5" }],
        fine: ["var(--text-fine)", { lineHeight: "1.7" }],
        "map-label": ["var(--text-map-label)", { lineHeight: "1.3" }],
        attribution: ["var(--text-attribution)", { lineHeight: "1.3" }],
      },
      borderRadius: {
        sheet: "var(--radius-sheet)",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        pill: "var(--radius-pill)",
      },
      spacing: {
        touch: "var(--size-touch)",
        button: "var(--size-button)",
      },
      boxShadow: {
        float: "var(--shadow-float)",
        sheet: "var(--shadow-sheet)",
      },
    },
  },
  plugins: [],
};

export default config;
