"use client";

import { useEffect, useRef, useState } from "react";
import { arrivalRows, type ArrivalRow } from "@/lib/santa/arrivals";
import { santaPlace, untilText } from "@/lib/santa/describe";
import { formatKstTime } from "@/lib/santa/format";
import type { Stop } from "@/lib/santa/route";
import { Button } from "./Button";

// 도착 순서 시트의 내용(시안 1-2): 지난 도시, 지금, 다음 도시를 한국 시각으로. 우리 동네 줄은 강조.
// 경로가 661곳이라 지금 앞뒤만 보이고 "다음 도시 더 보기"로 늘린다(arrivalRows).
// 시트 제목·"한국 시각 기준"은 쓰는 쪽(ModalSheet)이 붙인다.

/** 처음 보일 다음 도시 수와 "더 보기"로 늘리는 수 */
const FIRST_AFTER = 6;
const MORE = 10;

type ArrivalListProps = {
  now: number | null;
  /** 전체 경로. 따로 불러오므로(useRoute) 아직 없으면 null */
  route: Stop[] | null;
  loadFailed?: boolean;
  homeId: string;
};

export function ArrivalList({ now, route, loadFailed = false, homeId }: ArrivalListProps) {
  const [after, setAfter] = useState(FIRST_AFTER);
  const nowRowRef = useRef<HTMLLIElement>(null);
  const firstUpcomingRef = useRef<HTMLLIElement>(null);
  const ready = now !== null && route !== null;

  // 시트가 열리면 지금 줄(출발 전에는 첫 예정 도시)이 보이게 한 번 스크롤한다(docs/components.md)
  useEffect(() => {
    if (!ready) return;
    (nowRowRef.current ?? firstUpcomingRef.current)?.scrollIntoView({ block: "center" });
  }, [ready]);

  if (loadFailed) {
    return (
      <p className="text-body text-ink-soft">
        도착 순서를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.
      </p>
    );
  }
  if (!ready) {
    return <p className="text-body text-ink-soft">도착 순서를 불러오는 중…</p>;
  }

  const rows = arrivalRows(now, route, homeId, { before: 2, after });
  const hasMore = rows.some((r) => r.kind === "stop" && !r.passed) && route.length > rows.length;
  let firstUpcomingMarked = false;

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col border-t border-line">
        {rows.map((row) => {
          const key = rowKey(row);
          if (row.kind === "gap") {
            return (
              <li key={key} className="py-2 text-center text-caption text-ink-soft">
                ⋯ 도시 {row.hidden.toLocaleString("ko-KR")}곳 ⋯
              </li>
            );
          }
          if (row.kind === "now") {
            return (
              <li key={key} ref={nowRowRef} className={ROW}>
                <span className="flex items-center gap-2 text-body font-bold text-now">
                  <span aria-hidden="true" className="size-2.5 shrink-0 rounded-pill bg-santa" />
                  지금
                </span>
                <span className="text-body-lg font-bold text-now">{santaPlace(row.santa)}</span>
                <span />
              </li>
            );
          }
          const { stop, passed, isHome } = row;
          const markFirst = !passed && !firstUpcomingMarked;
          if (markFirst) firstUpcomingMarked = true;
          return (
            <li
              key={key}
              ref={markFirst ? firstUpcomingRef : undefined}
              className={`${ROW} ${isHome ? "rounded-input bg-highlight" : ""} ${passed ? "text-ink-faint" : "text-ink"}`}
            >
              <span className="text-body tabular-nums">{formatKstTime(stop.arriveUtc)}</span>
              <span className={`text-body-lg ${isHome ? "font-bold" : ""}`}>{stop.name}</span>
              {/* 우리 동네는 색만이 아니라 글자로도 알린다(접근성) */}
              <span className={`text-caption ${isHome ? "font-bold text-ink" : ""}`}>
                {isHome ? "우리 동네" : passed ? "지나감" : untilText(stop.arriveUtc - now)}
              </span>
            </li>
          );
        })}
      </ol>
      {hasMore && (
        <Button variant="secondary" className="w-full" onClick={() => setAfter((n) => n + MORE)}>
          다음 도시 더 보기
        </Button>
      )}
    </div>
  );
}

/** 한 줄: 시각 | 도시 | 상태. 시각 칸은 "새벽 12시 32분"이 한 줄에 들어가는 폭 */
const ROW =
  "grid min-h-12 grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-2 break-keep border-b border-line px-1";

function rowKey(row: ArrivalRow): string {
  if (row.kind === "stop") return row.stop.id;
  if (row.kind === "now") return "now";
  return "gap";
}
