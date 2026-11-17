import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// 디자인 토큰을 눈으로 보는 페이지. 값은 globals.css에 있고, 여기서는 변수 이름만 쓴다.
// 툴바에서 지도(밤/낮)·글자(보통/큰 글씨)·대비(보통/고대비)를 바꾸면 그대로 따라 바뀐다.

type Swatch = { token: string; label: string };

const UI_COLORS: Swatch[] = [
  { token: "--color-night", label: "앱 바탕" },
  { token: "--color-surface", label: "바텀시트" },
  { token: "--color-surface-muted", label: "선택된 항목" },
  { token: "--color-ink", label: "본문" },
  { token: "--color-ink-soft", label: "보조 글자" },
  { token: "--color-ink-faint", label: "지나간 도시" },
  { token: "--color-line", label: "구분선" },
  { token: "--color-border", label: "보조 버튼 테두리" },
  { token: "--color-santa", label: "산타 표시(그래픽 전용)" },
  { token: "--color-action", label: "주 버튼" },
  { token: "--color-now", label: '"지금" 글자' },
  { token: "--color-gold", label: "밤 지도 경로" },
  { token: "--color-highlight", label: "우리 동네 행" },
  { token: "--color-link", label: "링크" },
  { token: "--color-switch-off", label: "꺼진 스위치" },
];

const MAP_COLORS: Swatch[] = [
  { token: "--map-sea", label: "바다" },
  { token: "--map-land", label: "육지" },
  { token: "--map-land-line", label: "해안선" },
  { token: "--map-route", label: "경로" },
  { token: "--map-label", label: "도시 이름" },
  { token: "--map-label-strong", label: "우리 동네 이름" },
  { token: "--map-text", label: "지도 위 안내" },
  { token: "--map-attribution", label: "출처" },
];

const TEXT_SIZES = [
  {
    className: "text-countdown font-display",
    token: "countdown",
    sample: "27분",
  },
  {
    className: "text-title font-bold",
    token: "title",
    sample: "우리 동네 고르기",
  },
  { className: "text-body-lg", token: "body-lg", sample: "친구에게 알려주기" },
  {
    className: "text-body",
    token: "body",
    sample: "지금 산타는 오사카 앞바다 상공",
  },
  {
    className: "text-caption",
    token: "caption",
    sample: "도착 예정 밤 12시 32분",
  },
  {
    className: "text-fine",
    token: "fine",
    sample: "지도 © OpenFreeMap © OpenMapTiles © OpenStreetMap 기여자",
  },
];

function SwatchGrid({ title, items }: { title: string; items: Swatch[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title font-bold text-ink">{title}</h2>
      <ul className="grid grid-cols-3 gap-3">
        {items.map(({ token, label }) => (
          <li key={token} className="flex flex-col gap-1">
            <span
              className="h-12 rounded-input border border-line"
              style={{ background: `var(${token})` }}
            />
            <span className="text-caption text-ink">{label}</span>
            <code className="text-fine text-ink-soft">{token}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TokenPage() {
  return (
    <main className="flex w-[390px] flex-col gap-8 rounded-sheet bg-surface p-5 text-ink">
      <SwatchGrid title="화면 색" items={UI_COLORS} />
      <SwatchGrid title="지도 색 (툴바: 밤/낮 지도)" items={MAP_COLORS} />
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-bold">글자 크기 (툴바: 큰 글씨)</h2>
        <ul className="flex flex-col gap-3">
          {TEXT_SIZES.map(({ className, token, sample }) => (
            <li
              key={token}
              className="flex flex-col gap-1 border-b border-line pb-3"
            >
              <span className={className}>{sample}</span>
              <code className="text-fine text-ink-soft">text-{token}</code>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-bold">버튼과 누르는 곳</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="h-button rounded-button bg-action text-body-lg font-bold text-on-action"
          >
            친구에게 알려주기
          </button>
          <button
            type="button"
            className="h-button rounded-button border-[1.5px] border-border bg-surface text-body-lg"
          >
            산타 따라가기
          </button>
        </div>
        <p className="text-caption text-ink-soft">
          버튼 높이 52px(h-button), 누르는 곳은 44px 이상(h-touch).
        </p>
      </section>
    </main>
  );
}

const meta = {
  title: "디자인 토큰",
  component: TokenPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TokenPage>;

export default meta;

export const All: StoryObj<typeof meta> = { name: "전체" };

export const MapTones: StoryObj<typeof meta> = {
  name: "지도 밤과 낮",
  render: () => (
    <div className="flex gap-4">
      {(["night", "day"] as const).map((tone) => (
        <div
          key={tone}
          data-map-tone={tone === "day" ? "day" : undefined}
          className="flex w-[240px] flex-col gap-2 rounded-card p-4"
          style={{ background: "var(--map-sea)" }}
        >
          <span
            className="text-map-label"
            style={{ color: "var(--map-label)" }}
          >
            {tone === "day" ? "낮 지도" : "밤 지도"} · 부산
          </span>
          <span
            className="rounded-input p-3 text-map-label font-bold"
            style={{
              background: "var(--map-land)",
              color: "var(--map-label-strong)",
            }}
          >
            서울 마포구 (우리 동네)
          </span>
          <span
            className="h-1 rounded-pill"
            style={{ background: "var(--map-route)" }}
          />
          <span className="text-caption" style={{ color: "var(--map-text)" }}>
            다음 도착: 부산, 19분 뒤
          </span>
          <span
            className="text-attribution"
            style={{ color: "var(--map-attribution)" }}
          >
            © OpenFreeMap © OpenMapTiles © OpenStreetMap
          </span>
        </div>
      ))}
    </div>
  ),
};
