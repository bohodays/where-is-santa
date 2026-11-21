import { formatKstTime } from "@/lib/santa/format";
import { progressBetween } from "@/lib/santa/santa";
import { Button } from "./Button";
import { ChevronRightIcon } from "./icons";

// "산타의 여정 18%" 막대와 출발·끝 시각, "도착 순서 보기".
// 전체 경로 없이 첫 도착·마지막 도착 시각만 받는다(첫 화면 JS를 가볍게, route-summary.ts).

type JourneyProgressProps = {
  /** 현재 시각(epoch ms). 아직 모르면 null */
  now: number | null;
  /** 첫 도착(출발) 시각 */
  start: number;
  /** 마지막 도착 시각 */
  end: number;
  showZone?: boolean;
  onShowArrivals?: () => void;
};

export function JourneyProgress({
  now,
  start,
  end,
  showZone = false,
  onShowArrivals,
}: JourneyProgressProps) {
  const percent = now === null ? null : Math.round(progressBetween(now, start, end) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-touch items-center justify-between gap-2">
        <span className="text-caption text-ink-soft">
          산타의 여정 {percent !== null && <strong className="text-ink">{percent}%</strong>}
        </span>
        {/* 도착 순서 시트가 연결됐을 때만 보인다 */}
        {onShowArrivals && (
          <Button variant="quiet" className="no-underline" onClick={onShowArrivals}>
            도착 순서 보기
            <ChevronRightIcon />
          </Button>
        )}
      </div>
      {/* 화면 낭독기는 progressbar를 "산타의 여정, 전체 여정의 18%"처럼 읽는다 */}
      <div
        role="progressbar"
        aria-label="산타의 여정"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={percent === null ? "불러오는 중" : `전체 여정의 ${percent}%`}
        className="h-2.5 overflow-hidden rounded-pill bg-line"
      >
        <div className="h-full rounded-pill bg-santa" style={{ width: `${percent ?? 0}%` }} />
      </div>
      {now !== null && (
        <div className="flex justify-between gap-2 text-caption text-ink-soft">
          <span>출발 {formatKstTime(start, now, { showZone })}</span>
          <span>끝 {formatKstTime(end, now)}</span>
        </div>
      )}
    </div>
  );
}
