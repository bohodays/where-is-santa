// 공유 카드 그림(1200×630). 같은 코드로 두 곳에서 그린다:
// - 서버: 링크 미리보기 이미지(next/og의 ImageResponse, src/app/s/[id]/og). 그림 그리는 엔진(satori)은
//   flex 배치와 인라인 style만 알아서, Tailwind 클래스·CSS 변수 없이 style과 고정 색으로 쓴다.
//   자식이 둘 이상인 div는 display: flex가 있어야 한다.
// - 화면: 공유 시트의 "링크를 보내면 이렇게 보여요"(SharePanel). 같은 그림을 줄여 보인다.
// 크기는 u(1200 기준 px)로 받는다. 서버는 px, 화면은 컨테이너 너비 비율(cqw)로 바꿔서 어느 폭에서도 같은 모양이다.
// 색은 다른 사람의 메신저에 보이는 그림이라 고대비·낮 지도 설정과 상관없이 늘 같다(globals.css의 기본 밤 색과 같은 값).

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

const NIGHT = "#0b1830"; // --color-night
const NIGHT_GLOW = "#1a2e52"; // --map-land
const SANTA = "#d6453b"; // --color-santa
const GOLD = "#f2c14e"; // --color-gold
const TEXT = "#dbe5f5"; // --scene-text
const TEXT_SOFT = "#c9d6ee"; // --scene-text-soft
const WHITE = "#ffffff";

/** 별: [왼쪽 %, 위 %, 크기 px] */
const STARS: [number, number, number][] = [
  [62, 14, 6],
  [74, 30, 4],
  [86, 12, 8],
  [93, 38, 5],
  [70, 52, 4],
  [55, 26, 4],
  [82, 62, 5],
];

export type ShareCardArtProps = {
  /** 작은 제목. 예) "서울 마포구에 산타가 오는 시간" */
  headline: string;
  /** 큰 글자. 예) "12월 24일 밤 12시 20분" */
  time: string;
  /** 1200 기준 px를 그릴 단위로 바꾼다 */
  u: (px: number) => string;
  /** 큰 글자(Jua)와 본문 글꼴 이름 */
  fonts: { display: string; sans: string };
};

export function ShareCardArt({ headline, time, u, fonts }: ShareCardArtProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: u(SHARE_CARD_SIZE.width),
        height: u(SHARE_CARD_SIZE.height),
        padding: `${u(64)} ${u(72)}`,
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: NIGHT,
        backgroundImage: `radial-gradient(circle at 88% 18%, ${NIGHT_GLOW} 0%, ${NIGHT} 55%)`,
        fontFamily: fonts.sans,
        color: TEXT,
      }}
    >
      {STARS.map(([left, top, size]) => (
        <div
          key={`${left}-${top}`}
          style={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: u(size),
            height: u(size),
            borderRadius: u(size),
            backgroundColor: GOLD,
            opacity: 0.7,
          }}
        />
      ))}

      {/* 위: 산타 표시(지도와 같은 빨간 원 + 흰 모자)와 서비스 이름 */}
      <div style={{ display: "flex", alignItems: "center", gap: u(24) }}>
        <SantaMark size={u(88)} border={u(5)} icon={u(50)} />
        <div style={{ fontSize: u(38), fontWeight: 700, color: TEXT_SOFT }}>산타 어디쯤</div>
      </div>

      {/* 아래: 어느 동네에 언제 오는지 */}
      <div style={{ display: "flex", flexDirection: "column", gap: u(12) }}>
        <div style={{ fontSize: u(46), fontWeight: 700, color: TEXT }}>{headline}</div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: u(88),
            lineHeight: 1.1,
            color: GOLD,
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

/** 산타 표시. 앱 아이콘(src/app/icon.svg)과 같은 그림 */
function SantaMark({ size, border, icon }: { size: string; border: string; icon: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: SANTA,
        border: `${border} solid ${WHITE}`,
        boxSizing: "border-box",
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: icon, height: icon }} aria-hidden="true">
        <path d="M5 17 L12 4 L19 17 Z" fill={WHITE} />
        <rect x="4" y="16" width="16" height="4" rx="2" fill={WHITE} />
        <circle cx="12" cy="3.6" r="2" fill={WHITE} />
      </svg>
    </div>
  );
}
