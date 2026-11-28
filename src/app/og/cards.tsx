import { ImageResponse } from "next/og";
import { SHARE_CARD_SIZE, ShareCardArt } from "@/components/ShareCardArt";
import { SHARE_CARD_FONT_NAMES, shareCardFonts } from "./fonts";

// 공유 카드 그림을 PNG로 만든다(동네별 /og/[id], 첫 페이지 opengraph-image).

export async function renderShareCard(card: { headline: string; time: string }) {
  return new ImageResponse(
    <ShareCardArt {...card} u={(px) => `${px}px`} fonts={SHARE_CARD_FONT_NAMES} />,
    { ...SHARE_CARD_SIZE, fonts: await shareCardFonts() },
  );
}
