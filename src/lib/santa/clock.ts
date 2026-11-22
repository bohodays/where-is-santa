// 화면에서 쓰는 "현재 시각" 계산. 순수 함수만 둔다.
// 기기 시각(realNow)과 서버 응답은 바깥(src/hooks/useNow.ts)에서 받아 넘긴다.

export type ClockConfig =
  | { mode: "real"; offsetMs: number } // 기기 시각 + 보정값
  | { mode: "demo"; startAt: number; speed: number; realStartAt: number }; // 데모: startAt부터 배속으로

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
  const demo = params.get("demo");
  const startAt = demo === null ? NaN : Date.parse(demo);
  if (!Number.isFinite(startAt)) return { mode: "real", offsetMs: 0 };

  const speed = Number(params.get("speed") ?? "1");
  return {
    mode: "demo",
    startAt,
    speed: Number.isFinite(speed) && speed > 0 ? speed : 1,
    realStartAt: realNow,
  };
}

/** 기기 시각 realNow일 때 화면에서 쓸 시각(epoch ms) */
export function clockNow(config: ClockConfig, realNow: number): number {
  if (config.mode === "real") return realNow + config.offsetMs;
  return config.startAt + (realNow - config.realStartAt) * config.speed;
}

/** 보정값을 적용한다. 데모 모드는 기기 시계와 상관없이 흐르므로 그대로 둔다 */
export function withOffset(config: ClockConfig, offsetMs: number): ClockConfig {
  return config.mode === "real" ? { mode: "real", offsetMs } : config;
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

// ---- 데모 모드(DemoPanel, DemoBadge) ----

/** 데모 시간 흐름 선택지(배속): 실제 속도, 1초=1분(60배), 1초=10분(600배) */
export const DEMO_SPEEDS = [1, 60, 600] as const;
export type DemoSpeed = (typeof DEMO_SPEEDS)[number];
export const DEFAULT_DEMO_SPEED: DemoSpeed = 60;
/** "이브 밤으로 시간 이동"은 우리 동네 도착 20분 전으로 간다. 1초=1분이면 20초 뒤 산타가 온다(결정 2026-11-22) */
export const DEMO_LEAD_MS = 20 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

/** 우리 동네 도착 시각(homeArriveUtc) DEMO_LEAD_MS 전부터 speed배로 흐르는 데모 시계 */
export function startDemoClock(homeArriveUtc: number, speed: number, realNow: number): ClockConfig {
  return { mode: "demo", startAt: homeArriveUtc - DEMO_LEAD_MS, speed, realStartAt: realNow };
}

/** 데모 중 배속만 바꾼다. 지금 데모 시각에서 이어서 흐른다(앞뒤로 튀지 않는다). 실제 모드는 그대로 */
export function retimeDemoClock(config: ClockConfig, speed: number, realNow: number): ClockConfig {
  if (config.mode === "real") return config;
  return { mode: "demo", startAt: clockNow(config, realNow), speed, realStartAt: realNow };
}

/** 주소에 쓰기 좋은 한국 시각 ISO 글자(초 단위 버림). 예) 2026-12-24T23:46:00+09:00 */
export function toKstIso(ms: number): string {
  const kst = new Date(Math.floor(ms / 1000) * 1000 + 9 * 60 * 60_000);
  return `${kst.toISOString().slice(0, 19)}+09:00`;
}

/**
 * 시계 상태를 주소 검색어로. 데모면 ?demo=<지금 데모 시각>&speed=<배속>, 실제면 둘 다 지운다. 다른 검색어는 그대로 둔다.
 * 새로고침하면 마지막으로 주소에 쓴 데모 시각부터 다시 흐른다. 돌려주는 값은 "?..." 또는 "".
 */
export function demoSearch(search: string, config: ClockConfig, realNow: number): string {
  const params = new URLSearchParams(search);
  if (config.mode === "real") {
    params.delete("demo");
    params.delete("speed");
  } else {
    params.set("demo", toKstIso(clockNow(config, realNow)));
    params.set("speed", String(config.speed));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** 선택지에 없는 배속(주소에 직접 적은 speed=30 등)은 가장 가까운 선택지로 보여준다(배율로 비교) */
export function nearestDemoSpeed(speed: number): DemoSpeed {
  let best: DemoSpeed = DEMO_SPEEDS[0];
  for (const s of DEMO_SPEEDS) {
    if (Math.abs(Math.log(speed / s)) < Math.abs(Math.log(speed / best))) best = s;
  }
  return best;
}

/** 배속을 사람이 읽는 말로. 예) 60 → "1초 = 1분" */
export function demoSpeedLabel(speed: number): string {
  if (speed === 1) return "실제 속도";
  if (speed === 60) return "1초 = 1분";
  if (speed === 600) return "1초 = 10분";
  return `${speed}배 빠르게`;
}

/**
 * 데모(미리 보기)를 권할지. 데모 중이면 늘, 실제 시각이면 출발 하루 전까지와 여정이 끝난 뒤.
 * 진짜 이브(출발 24시간 전~여정 중)에는 권하지 않는다(기획서: "12월 24일이 아닐 때").
 */
export function demoOffered(
  config: ClockConfig,
  now: number,
  departUtc: number,
  endUtc: number,
): boolean {
  if (config.mode === "demo") return true;
  return now < departUtc - DAY_MS || now > endUtc;
}

/**
 * 첫 화면을 그리기 전에 <head>에서 실행할 짧은 스크립트(app/layout.tsx). 주소가 데모면 <html data-demo="on">.
 * 서버는 주소의 검색어를 모르는 정적 페이지라, 맨 위 "데모 모드" 띠(DemoBadge)를 늘 넣어 두고 이 속성이 없으면 숨긴다(globals.css).
 * React가 뜬 뒤 띠가 생기며 화면이 밀리지 않게. 판단은 parseClockConfig와 같게 둔다(clock.test.ts가 실제로 실행해 비교한다).
 */
export const DEMO_BOOT_SCRIPT = `(function(){try{var d=new URLSearchParams(location.search).get("demo");if(d!==null&&isFinite(Date.parse(d)))document.documentElement.setAttribute("data-demo","on")}catch(e){}})();`;
