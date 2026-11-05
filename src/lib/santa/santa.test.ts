import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CITIES } from './cities';
import { buildRoute, effectiveLongitude, localClockHour } from './route';
import { santaAt, timeUntil, DWELL_MS } from './santa';

const route = buildRoute(CITIES, 2026);
const idx = (id: string) => route.findIndex((s) => s.id === id);
const stop = (id: string) => route[idx(id)];
const MIN = 60_000;
/** 한국 시각(KST)을 epoch ms로 */
const kst = (y: number, m: number, d: number, h: number, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);

test('첫 도착은 키리티마티, 한국 시각 12월 24일 오후 7시대', () => {
  assert.equal(route[0].id, 'kiritimati');
  const t = route[0].arriveUtc;
  assert.ok(t >= kst(2026, 12, 24, 19) && t < kst(2026, 12, 24, 20));
});

test('마지막 도착은 파고파고 (사모아와 이웃이지만 날짜는 하루 늦다)', () => {
  assert.equal(route.at(-1)!.id, 'pagopago');
  assert.ok(idx('apia') < idx('pagopago'));
});

test('서울 도착은 한국 시각 12월 25일 오전 0시 32분 무렵', () => {
  const diff = Math.abs(stop('seoul').arriveUtc - kst(2026, 12, 25, 0, 32));
  assert.ok(diff < MIN, `오차 ${diff / 1000}초`);
});

test('같은 시간대 안에서도 동쪽부터: 도쿄 → 오사카 → 부산 → 서울', () => {
  const order = ['tokyo', 'osaka', 'busan', 'seoul'].map(idx);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(stop('seoul').arriveUtc - stop('tokyo').arriveUtc > 40 * MIN);
});

test('넓은 시간대 문제: 카슈가르는 베이징 시간대지만 델리 다음에 도착한다', () => {
  assert.ok(idx('kashgar') > idx('delhi'));
  assert.ok(idx('kashgar') > idx('beijing'));
});

test('경로는 한 방향: 보정 경도가 계속 서쪽으로만 줄어든다', () => {
  for (let i = 1; i < route.length; i++) {
    assert.ok(route[i].effLon <= route[i - 1].effLon, `${route[i - 1].name} → ${route[i].name}`);
  }
});

test('모든 도시에서 산타는 현지 시계로 밤(오후 9시~새벽 4시)에 온다', () => {
  for (const s of route) {
    const h = localClockHour(s);
    assert.ok(h >= 21 || h < 4, `${s.name} 현지 ${h.toFixed(2)}시`);
  }
});

test('날짜변경선 보정', () => {
  assert.equal(effectiveLongitude(-157.36, 14), -157.36 + 360); // 키리바시
  assert.equal(effectiveLongitude(-170.7, -11), -170.7); // 미국령 사모아
  assert.equal(effectiveLongitude(173.2, -10), 173.2 - 360); // 알류샨 서쪽 가상 사례
  assert.equal(effectiveLongitude(126.98, 9), 126.98);
});

test('출발 전에는 북극에서 대기', () => {
  const s = santaAt(kst(2026, 12, 24, 12), route);
  assert.equal(s.status, 'before');
  assert.equal(s.lat, 90);
  assert.equal(s.next!.id, 'kiritimati');
});

test('서울 도착 10초 뒤에는 서울에서 배달 중', () => {
  const s = santaAt(stop('seoul').arriveUtc + 10_000, route);
  assert.equal(s.status, 'visiting');
  assert.equal(s.prev!.id, 'seoul');
  assert.equal(s.lat, stop('seoul').lat);
});

test('직전 도시를 떠나 서울로 가는 중간에는 두 도시 사이에 있다', () => {
  const before = route[idx('seoul') - 1];
  const mid = (before.arriveUtc + DWELL_MS + stop('seoul').arriveUtc) / 2;
  const s = santaAt(mid, route);
  assert.equal(s.status, 'flying');
  assert.equal(s.next!.id, 'seoul');
  assert.ok(Math.abs(s.progress - 0.5) < 1e-9);
  const [lo, hi] = [Math.min(before.lon, 126.98), Math.max(before.lon, 126.98)];
  assert.ok(s.lon >= lo && s.lon <= hi, `경도 ${s.lon}`);
});

test('지나온 도시 수는 도착 시각이 지난 도시 수와 같다', () => {
  const now = kst(2026, 12, 25, 0, 0);
  const expected = route.filter((r) => r.arriveUtc <= now).length;
  assert.equal(santaAt(now, route).visitedCount, expected);
});

test('모든 도착 후 30초가 지나면 북극으로 돌아간다', () => {
  const s = santaAt(route.at(-1)!.arriveUtc + DWELL_MS + 1, route);
  assert.equal(s.status, 'after');
  assert.equal(s.visitedCount, route.length);
});

test('1분 간격으로 하루를 돌려도 위치가 늘 유효하고 비행 진행률은 0~1', () => {
  for (let t = kst(2026, 12, 24, 18); t < kst(2026, 12, 25, 22); t += MIN) {
    const s = santaAt(t, route);
    assert.ok(Number.isFinite(s.lat) && Number.isFinite(s.lon));
    assert.ok(s.lat >= -90 && s.lat <= 90 && s.lon >= -180 && s.lon <= 180);
    assert.ok(s.progress >= 0 && s.progress <= 1);
  }
});

test('우리 동네 카운트다운: 서울 도착 1시간 42분 전', () => {
  const now = stop('seoul').arriveUtc - (102 * MIN);
  assert.equal(timeUntil('seoul', now, route), 102 * MIN);
  assert.equal(timeUntil('seoul', stop('seoul').arriveUtc + 1, route), 0);
});
