import type { City } from './cities';

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
