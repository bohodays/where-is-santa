import type { Metadata, Viewport } from "next";
import { DEMO_BOOT_SCRIPT } from "@/lib/santa/clock";
import { HOME_BOOT_SCRIPT } from "@/lib/santa/home";
import { SETTINGS_BOOT_SCRIPT } from "@/lib/santa/settings";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "산타 어디쯤",
  description: "크리스마스이브, 산타가 우리 동네에 오기까지 남은 시간",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1830",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: 아래 스크립트가 React보다 먼저 <html>에 설정 속성(큰 글씨 등)을 붙인다.
    // 서버가 그린 <html>과 속성이 달라도 일부러 그런 것이라 경고하지 않게 한다(<html> 한 칸에만 적용된다)
    <html lang="ko" className={fontVariables} suppressHydrationWarning>
      <head>
        {/*
          설정(큰 글씨·고대비·움직임 줄이기), "동네를 골랐는가", "데모 주소인가"를 첫 화면을 그리기 전에 <html> 속성으로 켠다.
          뒤에 켜면 글자가 커지거나 안내·데모 띠가 생기고 사라지며 화면이 밀린다
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: SETTINGS_BOOT_SCRIPT + HOME_BOOT_SCRIPT + DEMO_BOOT_SCRIPT,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
