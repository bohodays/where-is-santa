"use client";

import { useEffect } from "react";
import { useClock, useNow } from "@/hooks/useNow";
import { useRoute } from "@/hooks/useRoute";
import { needsKstLabel } from "@/lib/santa/format";
import { ROUTE_SUMMARY } from "@/lib/santa/route-summary";
import { journeyPhase } from "@/lib/santa/santa";
import { BottomSheet } from "./BottomSheet";
import { CountdownCard } from "./CountdownCard";
import { JourneyProgress } from "./JourneyProgress";
import { loadMapLibrary, SantaMap } from "./map/SantaMap";
import { NorthPoleScene } from "./NorthPoleScene";
import { SantaLocationBanner } from "./SantaLocationBanner";

// 메인 화면(컨테이너). 현재 시각을 읽는 곳은 여기 한 곳이다(useNow). 아래 조각들은 now를 받아 보여주기만 한다.
// 위: 출발 전·끝난 뒤는 북극 마을 그림, 여정 중에는 세계 지도(SantaMap) + 위치 알약.
// 지도는 프레임마다 산타를 옮기므로 시각 대신 시계를 읽는 함수(useClock)를 받는다. 둘 다 같은 보정 시계다.
// 아래: 고정형 시트에 우리 동네 카운트다운과 여정 막대.
// 데모: 주소에 ?demo=2026-12-25T00:20:00%2B09:00&speed=60 을 붙이면 그 시각부터 흐른다(useNow).

// 첫 화면은 경로 요약(첫 도착·마지막 도착·기본 동네)만 쓴다. 전체 경로(661곳)는 출발 직전에 불러온다(useRoute).
const { first: FIRST, last: LAST, defaultHome: HOME } = ROUTE_SUMMARY;
/** 출발 이만큼 전부터 전체 경로와 지도 JS를 미리 받아 둔다. 출발 순간 "산타를 찾는 중…"이 길게 보이지 않게 */
const PRELOAD_MS = 10 * 60_000;

export function MainScreen() {
  const now = useNow();
  const phase = now === null ? null : journeyPhase(now, FIRST.arriveUtc, LAST.arriveUtc);
  const onJourney = phase === "journey";
  const readClock = useClock();
  const soon = now !== null && phase !== "after" && now >= FIRST.arriveUtc - PRELOAD_MS;
  const route = useRoute(soon);
  // 지도 JS(약 1MB)도 출발 전에 미리 받아 둔다. 실패해도 여기서는 조용히 넘기고, 지도를 그릴 때 다시 시도한다
  useEffect(() => {
    if (soon) loadMapLibrary().catch(() => {});
  }, [soon]);
  // 기기 시계가 한국과 다르면 시각 앞에 "한국 시각"을 붙인다. 브라우저의 시간대 설정을 읽으므로 시각을 안 뒤에만 계산한다
  const showZone =
    now !== null && needsKstLabel(Intl.DateTimeFormat().resolvedOptions().timeZone, now);

  return (
    // 100dvh: 휴대폰 주소창이 접혔다 펴져도 화면 높이에 맞는다. 모르는 브라우저는 100vh(h-screen)
    <main className="mx-auto flex h-screen max-w-md flex-col bg-night supports-[height:100dvh]:h-dvh">
      <h1 className="sr-only">산타 어디쯤</h1>

      {/* 위쪽: 시트 둥근 모서리 뒤로 지도·그림이 이어져 보이게 시트를 살짝(-mt-6) 겹친다 */}
      <div className="relative min-h-0 flex-1">
        {phase === "before" && (
          <NorthPoleScene phase="before" now={now} first={FIRST} showZone={showZone} />
        )}
        {phase === "after" && <NorthPoleScene phase="after" now={now} first={FIRST} />}
        {onJourney && (
          <div className="absolute inset-0 bg-map-sea">
            {route.status === "ready" && readClock && (
              <SantaMap route={route.route} readNow={readClock} home={HOME} />
            )}
            <div className="absolute inset-x-4 top-5">
              <SantaLocationBanner
                now={now}
                route={route.status === "ready" ? route.route : null}
                loadFailed={route.status === "failed"}
              />
            </div>
          </div>
        )}
      </div>

      <BottomSheet aria-label="우리 동네까지 남은 시간" className="relative z-10 -mt-6">
        <CountdownCard
          now={now}
          homeName={HOME.name}
          arriveUtc={HOME.arriveUtc}
          homeChosen={false}
          showZone={showZone}
        />
        {phase !== null && phase !== "before" && (
          <JourneyProgress
            now={now}
            start={FIRST.arriveUtc}
            end={LAST.arriveUtc}
            showZone={showZone}
          />
        )}
      </BottomSheet>
    </main>
  );
}
