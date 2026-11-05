import type { Config } from 'tailwindcss';

// 색·글꼴은 globals.css의 CSS 변수(디자인 토큰)를 가리킨다.
// 2주차 디자인 확정 후 토큰 값만 바꾸면 전체가 따라 바뀐다.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: 'var(--color-night)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        surface: 'var(--color-surface)',
        santa: 'var(--color-santa)',
        gold: 'var(--color-gold)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
      },
    },
  },
  plugins: [],
};

export default config;
