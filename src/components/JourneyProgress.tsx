import { formatKstTime } from "@/lib/santa/format";
import type { Stop } from "@/lib/santa/route";
import { journeyProgress } from "@/lib/santa/santa";
import { Button } from "./Button";
import { ChevronRightIcon } from "./icons";

// "산타의 여정 18%" 막대와 출발·끝 시각, "도착 순서 보기".

type JourneyProgressProps = {
  /** 현재 시각(epoch ms). 아직 모르면 null */
  now: number | null;
  route: Stop[];
  showZone?: boolean;
  onShowArrivals?: () => void;
};

export function JourneyProgress({
  now,
  route,
  showZone = false,
  onShowArrivals,
}: JourneyProgressProps) {
  const percent = now === null ? null : Math.round(journeyProgress(now, route) * 100);
  const first = route[0];
  const last = route[route.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-ink-soft">
          산타의 여정 {percent !== null && <strong className="text-ink">{percent}%</strong>}
        </span>
        <Button variant="quiet" className="no-underline" onClick={onShowArrivals}>
          도착 순서 보기
          <ChevronRightIcon />
        </Button>
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
      {now !== null && first && last && (
        <div className="flex justify-between gap-2 text-caption text-ink-soft">
          <span>출발 {formatKstTime(first.arriveUtc, now, { showZone })}</span>
          <span>끝 {formatKstTime(last.arriveUtc, now)}</span>
        </div>
      )}
    </div>
  );
}
