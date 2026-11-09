import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CITIES } from './cities';
import { buildRoute } from './route';
import { santaAt, timeUntil } from './santa';
import {
  MAX_ROUND_TRIP_MS,
  MIN_OFFSET_MS,
  clockNow,
  estimateClockOffset,
  parseClockConfig,
  withOffset,
} from './clock';

const SEC = 1_000;
const MIN = 60_000;
const route = buildRoute(CITIES, 2026);
/** 한국 시각(KST)을 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0, s = 0) => Date.UTC(2026, m - 1, d, h - 9, min, s);

/** 진짜 시각 trueAt에 HEAD 요청을 보냈을 때, 기기 시계가 skew만큼 틀린 폰에서 보이는 값 */
function sample(trueAt: number, skew: number, roundTrip = 200) {
  const serverAt = trueAt + roundTrip / 2; // 서버가 응답을 만든 진짜 시각
  return {
    sentAt: trueAt + skew,
    receivedAt: trueAt + roundTrip + skew,
    serverDate: new Date(serverAt).toUTCString(), // Date 헤더는 초 단위로 잘린다
  };
}

// ---- 데모 주소 해석 ----

test('주소에 demo가 없으면 실제 시각, 보정값 0', () => {
  assert.deepEqual(parseClockConfig('', 1000), { mode: 'real', offsetMs: 0 });
  assert.deepEqual(parseClockConfig('?speed=60', 1000), { mode: 'real', offsetMs: 0 });
});

test('demo 시각과 배속을 읽는다', () => {
  const config = parseClockConfig('?demo=2026-12-25T00:20:00%2B09:00&speed=60', 5000);
  assert.deepEqual(config, { mode: 'demo', startAt: kst(12, 25, 0, 20), speed: 60, realStartAt: 5000 });
});

test('배속이 없거나 0·음수·숫자가 아니면 1배속이다 (음수면 시간이 거꾸로 흐르던 버그)', () => {
  for (const speed of ['', '&speed=0', '&speed=-60', '&speed=abc', '&speed=Infinity']) {
    const config = parseClockConfig(`?demo=2026-12-25T00:20:00%2B09:00${speed}`, 0);
    assert.equal(config.mode === 'demo' && config.speed, 1, `speed 값: "${speed}"`);
  }
});

test('demo 시각을 읽을 수 없으면 실제 시각으로 연다', () => {
  assert.deepEqual(parseClockConfig('?demo=크리스마스&speed=60', 0), { mode: 'real', offsetMs: 0 });
});

// ---- 시각 계산 ----

test('실제 시각 = 기기 시각 + 보정값', () => {
  assert.equal(clockNow({ mode: 'real', offsetMs: 0 }, 1_000_000), 1_000_000);
  assert.equal(clockNow({ mode: 'real', offsetMs: 10 * MIN }, 1_000_000), 1_000_000 + 10 * MIN);
});

test('데모 시각은 시작 시각부터 배속으로 흐른다', () => {
  const config = parseClockConfig('?demo=2026-12-25T00:20:00%2B09:00&speed=60', 5000);
  assert.equal(clockNow(config, 5000), kst(12, 25, 0, 20));
  assert.equal(clockNow(config, 5000 + 10 * SEC), kst(12, 25, 0, 30)); // 10초 × 60배 = 10분
});

test('데모 모드는 기기 시계 보정과 상관없다', () => {
  const config = parseClockConfig('?demo=2026-12-25T00:20:00%2B09:00&speed=60', 5000);
  assert.deepEqual(withOffset(config, 10 * MIN), config);
  assert.deepEqual(withOffset({ mode: 'real', offsetMs: 0 }, 10 * MIN), { mode: 'real', offsetMs: 10 * MIN });
});

// ---- 서버 시각으로 보정값 구하기 ----

test('기기 시계가 맞으면 보정하지 않는다 (Date 헤더의 초 단위 오차는 무시)', () => {
  for (const ms of [0, 1, 499, 500, 999]) {
    const offset = estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + ms, 0));
    assert.equal(offset, 0, `서버 밀리초 ${ms}`);
  }
});

test('기기 시계가 5분 느리면 +5분, 3분 빠르면 -3분 보정한다 (오차 1초 이내)', () => {
  const slow = estimateClockOffset(sample(kst(12, 24, 23, 0, 0), -5 * MIN));
  const fast = estimateClockOffset(sample(kst(12, 24, 23, 0, 0), 3 * MIN));
  assert.ok(slow !== null && Math.abs(slow - 5 * MIN) <= SEC, `느린 폰 보정값 ${slow}`);
  assert.ok(fast !== null && Math.abs(fast + 3 * MIN) <= SEC, `빠른 폰 보정값 ${fast}`);
});

test(`보정 기준 ${MIN_OFFSET_MS / SEC}초: 그보다 작은 차이는 무시하고 넘으면 보정한다`, () => {
  assert.equal(estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + 500, -1 * SEC)), 0);
  const offset = estimateClockOffset(sample(kst(12, 24, 23, 0, 0) + 500, -3 * SEC));
  assert.ok(offset !== null && Math.abs(offset - 3 * SEC) <= SEC, `보정값 ${offset}`);
});

test(`왕복이 ${MAX_ROUND_TRIP_MS / SEC}초를 넘거나 거꾸로면 그 측정은 버린다`, () => {
  assert.equal(estimateClockOffset(sample(kst(12, 24, 23, 0, 0), -5 * MIN, MAX_ROUND_TRIP_MS + 1)), null);
  assert.equal(estimateClockOffset({ sentAt: 2000, receivedAt: 1000, serverDate: new Date(0).toUTCString() }), null);
});

test('Date 헤더가 없거나 읽을 수 없으면 버린다', () => {
  assert.equal(estimateClockOffset({ sentAt: 0, receivedAt: 100, serverDate: null }), null);
  assert.equal(estimateClockOffset({ sentAt: 0, receivedAt: 100, serverDate: '어제' }), null);
});

// ---- 그 시각을 재현: 기기 시계가 틀린 폰의 이브 밤 ----

test('기기 시계가 10분 느린 폰에서도 보정하면 산타 위치와 서울 카운트다운이 맞다', () => {
  const trueNow = kst(12, 24, 23, 40); // 서울 도착 52분 전
  const skew = -10 * MIN;
  const offset = estimateClockOffset(sample(trueNow, skew));
  assert.ok(offset !== null);

  const deviceNow = trueNow + skew;
  const uncorrected = clockNow({ mode: 'real', offsetMs: 0 }, deviceNow);
  const corrected = clockNow({ mode: 'real', offsetMs: offset }, deviceNow);

  // 보정하지 않으면 카운트다운이 10분 늘어난다
  assert.equal(timeUntil('seoul', uncorrected, route) - timeUntil('seoul', trueNow, route), 10 * MIN);
  // 보정하면 진짜 시각과 1초 안으로 맞는다
  assert.ok(Math.abs(timeUntil('seoul', corrected, route) - timeUntil('seoul', trueNow, route)) <= SEC);
  assert.equal(santaAt(corrected, route).next?.id, santaAt(trueNow, route).next?.id);
});
