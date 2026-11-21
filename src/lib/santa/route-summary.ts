// 첫 화면용 경로 요약. 첫 화면(북극 마을, 카운트다운, 여정 막대)은 이 값만 쓴다.
// 전체 경로(stops.ts, 661곳, gzip 약 20 kB)는 출발 직전에 따로 불러온다(src/hooks/useRoute.ts).
// 값은 route-summary.test.ts가 전체 경로와 맞는지 검사한다. 경로 데이터를 다시 만들어(npm run build:route) 값이 달라지면
// 테스트가 실패하면서 새 값을 알려 준다.

import { arrivalUtc, effectiveLongitude } from "./route";

export const ROUTE_YEAR = 2026;

type SummaryStop = { id: string; name: string; lon: number; utcOffset: number };

/** 도착 시각은 좌표로 계산한다(도착 규칙은 route.ts 한 곳). 숫자를 그대로 적어 두지 않는다 */
const withArrival = (s: SummaryStop) => ({
  ...s,
  arriveUtc: arrivalUtc(effectiveLongitude(s.lon, s.utcOffset), ROUTE_YEAR),
});

export const ROUTE_SUMMARY = {
  /** 첫 도착(출발) */
  first: withArrival({ id: "gn-4030939", name: "키리티마티", lon: -157.47502, utcOffset: 14 }),
  /** 마지막 도착 */
  last: withArrival({ id: "gn-5881576", name: "파고파고", lon: -170.7025, utcOffset: -11 }),
  /** 동네를 고르기 전 기본 동네 */
  defaultHome: withArrival({ id: "kr-11020", name: "서울 중구", lon: 126.9959, utcOffset: 9 }),
};
