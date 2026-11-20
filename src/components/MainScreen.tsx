"use client";

import { useNow } from "@/hooks/useNow";
import { CITIES } from "@/lib/santa/cities";
import { needsKstLabel } from "@/lib/santa/format";
import { buildRoute } from "@/lib/santa/route";
import { santaAt } from "@/lib/santa/santa";
import { BottomSheet } from "./BottomSheet";
import { CountdownCard } from "./CountdownCard";
import { JourneyProgress } from "./JourneyProgress";
import { NorthPoleScene } from "./NorthPoleScene";
import { SantaLocationBanner } from "./SantaLocationBanner";

// 메인 화면(컨테이너). 현재 시각을 읽는 곳은 여기 한 곳이다(useNow). 아래 조각들은 now를 받아 보여주기만 한다.
// 위: 출발 전·끝난 뒤는 북극 마을 그림, 여정 중에는 지도 자리(지도는 3~4주차 순서 4번에서 붙인다) + 위치 알약.
// 아래: 고정형 시트에 우리 동네 카운트다운과 여정 막대.
// 데모: 주소에 ?demo=2026-12-25T00:20:00%2B09:00&speed=60 을 붙이면 그 시각부터 흐른다(useNow).

// 지금은 샘플 경로(53곳). 경로 데이터 생성 스크립트(순서 3번)가 생기면 바꾼다.
const ROUTE = buildRoute(CITIES, 2026);
// 동네 고르기(순서 5번) 전까지는 서울 기준
const HOME = ROUTE.find((stop) => stop.id === "seoul") ?? ROUTE[0];

export function MainScreen() {
  const now = useNow();
  const status = now === null ? null : santaAt(now, ROUTE).status;
  const onJourney = status === "visiting" || status === "flying";
  // 기기 시계가 한국과 다르면 시각 앞에 "한국 시각"을 붙인다. 브라우저의 시간대 설정을 읽으므로 시각을 안 뒤에만 계산한다
  const showZone =
    now !== null && needsKstLabel(Intl.DateTimeFormat().resolvedOptions().timeZone, now);

  return (
    // 100dvh: 휴대폰 주소창이 접혔다 펴져도 화면 높이에 맞는다. 모르는 브라우저는 100vh(h-screen)
    <main className="mx-auto flex h-screen max-w-md flex-col bg-night supports-[height:100dvh]:h-dvh">
      <h1 className="sr-only">산타 어디쯤</h1>

      {/* 위쪽: 시트 둥근 모서리 뒤로 지도·그림이 이어져 보이게 시트를 살짝(-mt-6) 겹친다 */}
      <div className="relative min-h-0 flex-1">
        {status === "before" && (
          <NorthPoleScene phase="before" now={now} route={ROUTE} showZone={showZone} />
        )}
        {status === "after" && <NorthPoleScene phase="after" now={now} route={ROUTE} />}
        {onJourney && (
          <div className="absolute inset-0 bg-map-sea">
            <div className="absolute inset-x-4 top-5">
              <SantaLocationBanner now={now} route={ROUTE} />
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
        {status !== null && status !== "before" && (
          <JourneyProgress now={now} route={ROUTE} showZone={showZone} />
        )}
      </BottomSheet>
    </main>
  );
}
