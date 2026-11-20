import { homeCountdown } from "@/lib/santa/countdown";
import { formatKstTime, formatRemaining } from "@/lib/santa/format";
import { Button } from "./Button";

// 고정형 시트의 위쪽: "서울 마포구까지" + 동네 바꾸기, 큰 글자 남은 시간, 도착 예정 시각.
// 남은 시간은 aria-live가 아니다. 1초마다 읽히면 화면 낭독기가 시끄럽다(도착 소식은 SantaLocationBanner가 알린다).

type CountdownCardProps = {
  /** 현재 시각(epoch ms). 아직 모르면(서버 렌더, 첫 렌더) null */
  now: number | null;
  /** 동네 이름. 예) "서울 마포구" */
  homeName: string;
  /** 그 동네 도착 시각(epoch ms) */
  arriveUtc: number;
  /** 사람이 직접 고른 동네인가. false면 기본값(서울)이라 "동네 고르기"를 강조한다 */
  homeChosen: boolean;
  /** 기기 시계가 한국과 다르면 true. 시각 앞에 "한국 시각"을 붙인다(needsKstLabel) */
  showZone?: boolean;
  onChangeHome?: () => void;
};

export function CountdownCard({
  now,
  homeName,
  arriveUtc,
  homeChosen,
  showZone = false,
  onChangeHome,
}: CountdownCardProps) {
  const state = now === null ? null : homeCountdown(now, arriveUtc);
  const arriveText = now === null ? null : formatKstTime(arriveUtc, now, { showZone });

  let big: string;
  let small: string | null;
  if (state === null) {
    // 시각을 모를 때도 자리는 같은 높이로 잡아 둔다. 시각이 들어올 때 아래 내용이 밀리지 않게(레이아웃 이동 방지)
    big = " ";
    small = " ";
  } else if (state.kind === "waiting") {
    big = formatRemaining(state.remainingMs);
    small = `도착 예정 ${arriveText}`;
  } else if (state.kind === "arrived") {
    big = "산타가 왔어요!";
    small = "우리 동네에 선물을 두고 있어요";
  } else {
    big = "다녀갔어요";
    small = `${arriveText}에 다녀갔어요`;
  }

  return (
    <div className="flex flex-col break-keep">
      {/* 버튼이 없어도 줄 높이는 버튼(44px)과 같게 둔다. 나중에 버튼이 붙어도 화면이 밀리지 않는다 */}
      <div className="flex min-h-touch items-center justify-between gap-2">
        <h2 className="text-body text-ink-soft">{homeName}까지</h2>
        {/* 동네 고르기 시트가 연결됐을 때만 버튼을 보인다. 눌러도 아무 일이 없는 버튼은 내지 않는다 */}
        {onChangeHome && (
          <Button
            variant="quiet"
            className={homeChosen ? undefined : "font-bold"}
            onClick={onChangeHome}
          >
            {homeChosen ? "동네 바꾸기" : "우리 동네 고르기"}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-1" aria-busy={state === null || undefined}>
        <p className="whitespace-pre-wrap font-display text-countdown text-ink">{big}</p>
        <p className="whitespace-pre-wrap text-body text-ink-soft">{small}</p>
      </div>
      {!homeChosen && onChangeHome && state !== null && (
        <p className="mt-2 text-caption text-ink-soft">
          지금은 서울 기준이에요. 동네를 고르면 더 정확해요.
        </p>
      )}
    </div>
  );
}
