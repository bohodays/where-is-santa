// 국내 시군구 데이터(자동 생성 파일) 검사. 데이터를 다시 만들 때 이상한 값이 들어오면 여기서 잡는다.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { SIGUNGU } from './sigungu';
import { buildRoute } from './route';

const KOREA_OFFSET = 9;
const byName = (sido: string, name: string) => {
  const found = SIGUNGU.find((s) => s.sido === sido && s.name === name);
  if (!found) throw new Error(`없음: ${sido} ${name}`);
  return found;
};
/** 2026년 한국 시각(KST)을 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);

test('시군구 256곳: id와 "시도 + 이름"이 겹치지 않는다', () => {
  assert.equal(SIGUNGU.length, 256);
  assert.equal(new Set(SIGUNGU.map((s) => s.id)).size, SIGUNGU.length);
  assert.equal(new Set(SIGUNGU.map((s) => `${s.sido} ${s.name}`)).size, SIGUNGU.length);
});

test('모든 좌표가 한국 안에 있다', () => {
  for (const s of SIGUNGU) {
    assert.ok(s.lat > 33 && s.lat < 38.7 && s.lon > 124.5 && s.lon < 132, `${s.sido} ${s.name}: ${s.lat}, ${s.lon}`);
  }
});

test('일반구는 시 이름과 함께 들어 있다', () => {
  for (const name of ['수원시 장안구', '성남시 분당구', '창원시 진해구', '부천시 원미구']) {
    assert.ok(SIGUNGU.some((s) => s.name === name), name);
  }
});

test('2026년 행정구역 변경이 반영되어 있다 (화성 4개 구, 인천 개편)', () => {
  const incheon = SIGUNGU.filter((s) => s.sido === '인천광역시').map((s) => s.name);
  for (const gone of ['중구', '동구', '서구']) assert.ok(!incheon.includes(gone), `인천 ${gone}이 남아 있음`);
  for (const added of ['제물포구', '영종구', '검단구', '서해구']) assert.ok(incheon.includes(added), `인천 ${added} 없음`);
  assert.equal(incheon.length, 11); // 2군 9구

  const hwaseong = SIGUNGU.filter((s) => s.name.startsWith('화성시')).map((s) => s.name).sort();
  assert.deepEqual(hwaseong, ['화성시 동탄구', '화성시 만세구', '화성시 병점구', '화성시 효행구']);
  assert.equal(byName('대구광역시', '군위군').sido, '대구광역시'); // 2023년 경북에서 편입
});

test('새 구의 대표점이 지리적으로 맞는 쪽에 있다', () => {
  // 영종도는 인천 내륙(제물포구)보다 서쪽, 검단구는 서해구보다 북쪽
  assert.ok(byName('인천광역시', '영종구').lon < byName('인천광역시', '제물포구').lon);
  assert.ok(byName('인천광역시', '검단구').lat > byName('인천광역시', '서해구').lat);
  // 화성은 서쪽 바닷가(만세구)부터 동쪽 동탄구 순서
  const lon = (name: string) => byName('경기도', name).lon;
  assert.ok(lon('화성시 만세구') < lon('화성시 효행구'));
  assert.ok(lon('화성시 효행구') < lon('화성시 병점구'));
  assert.ok(lon('화성시 병점구') < lon('화성시 동탄구'));
});

test('서울 종로구 대표점은 경로 샘플의 서울 좌표와 10km 안이다', () => {
  const jongno = byName('서울특별시', '종로구');
  assert.ok(Math.abs(jongno.lat - 37.57) < 0.1 && Math.abs(jongno.lon - 126.98) < 0.1, `${jongno.lat}, ${jongno.lon}`);
});

test('우리나라 모든 시군구에 12월 25일 0시 16분~0시 42분(한국 시각) 사이에 도착한다', () => {
  const route = buildRoute(
    SIGUNGU.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, utcOffset: KOREA_OFFSET })),
    2026,
  );
  assert.equal(route[0].name, '울릉군'); // 가장 동쪽
  assert.equal(route.at(-1)!.name, '옹진군'); // 가장 서쪽(백령도)
  for (const stop of route) {
    assert.ok(stop.arriveUtc >= kst(12, 25, 0, 16) && stop.arriveUtc < kst(12, 25, 0, 42), `${stop.name}`);
  }
});
