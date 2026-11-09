// 화면에서 쓰는 "현재 시각" 계산. 순수 함수만 둔다.
// 기기 시각(realNow)과 서버 응답은 바깥(src/hooks/useNow.ts)에서 받아 넘긴다.

export type ClockConfig =
  | { mode: 'real'; offsetMs: number } // 기기 시각 + 보정값
  | { mode: 'demo'; startAt: number; speed: number; realStartAt: number }; // 데모: startAt부터 배속으로

/** 이보다 작은 차이는 측정 오차(Date 헤더는 초 단위)로 보고 보정하지 않는다 */
export const MIN_OFFSET_MS = 2_000;
/** 왕복이 이보다 길면 측정이 부정확해서 버린다 */
export const MAX_ROUND_TRIP_MS = 5_000;

/**
 * 주소의 검색어로 시계를 정한다.
 * 데모 모드: ?demo=<ISO 시각>&speed=<배속>  예) ?demo=2026-12-25T00:20:00%2B09:00&speed=60
 * 배속은 0보다 큰 유한한 수만 받고, 아니면 1배속이다.
 */
export function parseClockConfig(search: string, realNow: number): ClockConfig {
  const params = new URLSearchParams(search);
  const demo = params.get('demo');
  const startAt = demo === null ? NaN : Date.parse(demo);
  if (!Number.isFinite(startAt)) return { mode: 'real', offsetMs: 0 };

  const speed = Number(params.get('speed') ?? '1');
  return {
    mode: 'demo',
    startAt,
    speed: Number.isFinite(speed) && speed > 0 ? speed : 1,
    realStartAt: realNow,
  };
}

/** 기기 시각 realNow일 때 화면에서 쓸 시각(epoch ms) */
export function clockNow(config: ClockConfig, realNow: number): number {
  if (config.mode === 'real') return realNow + config.offsetMs;
  return config.startAt + (realNow - config.realStartAt) * config.speed;
}

/** 보정값을 적용한다. 데모 모드는 기기 시계와 상관없이 흐르므로 그대로 둔다 */
export function withOffset(config: ClockConfig, offsetMs: number): ClockConfig {
  return config.mode === 'real' ? { mode: 'real', offsetMs } : config;
}

/**
 * 서버 응답 하나로 기기 시계 보정값(ms)을 구한다.
 * 서버 시각은 요청과 응답의 한가운데에 찍혔다고 보고, Date 헤더가 초 단위로 잘린 만큼 0.5초를 더한다.
 * - 차이가 MIN_OFFSET_MS보다 작으면 0 (보정하지 않음)
 * - 측정을 믿을 수 없으면 null (기존 값을 유지)
 */
export function estimateClockOffset(sample: {
  sentAt: number;
  receivedAt: number;
  serverDate: string | null;
}): number | null {
  const roundTrip = sample.receivedAt - sample.sentAt;
  if (roundTrip < 0 || roundTrip > MAX_ROUND_TRIP_MS) return null;
  if (sample.serverDate === null) return null;

  const serverAt = Date.parse(sample.serverDate);
  if (!Number.isFinite(serverAt)) return null;

  const offset = serverAt + 500 - (sample.sentAt + sample.receivedAt) / 2;
  return Math.abs(offset) < MIN_OFFSET_MS ? 0 : offset;
}
