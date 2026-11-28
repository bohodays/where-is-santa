import type { ImageResponse } from "next/og";
import { NEIGHBORHOODS } from "@/lib/santa/neighborhoods";
import { DEFAULT_SHARE_CARD, shareCardText } from "@/lib/santa/share";

// 공유 카드 그림(ImageResponse)에 쓰는 한글 글꼴. 화면과 같은 Jua(큰 글자)·IBM Plex Sans KR(본문)이다.
// 그림 엔진은 woff2를 못 읽고 한글 글꼴 전체는 수 MB라, 그림에 실제로 쓰는 글자만 Google Fonts에서 TTF로 받는다(text=).
// 그림은 빌드 때 만들어지므로(정적) 받는 것도 빌드 때 한 번이다. 방문자의 정보는 보내지 않는다(동네 이름 같은 고정 글자만).
// next/font도 빌드 때 같은 곳에서 글꼴을 받으므로 빌드에 새로운 외부 의존이 생기지는 않는다.

type Font = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>[number];

const CSS_API = "https://fonts.googleapis.com/css2";

/** 그림에 쓰는 모든 글자(겹치지 않게). 모든 동네의 카드 글자와 기본 카드 글자 */
function usedText(): { display: string; sans: string } {
  const display = new Set<string>();
  const sans = new Set<string>("산타 어디쯤");
  const cards = [
    DEFAULT_SHARE_CARD,
    ...NEIGHBORHOODS.map((n) => shareCardText(n.label, n.arriveUtc)),
  ];
  for (const { headline, time } of cards) {
    for (const c of time) display.add(c);
    for (const c of headline) sans.add(c);
  }
  return { display: [...display].join(""), sans: [...sans].join("") };
}

async function googleFont(family: string, text: string): Promise<ArrayBuffer> {
  const cssResponse = await fetch(`${CSS_API}?family=${family}&text=${encodeURIComponent(text)}`);
  if (!cssResponse.ok)
    throw new Error(`글꼴 CSS를 받지 못했어요(${family}): ${cssResponse.status}`);
  // 브라우저가 아닌 요청에는 TTF 주소를 준다(woff2는 브라우저에만)
  const url = (await cssResponse.text()).match(
    /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/,
  )?.[1];
  if (!url) throw new Error(`글꼴 CSS에 TTF 주소가 없어요(${family})`);
  const fontResponse = await fetch(url);
  if (!fontResponse.ok) throw new Error(`글꼴을 받지 못했어요(${family}): ${fontResponse.status}`);
  return fontResponse.arrayBuffer();
}

let loading: Promise<Font[]> | null = null;

/** 공유 카드 글꼴. 빌드(프로세스)마다 한 번만 받는다. 실패하면 빌드가 멈춘다(빈 글자 그림을 내보내지 않게) */
export function shareCardFonts(): Promise<Font[]> {
  loading ??= (() => {
    const text = usedText();
    return Promise.all([
      googleFont("Jua", text.display),
      googleFont("IBM+Plex+Sans+KR:wght@700", text.sans),
    ]).then(([jua, plex]) => [
      { name: "Jua", data: jua, weight: 400, style: "normal" },
      { name: "Plex", data: plex, weight: 700, style: "normal" },
    ]);
  })();
  loading.catch(() => {
    loading = null; // 다음 요청(개발 서버)에서 다시 시도한다
  });
  return loading;
}

/** ShareCardArt에 넘기는 글꼴 이름(위 name과 같다) */
export const SHARE_CARD_FONT_NAMES = { display: "Jua", sans: "Plex" };
