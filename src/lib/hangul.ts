// 한글 검색(순수 함수). 동네 고르기에서 "ㅁㅍ"로 마포구·목포시를 찾는다.
// 한글 음절(가~힣)은 유니코드에서 (초성 × 21 + 중성) × 28 + 종성 순서로 놓여 있어 계산으로 나눌 수 있다.

const SYLLABLE_START = 0xac00; // 가
const SYLLABLE_END = 0xd7a3; // 힣
const MEDIALS = 21;
const FINALS = 28;

/** 초성 19개(호환용 자모). 키보드로 "ㅁ"을 치면 이 글자가 들어온다 */
const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
/** 종성 28개(0은 받침 없음). 겹받침(ㄳ 등)은 다음 글자 초성이 될 수 없어 빈 문자열로 둔다 */
const FINALS_AS_INITIAL = [
  "",
  "ㄱ",
  "ㄲ",
  "",
  "ㄴ",
  "",
  "",
  "ㄷ",
  "ㄹ",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "ㅁ",
  "ㅂ",
  "",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

type Syllable = { initial: number; medial: number; final: number };

function splitSyllable(ch: string): Syllable | null {
  const code = ch.codePointAt(0) ?? 0;
  if (code < SYLLABLE_START || code > SYLLABLE_END) return null;
  const n = code - SYLLABLE_START;
  return {
    initial: Math.floor(n / (MEDIALS * FINALS)),
    medial: Math.floor(n / FINALS) % MEDIALS,
    final: n % FINALS,
  };
}

/** 검색어 한 글자가 대상 한 글자와 맞는가 */
function charMatches(q: string, t: string, isLast: boolean): boolean {
  if (q === t) return true;
  const initial = INITIALS.indexOf(q);
  const ts = splitSyllable(t);
  // 초성만 쳤다: "ㅁ"은 "마"·"목"과 맞는다
  if (initial >= 0) return ts !== null && ts.initial === initial;
  // 마지막 글자는 아직 치는 중일 수 있다: "모"는 "목"의 앞부분이다(받침을 아직 안 쳤다)
  const qs = splitSyllable(q);
  if (isLast && qs && ts && qs.final === 0) {
    return qs.initial === ts.initial && qs.medial === ts.medial;
  }
  return false;
}

/**
 * 받침이 다음 글자의 초성일 수도 있다. 휴대폰에서 "마포"를 치는 중에는 "맢"이 먼저 보인다.
 * 마지막 글자가 받침 있는 음절이면 [받침 뺀 음절, 받침을 초성으로] 두 글자로 바꾼 검색어도 함께 본다.
 */
function alternatives(query: string[]): string[][] {
  const last = query.at(-1);
  const s = last === undefined ? null : splitSyllable(last);
  if (!s || s.final === 0) return [query];
  const asInitial = FINALS_AS_INITIAL[s.final];
  if (!asInitial) return [query];
  const open = String.fromCodePoint(SYLLABLE_START + (s.initial * MEDIALS + s.medial) * FINALS);
  return [query, [...query.slice(0, -1), open, asInitial]];
}

/** 띄어쓰기를 빼고 NFC로 맞춘다. 맥·아이폰은 한글을 자모로 쪼개(NFD) 보낼 때가 있다 */
function normalize(text: string): string[] {
  return [...text.normalize("NFC").replace(/\s+/g, "").toLowerCase()];
}

/**
 * 검색어가 대상 글자 안 어디에 맞는지(띄어쓰기를 뺀 위치). 안 맞으면 -1.
 * - 완성된 글자는 그대로: "마포" → 마포구
 * - 초성만: "ㅁㅍ" → 마포구, 목포시
 * - 섞어도 된다: "마ㅍ" → 마포구
 * - 치는 중인 마지막 글자: "목" → 목포시, "맢" → 마포구
 */
export function matchChosung(query: string, target: string): number {
  const q = normalize(query);
  if (q.length === 0) return -1;
  const t = normalize(target);
  let best = -1;
  for (const alt of alternatives(q)) {
    for (let start = 0; start + alt.length <= t.length; start++) {
      if (best !== -1 && start >= best) break;
      if (alt.every((ch, i) => charMatches(ch, t[start + i], i === alt.length - 1))) {
        best = start;
        break;
      }
    }
  }
  return best;
}
