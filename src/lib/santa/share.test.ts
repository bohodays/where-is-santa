import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { NEIGHBORHOODS } from "./neighborhoods";
import {
  cleanGreeting,
  DEFAULT_GREETING,
  DEFAULT_SHARE_CARD,
  GREETING_MAX,
  greetingLength,
  shareCardText,
  shareMeta,
  sharePath,
} from "./share";

/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
const kst = (m: number, d: number, h: number, min = 0) => Date.UTC(2026, m - 1, d, h - 9, min);

describe("greetingLength: 사람이 세는 글자 수", () => {
  test("한글·띄어쓰기·문장부호는 한 글자씩", () => {
    assert.equal(greetingLength(DEFAULT_GREETING), 22); // 시안의 "19 / 40자"는 잘못 센 값
    assert.equal(greetingLength(""), 0);
  });

  test("여러 코드로 된 이모지도 한 글자", () => {
    assert.equal(greetingLength("🎅"), 1);
    assert.equal(greetingLength("👨\u200d👩\u200d👧"), 1); // 가족(ZWJ로 이은 이모지)
    assert.equal(greetingLength("🇰🇷"), 1); // 국기
  });

  test("조합형으로 들어온 한글도 한 글자 (ㅅ+ㅏ+ㄴ)", () => {
    assert.equal(greetingLength("\u1109\u1161\u11ab"), 1);
  });
});

describe("cleanGreeting: 인사말 다듬기", () => {
  test("평범한 인사말은 그대로", () => {
    assert.equal(cleanGreeting(DEFAULT_GREETING), DEFAULT_GREETING);
  });

  test("줄바꿈·탭·여러 띄어쓰기는 띄어쓰기 하나로, 앞뒤는 지운다", () => {
    assert.equal(cleanGreeting("  메리\n\n크리스마스\t!  "), "메리 크리스마스 !");
  });

  test("보이지 않는 제어 문자(글자 방향 뒤집기 등)는 지운다", () => {
    assert.equal(cleanGreeting("산타\u202e와요\u0000"), "산타 와요");
    assert.equal(cleanGreeting("\u200b\u200b"), ""); // 폭 없는 띄어쓰기만
  });

  test("이모지를 잇는 문자(ZWJ)는 남긴다", () => {
    assert.equal(cleanGreeting("우리 가족 👨\u200d👩\u200d👧"), "우리 가족 👨\u200d👩\u200d👧");
  });

  test("40자에서 자르고, 이모지를 반으로 자르지 않는다", () => {
    const long = "가".repeat(GREETING_MAX - 1) + "👨\u200d👩\u200d👧" + "나나나";
    const cleaned = cleanGreeting(long);
    assert.equal(greetingLength(cleaned), GREETING_MAX);
    assert.ok(cleaned.endsWith("👨\u200d👩\u200d👧"));
  });

  test("주소에서 읽은 값: 문자열이 아니면 빈 글자, 여러 개면 첫 번째", () => {
    assert.equal(cleanGreeting(undefined), "");
    assert.equal(cleanGreeting(null), "");
    assert.equal(cleanGreeting(3), "");
    assert.equal(cleanGreeting(["안녕", "또 안녕"]), "안녕");
  });
});

describe("sharePath: 공유 링크", () => {
  test("동네 id와 인사말(주소용으로 바꿈)", () => {
    assert.equal(
      sharePath("kr-11440", "메리 크리스마스!"),
      "/s/kr-11440?m=%EB%A9%94%EB%A6%AC%20%ED%81%AC%EB%A6%AC%EC%8A%A4%EB%A7%88%EC%8A%A4!",
    );
  });

  test("인사말이 비거나 띄어쓰기뿐이면 ?m= 없이", () => {
    assert.equal(sharePath("kr-11440", ""), "/s/kr-11440");
    assert.equal(sharePath("kr-11440", "   "), "/s/kr-11440");
  });

  test("&·?·#이 든 인사말도 주소가 깨지지 않고 그대로 돌아온다", () => {
    const greeting = "산타 & 루돌프? #메리";
    const url = new URL(sharePath("kr-11440", greeting), "https://example.com");
    assert.equal(url.pathname, "/s/kr-11440");
    assert.equal(url.hash, "");
    assert.equal(url.searchParams.get("m"), greeting);
  });

  test("모든 동네 id가 주소에 그대로 들어간다(바꿀 글자가 없다)", () => {
    for (const n of NEIGHBORHOODS) assert.equal(sharePath(n.id, ""), `/s/${n.id}`);
  });
});

describe("shareCardText · shareMeta: 카드와 미리보기 글자", () => {
  // 서울 마포구 도착: 12월 25일 0시 20분쯤(한국 시각) → 전날 밤 날짜로 쓴다
  const at = kst(12, 25, 0, 20);

  test("카드: 동네 이름과 날짜를 붙인 도착 시각", () => {
    assert.deepEqual(shareCardText("서울 마포구", at), {
      headline: "서울 마포구에 산타가 오는 시간",
      time: "12월 24일 밤 12시 20분",
    });
  });

  test("미리보기 제목은 인사말, 없으면 카드 제목", () => {
    assert.equal(
      shareMeta("서울 마포구", at, "오늘 밤 산타 보러 와").title,
      "오늘 밤 산타 보러 와",
    );
    assert.equal(shareMeta("서울 마포구", at, "").title, "서울 마포구에 산타가 오는 시간");
  });

  test("설명: 도착 시각과 받는 사람 동네 기준 안내", () => {
    assert.equal(
      shareMeta("서울 마포구", at, "").description,
      "서울 마포구에는 12월 24일 밤 12시 20분에 산타가 와요. 링크를 열면 내 동네 기준으로 보여요.",
    );
  });
});

describe("DEFAULT_SHARE_CARD: 첫 페이지 카드", () => {
  test("산타가 북극을 떠나는 시각(첫 출발)", () => {
    assert.deepEqual(DEFAULT_SHARE_CARD, {
      headline: "산타가 북극을 떠나는 시간",
      time: "12월 24일 밤 7시 29분",
    });
  });
});
