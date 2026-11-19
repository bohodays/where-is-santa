import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { formatKstTime, formatRemaining, needsKstLabel } from "./format";

const SEC = 1_000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0, s = 0) =>
  Date.UTC(2026, m - 1, d, h - 9, min, s);

describe("formatRemaining: 남은 시간", () => {
  test("하루가 넘으면 일과 시간 (분은 버린다)", () => {
    assert.equal(formatRemaining(37 * DAY + 2 * HOUR + 5 * MIN), "37일 2시간");
    assert.equal(formatRemaining(2 * DAY + 30 * MIN), "2일");
    assert.equal(formatRemaining(1 * DAY), "1일");
  });

  test("하루 안이면 시간과 분", () => {
    assert.equal(
      formatRemaining(23 * HOUR + 59 * MIN + 59 * SEC),
      "23시간 59분",
    );
    assert.equal(formatRemaining(3 * HOUR + 12 * MIN + 30 * SEC), "3시간 12분");
    assert.equal(formatRemaining(1 * HOUR), "1시간");
  });

  test("한 시간 안이면 분만 (초는 버린다)", () => {
    assert.equal(formatRemaining(27 * MIN + 59 * SEC), "27분");
    assert.equal(formatRemaining(1 * MIN), "1분");
  });

  test('1분이 안 남으면 "1분 이내"', () => {
    assert.equal(formatRemaining(59 * SEC), "1분 이내");
    assert.equal(formatRemaining(1), "1분 이내");
  });

  test('0이나 지난 시각이면 "지금"', () => {
    assert.equal(formatRemaining(0), "지금");
    assert.equal(formatRemaining(-5 * MIN), "지금");
  });
});

describe("formatKstTime: 한국 시각", () => {
  test("시간대 이름: 새벽·오전·낮·오후·밤", () => {
    assert.equal(formatKstTime(kst(12, 24, 19, 29, 26)), "밤 7시 29분"); // 첫 출발
    assert.equal(formatKstTime(kst(12, 24, 23, 41)), "밤 11시 41분"); // 도쿄
    assert.equal(formatKstTime(kst(12, 25, 0, 32)), "밤 12시 32분"); // 서울
    assert.equal(formatKstTime(kst(12, 25, 1, 14)), "새벽 1시 14분"); // 베이징
    assert.equal(formatKstTime(kst(12, 24, 7, 44)), "오전 7시 44분"); // 서울 해 뜨는 시각
    assert.equal(formatKstTime(kst(12, 24, 12, 0)), "낮 12시");
    assert.equal(formatKstTime(kst(12, 24, 17, 17)), "오후 5시 17분"); // 서울 해 지는 시각
  });

  test("0분이면 분을 쓰지 않고, 초는 버린다", () => {
    assert.equal(formatKstTime(kst(12, 24, 18, 0)), "밤 6시");
    assert.equal(formatKstTime(kst(12, 24, 19, 29, 59)), "밤 7시 29분");
  });

  test('기준 시각을 주면 "내일"·"어제"를 붙인다', () => {
    const eveEvening = kst(12, 24, 20, 0);
    assert.equal(
      formatKstTime(kst(12, 25, 20, 22), eveEvening),
      "내일 밤 8시 22분",
    ); // 산타 여정 끝
    assert.equal(
      formatKstTime(kst(12, 24, 23, 41), kst(12, 25, 10, 0)),
      "어제 밤 11시 41분",
    );
  });

  test('새벽 5시 전은 전날 밤으로 본다 ("오늘 밤 12시 32분"을 "내일"이라 하지 않는다)', () => {
    const eveEvening = kst(12, 24, 20, 0);
    assert.equal(formatKstTime(kst(12, 25, 0, 32), eveEvening), "밤 12시 32분");
    assert.equal(
      formatKstTime(kst(12, 25, 4, 59), eveEvening),
      "새벽 4시 59분",
    );
    assert.equal(formatKstTime(kst(12, 25, 5, 0), eveEvening), "내일 새벽 5시"); // 5시부터는 다음 날, 이름은 "새벽"
    assert.equal(
      formatKstTime(kst(12, 24, 23, 41), kst(12, 25, 1, 0)),
      "밤 11시 41분",
    );
  });

  test("이틀 이상 떨어지면 날짜를 쓴다 (날짜는 실제 달력 날짜)", () => {
    assert.equal(
      formatKstTime(kst(12, 25, 0, 32), kst(11, 19, 21, 0)),
      "12월 25일 밤 12시 32분",
    );
    assert.equal(
      formatKstTime(kst(12, 24, 19, 29), kst(11, 19, 21, 0)),
      "12월 24일 밤 7시 29분",
    );
  });

  test('showZone이면 맨 앞에 "한국 시각"을 붙인다', () => {
    const zone = { showZone: true };
    assert.equal(formatKstTime(kst(12, 25, 0, 32), undefined, zone), "한국 시각 밤 12시 32분");
    assert.equal(
      formatKstTime(kst(12, 25, 20, 22), kst(12, 24, 20, 0), zone),
      "한국 시각 내일 밤 8시 22분",
    );
    assert.equal(
      formatKstTime(kst(12, 25, 0, 32), kst(11, 19, 21, 0), zone),
      "한국 시각 12월 25일 밤 12시 32분",
    );
  });
});

describe("needsKstLabel: 기기 시계가 한국과 다른가", () => {
  const at = kst(12, 25, 0, 32);

  test("한국, 그리고 시계가 같은 곳(도쿄)은 표시하지 않는다", () => {
    assert.equal(needsKstLabel("Asia/Seoul", at), false);
    assert.equal(needsKstLabel("Asia/Tokyo", at), false);
  });

  test("시계가 다른 곳은 표시한다", () => {
    assert.equal(needsKstLabel("America/New_York", at), true);
    assert.equal(needsKstLabel("Europe/London", at), true);
    assert.equal(needsKstLabel("Asia/Shanghai", at), true); // 1시간 차이
  });

  test("시간대를 모르거나 이름이 잘못되면 헷갈리지 않게 표시한다", () => {
    assert.equal(needsKstLabel(undefined, at), true);
    assert.equal(needsKstLabel("", at), true);
    assert.equal(needsKstLabel("Mars/Olympus_Mons", at), true);
  });
});
