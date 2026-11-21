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
    // 위: 글자, 아래: 남은 칸을 채우는 그림. 글자와 그림이 겹치지 않는다(작은 화면에서는 그림이 작아진다).
    // 예전에는 그림이 칸 전체를 채우고 글자가 그 위에 떠 있어서, 칸이 낮아지면(320×568, 큰 글씨) 글자가 산타 그림을 덮었다
    <div className="flex h-full w-full flex-col overflow-hidden bg-night">
      {/* 글자는 그림 밖 HTML로 둔다. 그림 속 글자(SVG text)는 크기가 화면 폭을 따라 변해 큰 글씨 모드가 듣지 않는다 */}
      {/*
        오른쪽 위 설정 버튼(위 20px, 44×44px)에 글자가 가리지 않게(좁은 화면에서 큰 카운트다운이 버튼과 겹쳤다):
        첫 줄은 버튼과 같은 높이의 줄(FIRST_ROW)에 두고 양옆을 비운다. 그 아래 글자는 버튼 아래에서 시작해 폭을 다 쓴다
      */}
      <div className="flex shrink-0 flex-col items-center gap-1 break-keep px-4 pt-5 text-center">
        {before ? (
          <>
            <p className={`${FIRST_ROW} text-body text-scene-text`}>산타 출발까지</p>
            <p className="whitespace-pre-wrap font-display text-countdown text-gold">
              {now === null ? " " : formatRemaining(first.arriveUtc - now)}
            </p>
            {/* 시각을 모를 때도 한 줄 높이를 잡아 둔다. 나중에 생기면 아래 그림이 줄어들며 화면이 밀린다 */}
            <p className="min-h-[1.5em] text-caption text-scene-text-soft">
              {now !== null &&
                `${formatKstTime(first.arriveUtc, now, { showZone })}, ${first.name}에서 출발해요`}
            </p>
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
      {/* 아래 24px은 메인 화면의 카드가 겹쳐 올라오는 곳(MainScreen -mt-6). 그림이 가려지지 않게 비운다 */}
      <div className="relative mb-6 min-h-0 flex-1">
        <VillageDrawing
          label={
            before ? "북극 마을에서 출발을 준비하는 산타" : "여정을 마치고 북극 마을로 돌아온 산타"
          }
          caption={before ? "북극 마을 · 선물 포장 중" : "북극 마을 · 쉬는 중"}
        />
      </div>
    </div>
  );
}

/**
 * 북극 마을 그림(화면 시안 "3. 시즌 전"). 390×520 기준으로 그렸고, 글자 아래 남은 칸에 맞춰 늘거나 줄어든다.
 * viewBox는 위쪽 빈 밤하늘(y 0~80, 예전에 글자가 있던 곳)을 잘라 그림이 더 크게 보이게 한다.
 * preserveAspectRatio "xMidYMax meet": 그림 전체가 보이게 맞추고 아래쪽에 붙인다(남는 곳은 밤하늘 바탕색).
 */
function VillageDrawing({ label, caption }: { label: string; caption: string }) {
  return (
    <svg
      viewBox="0 80 390 440"
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
