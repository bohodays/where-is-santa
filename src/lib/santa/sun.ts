// 해가 떠 있는가: 낮/밤 지도를 고를 때 쓴다(결정 2026-11-17: 우리 동네 기준 해 뜬 뒤~해 지기 전은 낮 지도).
// 해 뜨는 시각을 구하는 대신 지금 태양 고도를 직접 계산한다. 날짜 경계가 없고, 극지방(해가 안 뜨거나 안 지는 곳)도 그대로 맞다.
// 식: 미국 해군 천문대(USNO)의 근사식. 2100년까지 태양 위치 오차 약 1분(각도) 수준이라 낮/밤을 가르기에 충분하다.

const DAY_MS = 86_400_000;
/** 1970-01-01 0시 UTC의 율리우스일 */
const JD_UNIX_EPOCH = 2_440_587.5;
/** 2000-01-01 12시 UTC(J2000)의 율리우스일 */
const JD_J2000 = 2_451_545.0;
/**
 * 해가 "떴다"고 보는 고도. 지평선(0도)보다 조금 아래인 이유: 해의 반지름(약 0.27도)과
 * 대기가 빛을 굽혀 해가 실제보다 높게 보이는 정도(약 0.57도). 달력의 해 뜸·해 짐도 이 값을 쓴다
 */
const SUNRISE_ELEVATION = -0.833;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** 시각 now에 위도 lat, 경도 lon에서 본 태양 고도(도). 지평선이 0, 머리 위가 90 */
export function sunElevation(now: number, lat: number, lon: number): number {
  const d = now / DAY_MS + JD_UNIX_EPOCH - JD_J2000; // J2000부터 지난 날 수
  const meanAnomaly = rad(357.529 + 0.98560028 * d);
  const meanLongitude = 280.459 + 0.98564736 * d;
  // 해가 하늘에서 지나는 길(황도) 위의 경도
  const eclipticLon = rad(
    meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly),
  );
  const tilt = rad(23.439 - 0.00000036 * d); // 지구 자전축 기울기
  const declination = Math.asin(Math.sin(tilt) * Math.sin(eclipticLon)); // 해의 적위(남북 위치)
  const rightAscension = Math.atan2(Math.cos(tilt) * Math.sin(eclipticLon), Math.cos(eclipticLon));
  const siderealHours = 18.697374558 + 24.06570982441908 * d; // 그리니치 항성시
  const hourAngle = rad(siderealHours * 15 + lon) - rightAscension; // 해가 남쪽 하늘 한가운데서 얼마나 떨어졌나
  const phi = rad(lat);
  return deg(
    Math.asin(
      Math.sin(phi) * Math.sin(declination) +
        Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle),
    ),
  );
}

/** 해가 떠 있으면 true(해 뜬 뒤 ~ 해 지기 전) */
export function isDaytime(now: number, lat: number, lon: number): boolean {
  return sunElevation(now, lat, lon) > SUNRISE_ELEVATION;
}

/** 설정의 지도 밝기. auto: 우리 동네 해에 맞춤(기본), day: 늘 밝게, night: 늘 어둡게 */
export type MapToneSetting = "auto" | "day" | "night";

/** 지금 쓸 지도 밝기 */
export function mapToneAt(
  now: number,
  home: { lat: number; lon: number },
  setting: MapToneSetting,
): "day" | "night" {
  if (setting !== "auto") return setting;
  return isDaytime(now, home.lat, home.lon) ? "day" : "night";
}
