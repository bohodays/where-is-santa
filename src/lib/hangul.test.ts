import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { matchChosung } from "./hangul";

const hit = (q: string, t: string) => matchChosung(q, t) !== -1;

describe("matchChosung: 한글 초성 검색", () => {
  test("초성만 치면 초성이 같은 글자를 찾는다(시안: ㅁㅍ → 마포구·목포시)", () => {
    assert.equal(hit("ㅁㅍ", "마포구"), true);
    assert.equal(hit("ㅁㅍ", "목포시"), true);
    assert.equal(hit("ㅁㅍ", "마산합포구"), false); // 초성이 이어져야 한다(ㅁ·ㅅ·ㅎ·ㅍ)
    assert.equal(hit("ㅁㅍ", "서초구"), false);
  });

  test("완성된 글자, 섞어 치기, 쌍자음", () => {
    assert.equal(hit("마포", "마포구"), true);
    assert.equal(hit("마ㅍ", "마포구"), true);
    assert.equal(hit("마포", "목포시"), false);
    assert.equal(hit("ㄸ", "땅끝"), true);
    assert.equal(hit("ㄷ", "땅끝"), false); // ㄸ과 ㄷ은 다른 초성
  });

  test("치는 중인 마지막 글자: 받침을 아직 안 쳤거나, 받침이 다음 글자 초성이 될 글자", () => {
    assert.equal(hit("모", "목포시"), true); // 목을 치는 중
    assert.equal(hit("맢", "마포구"), true); // 마포를 치는 중에 보이는 글자
    assert.equal(hit("목", "목포시"), true);
    assert.equal(hit("모", "마포구"), false);
    // 받침 없는 글자 규칙은 마지막 글자에만: "모포"의 "모"는 "목"과 맞지 않는다
    assert.equal(hit("모포", "목포시"), false);
    // 겹받침은 다음 글자 초성이 될 수 없어 그대로 찾는다
    assert.equal(hit("닭", "닭갈비"), true);
  });

  test("띄어쓰기를 무시하고, 맞은 위치(띄어쓰기를 뺀 기준)를 돌려준다", () => {
    assert.equal(matchChosung("마포", "서울 마포구"), 2);
    assert.equal(matchChosung("서울마포", "서울 마포구"), 0);
    assert.equal(matchChosung("ㅈㅇ", "수원시 장안구"), 3);
    assert.equal(matchChosung("ㄱ", "강남구"), 0); // 가장 앞의 위치
  });

  test("NFD(자모로 쪼갠 글자)로 들어와도 찾는다", () => {
    assert.equal(hit("마포".normalize("NFD"), "마포구"), true);
  });

  test("빈 검색어와 공백만 있는 검색어는 찾지 않는다", () => {
    assert.equal(matchChosung("", "마포구"), -1);
    assert.equal(matchChosung("  ", "마포구"), -1);
  });

  test("영문은 대소문자를 가리지 않는다", () => {
    assert.equal(hit("seoul", "Seoul"), true);
  });
});
