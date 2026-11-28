import { NEIGHBORHOODS } from "@/lib/santa/neighborhoods";
import { shareCardText } from "@/lib/santa/share";
import { renderShareCard } from "../cards";

// 동네별 공유 카드 그림(/og/kr-11440). 빌드 때 256곳을 모두 만들어 두고(정적), 그 밖의 주소는 404다.
// 도착 시각은 해마다 경로를 다시 만들 때만 바뀌므로 요청마다 그릴 필요가 없다. 이브 밤 서버 부담도 없다.
// 남은 시간 대신 도착 시각을 쓴다: 메신저가 미리보기 그림을 오래 저장해 두어 남은 시간은 금방 틀린다(결정 2026-11-26).

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return NEIGHBORHOODS.map((n) => ({ id: n.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = NEIGHBORHOODS.find((x) => x.id === id);
  if (!n) return new Response("Not Found", { status: 404 });
  return renderShareCard(shareCardText(n.label, n.arriveUtc));
}
