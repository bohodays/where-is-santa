import { describeSanta } from "@/lib/santa/describe";
import type { Stop } from "@/lib/santa/route";
import { santaAt } from "@/lib/santa/santa";

// 지도 위 왼쪽 위 알약: "지금 산타는 부산 상공" + 아래 줄 "다음 도착: 대구, 2분 뒤".
// 시각(now)은 쓰는 쪽(메인 화면)이 useNow()로 읽어 넘긴다. 이 컴포넌트는 시각을 읽지 않아서 스토리에서 고정할 수 있다.

type SantaLocationBannerProps = {
  /** 현재 시각(epoch ms). 아직 모르면(첫 렌더) null */
  now: number | null;
  route: Stop[];
};

export function SantaLocationBanner({ now, route }: SantaLocationBannerProps) {
  const text = now === null ? null : describeSanta(santaAt(now, route), now);

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/*
        화면 낭독기는 aria-live 영역의 글자가 바뀔 때만 읽는다. 위 줄(headline)은 도시가 바뀔 때만 바뀌므로 이 영역에 넣고,
        1분마다 바뀌는 아래 줄은 영역 밖에 둔다. aria-live 영역은 처음부터 있어야 바뀐 내용을 읽으므로 로딩 중에도 그린다.
      */}
      <p
        aria-live="polite"
        className="inline-flex items-center gap-2 break-keep text-balance rounded-pill bg-surface px-3.5 py-2 text-body font-bold text-ink shadow-float"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-santa" />
        {text ? text.headline : "산타를 찾는 중…"}
      </p>
      {text?.detail && (
        <p className="break-keep pl-1.5 text-caption text-map-text">{text.detail}</p>
      )}
    </div>
  );
}
