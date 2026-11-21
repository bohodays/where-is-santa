import type { City } from "./cities";

export type Stop = City & {
  effLon: number; // 날짜변경선을 보정한 경도
  arriveUtc: number; // 도착 시각, epoch ms
};

const HOUR = 3_600_000;

/** 12월 25일 00:00 UTC (epoch ms) */
export function christmasUtc(year: number): number {
  return Date.UTC(year, 11, 25);
}

/**
 * 날짜변경선 보정.
 * 경도로는 서쪽(서경)이지만 날짜는 가장 빠른 곳(키리바시, 사모아 등)은
 * 경도에 360을 더해 맨 앞으로, 그 반대는 360을 뺀다.
 * 판단 기준: 시간대가 가리키는 경도(utcOffset × 15)와 실제 경도가 180도 넘게 차이 나는가.
 */
export function effectiveLongitude(lon: number, utcOffset: number): number {
  const diff = utcOffset * 15 - lon;
  if (diff > 180) return lon + 360;
  if (diff < -180) return lon - 360;
  return lon;
}

/**
 * 해 기준 자정 규칙.
 * 도착 시각(UTC) = 12월 25일 00:00 UTC − (보정 경도 ÷ 15)시간
 * 동쪽일수록 먼저 도착하므로 산타는 항상 동에서 서로 한 방향으로 움직인다.
 */
export function arrivalUtc(effLon: number, year: number): number {
  return christmasUtc(year) - (effLon / 15) * HOUR;
}

/**
 * 자정선: 시각 now에 해 기준으로 막 12월 25일 0시가 된 경도(−180~180). arrivalUtc를 거꾸로 푼 식이다.
 * 1시간마다 서쪽으로 15도 움직이고, 어떤 도시든 도착 시각에 자정선이 그 도시의 경도에 닿는다.
 */
export function midnightLongitude(now: number, year: number): number {
  return wrapLongitude(((christmasUtc(year) - now) / HOUR) * 15);
}

/** 경도를 −180~180(180은 −180)으로. 날짜변경선 보정으로 범위를 넘은 경도(키리티마티 202.5도)를 지도 경도로 바꾼다 */
export function wrapLongitude(lon: number): number {
  // 이미 범위 안이면 그대로 둔다. +180 하고 다시 −180 하면 소수 오차가 생긴다(126.98 → 126.98000000000002)
  if (lon >= -180 && lon < 180) return lon;
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function buildRoute(cities: City[], year: number): Stop[] {
  return cities
    .map((c) => {
      const effLon = effectiveLongitude(c.lon, c.utcOffset);
      return { ...c, effLon, arriveUtc: arrivalUtc(effLon, year) };
    })
    .sort((a, b) => a.arriveUtc - b.arriveUtc);
}

/** 도착 순간의 현지 시계 시각(0~24, 소수) — 화면 표시와 검증용 */
export function localClockHour(stop: Stop): number {
  const localMs = stop.arriveUtc + stop.utcOffset * HOUR;
  const d = new Date(localMs);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}
