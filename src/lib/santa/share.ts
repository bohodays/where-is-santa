// 공유 카드(순수 함수): 공유 링크, 인사말 다듬기, 카드와 링크 미리보기 글자.
// 공유 링크는 /s/<보낸 사람 동네 id>?m=<인사말>. 미리보기 그림은 보낸 사람 동네의 도착 시각이고,
// 링크를 연 화면은 받는 사람의 동네(그 기기에 저장된 동네) 기준이다(기획서: 공유 시트).
// 인사말은 링크 주소에 담기므로 서버(미리보기 제목)와 메신저가 본다. 그래서 받는 쪽도 같은 규칙으로 다시 다듬는다.

import { formatKstDateTime } from "./format";
import { ROUTE_SUMMARY } from "./route-summary";

/** 인사말 최대 글자 수(사람이 세는 글자, 이모지 하나도 한 글자) */
export const GREETING_MAX = 40;
/** 공유 시트를 열면 미리 적혀 있는 인사말(시안) */
export const DEFAULT_GREETING = "메리 크리스마스! 오늘 밤 산타 보러 와";
/** 공유 링크의 주소 앞부분. 페이지는 src/app/s/[id] */
export const SHARE_PATH = "/s/";
/** 인사말을 담는 주소 이름(?m=) */
export const GREETING_PARAM = "m";

// 사람이 보는 한 글자(자소 묶음) 단위로 센다. 여러 이모지를 이은 가족 이모지도 한 글자다. 모르는 환경은 코드 포인트로 센다
const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("ko", { granularity: "grapheme" })
    : null;

function graphemes(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
}

/** 인사말 글자 수(화면의 "19 / 40자") */
export function greetingLength(text: string): number {
  return graphemes(text).length;
}

/**
 * 인사말을 다듬는다. 주소에서 읽은 값처럼 무엇이 올지 모르는 값도 받는다.
 * - 줄바꿈·탭·보이지 않는 제어 문자(글자 방향 뒤집기 등)는 띄어쓰기로, 띄어쓰기 여러 개는 하나로
 * - 이모지를 잇는 문자(ZWJ)는 남긴다. 앞뒤 띄어쓰기는 지운다
 * - GREETING_MAX 글자에서 자른다(화면은 넘으면 보내기를 막으므로 손으로 주소를 고친 경우만 잘린다)
 */
export function cleanGreeting(raw: unknown): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return "";
  const text = value
    .normalize("NFC")
    .replace(/(?!\u200d)[\p{Cc}\p{Cf}\u2028\u2029]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return graphemes(text).slice(0, GREETING_MAX).join("").trim();
}

/** 공유 링크의 경로(주소 앞 https://… 은 화면이 붙인다). 인사말이 비면 ?m= 없이 */
export function sharePath(homeId: string, greeting: string): string {
  const m = cleanGreeting(greeting);
  const query = m ? `?${GREETING_PARAM}=${encodeURIComponent(m)}` : "";
  return `${SHARE_PATH}${encodeURIComponent(homeId)}${query}`;
}

/** 공유 카드 그림의 글자. 예) "서울 마포구에 산타가 오는 시간" / "12월 24일 밤 12시 20분" */
export function shareCardText(homeName: string, arriveUtc: number) {
  return {
    headline: `${homeName}에 산타가 오는 시간`,
    time: formatKstDateTime(arriveUtc),
  };
}

/** 동네 없이 첫 페이지 주소(/)만 보낼 때의 카드: 산타가 북극을 떠나는 시각 */
export const DEFAULT_SHARE_CARD = {
  headline: "산타가 북극을 떠나는 시간",
  time: formatKstDateTime(ROUTE_SUMMARY.first.arriveUtc),
};

/**
 * 링크 미리보기(메신저가 그림 아래에 보이는 글자).
 * 제목은 인사말, 없으면 카드 제목. 설명은 도착 시각과 "받는 사람 동네 기준"이라는 안내.
 */
export function shareMeta(homeName: string, arriveUtc: number, greeting: string) {
  const { headline, time } = shareCardText(homeName, arriveUtc);
  return {
    title: greeting || headline,
    description: `${homeName}에는 ${time}에 산타가 와요. 링크를 열면 내 동네 기준으로 보여요.`,
    imageAlt: `${headline}: ${time}`,
  };
}
