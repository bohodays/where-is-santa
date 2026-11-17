import { IBM_Plex_Sans_KR, Jua } from "next/font/google";

// 글꼴은 빌드 때 받아 우리 도메인에서 내보낸다(방문자가 Google에 직접 접속하지 않는다).
// 한글은 쓰인 글자 범위만 나눠 받는다. 미리 받지 않고(preload: false) 먼저 시스템 글꼴로 보여준다(swap).
// 앱(layout.tsx)과 Storybook(.storybook/preview.tsx)이 같이 쓴다.
const plex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-plex",
});

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-jua",
});

/** <html>에 붙이는 글꼴 CSS 변수 클래스 (--font-plex, --font-jua) */
export const fontVariables = `${plex.variable} ${jua.variable}`;
