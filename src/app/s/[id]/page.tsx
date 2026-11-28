import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MainScreen } from "@/components/MainScreen";
import { SHARE_CARD_SIZE } from "@/components/ShareCardArt";
import { NEIGHBORHOODS } from "@/lib/santa/neighborhoods";
import { cleanGreeting, GREETING_PARAM, shareMeta } from "@/lib/santa/share";

// 공유 링크(/s/kr-11440?m=인사말). 기획서: 공유받은 링크는 받는 사람의 동네 기준으로 열린다.
// - 링크 미리보기(메신저): 그림은 보낸 사람 동네의 도착 시각(/og/[id], 정적), 제목은 인사말.
//   카카오톡 같은 메신저는 JS를 실행하지 않으므로 서버가 HTML <meta>에 넣어 보낸다. 그래서 이 페이지는 요청마다 그린다.
//   첫 페이지(/)는 그대로 정적이다.
// - 화면: 첫 페이지와 같은 MainScreen. 동네는 이 기기에 저장된 동네(받는 사람)를 쓰고, 처음에 인사말 시트를 띄운다.
// 인사말은 주소에서 읽은 남의 글이라 같은 규칙으로 다시 다듬는다(cleanGreeting). React가 글자로만 넣으므로 HTML로 해석되지 않는다.

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const findNeighborhood = (id: string) => NEIGHBORHOODS.find((n) => n.id === id);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const n = findNeighborhood(id);
  if (!n) return {};
  const meta = shareMeta(n.label, n.arriveUtc, cleanGreeting(query[GREETING_PARAM]));
  const image = { url: `/og/${n.id}`, ...SHARE_CARD_SIZE, alt: meta.imageAlt, type: "image/png" };
  return {
    description: meta.description,
    openGraph: {
      type: "website",
      siteName: "산타 어디쯤",
      locale: "ko_KR",
      title: meta.title,
      description: meta.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [image],
    },
    // 사람마다 다른 인사말 주소가 검색에 실리지 않게
    robots: { index: false },
  };
}

export default async function SharedPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // 없는 동네(주소를 잘못 옮겼거나 다음 해에 바뀐 id)는 첫 페이지로
  if (!findNeighborhood(id)) redirect("/");
  return <MainScreen received={{ greeting: cleanGreeting(query[GREETING_PARAM]) }} />;
}
