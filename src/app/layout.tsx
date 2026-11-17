import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_KR, Jua } from 'next/font/google';
import './globals.css';

// 글꼴은 빌드 때 받아 우리 도메인에서 내보낸다(방문자가 Google에 직접 접속하지 않는다).
// 한글은 쓰인 글자 범위만 나눠 받는다. 미리 받지 않고(preload: false) 먼저 시스템 글꼴로 보여준다(swap).
const plex = IBM_Plex_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-plex',
});
const jua = Jua({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-jua',
});

export const metadata: Metadata = {
  title: '산타 어디쯤',
  description: '크리스마스이브, 산타가 우리 동네에 오기까지 남은 시간',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b1830',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${plex.variable} ${jua.variable}`}>
      <body>{children}</body>
    </html>
  );
}
