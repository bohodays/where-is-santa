import { SHARE_CARD_SIZE } from "@/components/ShareCardArt";
import { DEFAULT_SHARE_CARD } from "@/lib/santa/share";
import { renderShareCard } from "./og/cards";

// 첫 페이지 주소(/)를 그냥 보낼 때의 링크 미리보기 그림. 빌드 때 한 번 만든다.
// 공유 링크(/s/[id])는 자기 동네 그림(/og/[id])으로 바꿔 단다.

export const alt = `${DEFAULT_SHARE_CARD.headline}: ${DEFAULT_SHARE_CARD.time}`;
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard(DEFAULT_SHARE_CARD);
}
