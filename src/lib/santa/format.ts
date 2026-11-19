// 사람에게 보여주는 글자 만들기. 순수 함수만 둔다(지금 시각은 인자로 받는다).
// 시각은 모두 epoch ms(UTC)로 받고, 한국 시각(KST, UTC+9, 서머타임 없음)으로 바꿔 보여준다.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;
/** 새벽 5시 전은 전날 밤으로 본다. "오늘 밤 12시 32분"은 달력으로는 다음 날이다 */
const NIGHT_ENDS_AT = 5 * HOUR;

/**
 * 남은 시간을 짧은 글자로. 단위는 두 개까지만 쓰고, 작은 단위는 버린다(올리지 않는다).
 * 37일 2시간 / 3시간 12분 / 27분 / 1분 이내 / 지금
 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "지금";
  if (ms < MIN) return "1분 이내";

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MIN);

  if (days > 0) return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
  if (hours > 0) return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  return `${minutes}분`;
}

/** 한국 시각의 시(0~23)를 "새벽 1시", "밤 12시"처럼 */
function hourLabel(hour: number): string {
  if (hour === 0) return "밤 12시";
  if (hour <= 5) return `새벽 ${hour}시`;
  if (hour <= 11) return `오전 ${hour}시`;
  if (hour === 12) return "낮 12시";
  if (hour <= 17) return `오후 ${hour - 12}시`;
  return `밤 ${hour - 12}시`;
}

/** 새벽 5시를 하루의 경계로 센 날 번호. "같은 밤"인지 비교할 때 쓴다 */
function nightDay(at: number): number {
  return Math.floor((at + KST_OFFSET - NIGHT_ENDS_AT) / DAY);
}

/**
 * 시각을 한국 시각 글자로. 예) 밤 12시 32분, 새벽 1시 14분, 낮 12시
 * now를 주면 앞에 날짜를 붙인다: 같은 날(새벽 5시 기준)이면 없음, 하루 차이면 "내일"·"어제", 그 밖은 "12월 25일".
 * showZone이 true면 맨 앞에 "한국 시각"을 붙인다(기기 시계가 한국과 다를 때, needsKstLabel 참고).
 */
export function formatKstTime(
  at: number,
  now?: number,
  options: { showZone?: boolean } = {},
): string {
  // getUTC*로 읽어서, 기기의 시간대 설정과 상관없이 늘 한국 시각이 나온다
  const local = new Date(at + KST_OFFSET);
  const minutes = local.getUTCMinutes();
  const time = `${hourLabel(local.getUTCHours())}${minutes > 0 ? ` ${minutes}분` : ""}`;
  const zone = options.showZone ? "한국 시각 " : "";
  if (now === undefined) return `${zone}${time}`;

  const diff = nightDay(at) - nightDay(now);
  if (diff === 0) return `${zone}${time}`;
  if (diff === 1) return `${zone}내일 ${time}`;
  if (diff === -1) return `${zone}어제 ${time}`;
  return `${zone}${local.getUTCMonth() + 1}월 ${local.getUTCDate()}일 ${time}`;
}

const CLOCK_PARTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/**
 * 기기 시계(timeZone)가 그 시각에 한국 시계와 다르면 true. 화면에서 "한국 시각"을 붙일지 정할 때 쓴다.
 * 이름이 아니라 시계 값을 비교하므로, 도쿄처럼 한국과 시계가 같은 곳은 false다.
 * 시간대를 모르거나 잘못된 이름이면 헷갈리지 않게 true(표시를 붙인다).
 * timeZone은 화면에서 Intl.DateTimeFormat().resolvedOptions().timeZone으로 읽어 넘긴다.
 */
export function needsKstLabel(timeZone: string | undefined, at: number): boolean {
  if (!timeZone) return true;
  try {
    const device = new Intl.DateTimeFormat("en-US", { ...CLOCK_PARTS, timeZone }).format(at);
    const korea = new Intl.DateTimeFormat("en-US", {
      ...CLOCK_PARTS,
      timeZone: "Asia/Seoul",
    }).format(at);
    return device !== korea;
  } catch {
    return true; // 알 수 없는 시간대 이름(RangeError)
  }
}
