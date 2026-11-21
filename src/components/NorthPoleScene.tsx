import { formatKstTime, formatRemaining } from "@/lib/santa/format";

// 출발 전·끝난 뒤 지도 자리를 채우는 북극 마을 그림(결정 2026-11-17, docs/components.md).
// 메르카토르 지도는 북극을 그리지 못해서, 산타가 북극에 있는 동안은 지도 대신 이 그림을 보여준다.
// 지도 JS를 받지 않으므로 공개 전 방문(대부분)의 첫 화면이 가장 가볍다.
// 색은 늘 밤 그림이라 --map-*(낮/밤으로 바뀐다)이 아니라 --scene-* 토큰을 쓴다.

type NorthPoleSceneProps = {
  /** before: 출발 전(선물 포장 중), after: 여정이 끝난 뒤 */
  phase: "before" | "after";
  /** 현재 시각(epoch ms). 아직 모르면 null */
  now: number | null;
  /** 첫 도착(출발) 도시. 전체 경로 없이 요약만 받는다(route-summary.ts) */
  first: { name: string; arriveUtc: number };
  /** 기기 시계가 한국과 다르면 true(needsKstLabel) */
  showZone?: boolean;
};

export function NorthPoleScene({ phase, now, first, showZone = false }: NorthPoleSceneProps) {
  const before = phase === "before";

  return (
    <div className="relative h-full w-full overflow-hidden bg-night">
      <VillageDrawing
        label={
          before ? "북극 마을에서 출발을 준비하는 산타" : "여정을 마치고 북극 마을로 돌아온 산타"
        }
        caption={before ? "북극 마을 · 선물 포장 중" : "북극 마을 · 쉬는 중"}
      />
      {/* 글자는 그림 위에 따로 둔다. 그림 속 글자(SVG text)는 크기가 화면 폭을 따라 변해 큰 글씨 모드가 듣지 않는다 */}
      {/*
        오른쪽 위 설정 버튼(위 20px, 44×44px)에 글자가 가리지 않게(좁은 화면에서 큰 카운트다운이 버튼과 겹쳤다):
        첫 줄은 버튼과 같은 높이의 줄(FIRST_ROW)에 두고 양옆을 비운다. 그 아래 글자는 버튼 아래에서 시작해 폭을 다 쓴다.
        글자 덩어리를 통째로 내리거나 양옆을 다 비우면 작은 화면(320×568)에서 산타 그림까지 내려와서 쓰지 않았다
      */}
      <div className="absolute inset-x-4 top-5 flex flex-col items-center gap-1 break-keep text-center">
        {before ? (
          <>
            <p className={`${FIRST_ROW} text-body text-scene-text`}>산타 출발까지</p>
            <p className="whitespace-pre-wrap font-display text-countdown text-gold">
              {now === null ? " " : formatRemaining(first.arriveUtc - now)}
            </p>
            {now !== null && (
              <p className="text-caption text-scene-text-soft">
                {formatKstTime(first.arriveUtc, now, { showZone })}, {first.name}에서 출발해요
              </p>
            )}
          </>
        ) : (
          <>
            <p className={`${FIRST_ROW} font-display text-title text-gold`}>
              산타가 북극으로 돌아갔어요
            </p>
            <p className="text-caption text-scene-text-soft">내년 크리스마스이브에 또 만나요</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 북극 마을 그림(화면 시안 "3. 시즌 전"). 390×520 기준으로 그리고, 화면 크기에 맞춰 늘거나 줄어든다.
 * preserveAspectRatio "xMidYMax meet": 그림 전체가 보이게 맞추고 아래쪽에 붙인다(위쪽 빈 곳은 밤하늘 바탕색).
 */
function VillageDrawing({ label, caption }: { label: string; caption: string }) {
  return (
    <svg
      viewBox="0 0 390 520"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={label}
      className="absolute inset-0 h-full w-full"
    >
      <circle cx="195" cy="300" r="170" className="fill-scene-ice" />
      <circle
        cx="195"
        cy="300"
        r="120"
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 6"
        className="stroke-scene-ring"
      />
      <circle
        cx="195"
        cy="300"
        r="70"
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 6"
        className="stroke-scene-ring"
      />
      {/* 눈 언덕과 집 두 채 */}
      <path d="M140 330 Q195 290 250 330 L250 360 L140 360 Z" className="fill-scene-snow" />
      <rect x="160" y="322" width="22" height="22" className="fill-santa" />
      <path d="M156 324 L171 310 L186 324 Z" className="fill-surface" />
      <rect x="198" y="318" width="28" height="26" className="fill-scene-house" />
      <path d="M194 320 L212 304 L230 320 Z" className="fill-surface" />
      {/* 산타 표시(지도와 같은 모양) */}
      <circle cx="195" cy="268" r="22" opacity="0.25" className="fill-santa" />
      <circle cx="195" cy="268" r="15" strokeWidth="2" className="fill-santa stroke-surface" />
      <path d="M187 273 L195 258 L203 273 Z" className="fill-surface" />
      <rect x="185" y="272" width="20" height="4" rx="2" className="fill-surface" />
      <circle cx="196" cy="257" r="2.5" className="fill-surface" />
      {/* 별 */}
      <circle cx="70" cy="120" r="1.5" className="fill-gold" />
      <circle cx="310" cy="90" r="1.5" className="fill-gold" />
      <circle cx="340" cy="190" r="1.2" className="fill-gold" />
      <circle cx="40" cy="250" r="1.2" className="fill-gold" />
      <circle cx="250" cy="140" r="1" className="fill-gold" />
      <text
        x="195"
        y="392"
        textAnchor="middle"
        fontSize="13"
        className="fill-scene-text-soft font-sans"
      >
        {caption}
      </text>
    </svg>
  );
}

/** 설정 버튼과 같은 높이(44px 이상)의 첫 줄. 양옆 48px(버튼 44px + 사이 4px)을 비워 버튼과 겹치지 않는다 */
const FIRST_ROW = "flex min-h-touch items-center px-12";
