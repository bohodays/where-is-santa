// 경로 검증용 샘플 도시 53곳.
// 좌표는 대략값이고, utcOffset은 12월 기준 현지 표준시(서머타임 반영)다.
// 실제 서비스에서는 GeoNames cities15000에서 생성한다.

export type City = {
  id: string;
  name: string; // 한글 이름
  lat: number;
  lon: number; // 동경 +, 서경 -
  utcOffset: number; // 시간 단위, 12월 기준
};

export const CITIES: City[] = [
  { id: 'kiritimati', name: '키리티마티', lat: 1.87, lon: -157.36, utcOffset: 14 },
  { id: 'apia', name: '아피아', lat: -13.83, lon: -171.76, utcOffset: 13 },
  { id: 'nukualofa', name: '누쿠알로파', lat: -21.14, lon: -175.2, utcOffset: 13 },
  { id: 'suva', name: '수바', lat: -18.14, lon: 178.44, utcOffset: 12 },
  { id: 'auckland', name: '오클랜드', lat: -36.85, lon: 174.76, utcOffset: 13 },
  { id: 'wellington', name: '웰링턴', lat: -41.29, lon: 174.78, utcOffset: 13 },
  { id: 'brisbane', name: '브리즈번', lat: -27.47, lon: 153.03, utcOffset: 10 },
  { id: 'sydney', name: '시드니', lat: -33.87, lon: 151.21, utcOffset: 11 },
  { id: 'melbourne', name: '멜버른', lat: -37.81, lon: 144.96, utcOffset: 11 },
  { id: 'sapporo', name: '삿포로', lat: 43.06, lon: 141.35, utcOffset: 9 },
  { id: 'tokyo', name: '도쿄', lat: 35.68, lon: 139.69, utcOffset: 9 },
  { id: 'osaka', name: '오사카', lat: 34.69, lon: 135.5, utcOffset: 9 },
  { id: 'fukuoka', name: '후쿠오카', lat: 33.59, lon: 130.4, utcOffset: 9 },
  { id: 'busan', name: '부산', lat: 35.18, lon: 129.08, utcOffset: 9 },
  { id: 'daegu', name: '대구', lat: 35.87, lon: 128.6, utcOffset: 9 },
  { id: 'daejeon', name: '대전', lat: 36.35, lon: 127.38, utcOffset: 9 },
  { id: 'seoul', name: '서울', lat: 37.57, lon: 126.98, utcOffset: 9 },
  { id: 'gwangju', name: '광주', lat: 35.16, lon: 126.85, utcOffset: 9 },
  { id: 'incheon', name: '인천', lat: 37.46, lon: 126.71, utcOffset: 9 },
  { id: 'jeju', name: '제주', lat: 33.5, lon: 126.53, utcOffset: 9 },
  { id: 'taipei', name: '타이베이', lat: 25.03, lon: 121.57, utcOffset: 8 },
  { id: 'shanghai', name: '상하이', lat: 31.23, lon: 121.47, utcOffset: 8 },
  { id: 'manila', name: '마닐라', lat: 14.6, lon: 120.98, utcOffset: 8 },
  { id: 'beijing', name: '베이징', lat: 39.9, lon: 116.4, utcOffset: 8 },
  { id: 'hongkong', name: '홍콩', lat: 22.32, lon: 114.17, utcOffset: 8 },
  { id: 'singapore', name: '싱가포르', lat: 1.35, lon: 103.82, utcOffset: 8 },
  { id: 'bangkok', name: '방콕', lat: 13.76, lon: 100.5, utcOffset: 7 },
  { id: 'kathmandu', name: '카트만두', lat: 27.72, lon: 85.32, utcOffset: 5.75 },
  { id: 'delhi', name: '델리', lat: 28.61, lon: 77.21, utcOffset: 5.5 },
  { id: 'kashgar', name: '카슈가르', lat: 39.47, lon: 75.99, utcOffset: 8 },
  { id: 'mumbai', name: '뭄바이', lat: 19.08, lon: 72.88, utcOffset: 5.5 },
  { id: 'dubai', name: '두바이', lat: 25.2, lon: 55.27, utcOffset: 4 },
  { id: 'moscow', name: '모스크바', lat: 55.76, lon: 37.62, utcOffset: 3 },
  { id: 'cairo', name: '카이로', lat: 30.04, lon: 31.24, utcOffset: 2 },
  { id: 'istanbul', name: '이스탄불', lat: 41.01, lon: 28.98, utcOffset: 3 },
  { id: 'johannesburg', name: '요하네스버그', lat: -26.2, lon: 28.05, utcOffset: 2 },
  { id: 'berlin', name: '베를린', lat: 52.52, lon: 13.4, utcOffset: 1 },
  { id: 'paris', name: '파리', lat: 48.86, lon: 2.35, utcOffset: 1 },
  { id: 'london', name: '런던', lat: 51.51, lon: -0.13, utcOffset: 0 },
  { id: 'madrid', name: '마드리드', lat: 40.42, lon: -3.7, utcOffset: 1 },
  { id: 'reykjavik', name: '레이캬비크', lat: 64.15, lon: -21.94, utcOffset: 0 },
  { id: 'saopaulo', name: '상파울루', lat: -23.55, lon: -46.63, utcOffset: -3 },
  { id: 'buenosaires', name: '부에노스아이레스', lat: -34.6, lon: -58.38, utcOffset: -3 },
  { id: 'newyork', name: '뉴욕', lat: 40.71, lon: -74.01, utcOffset: -5 },
  { id: 'toronto', name: '토론토', lat: 43.65, lon: -79.38, utcOffset: -5 },
  { id: 'chicago', name: '시카고', lat: 41.88, lon: -87.63, utcOffset: -6 },
  { id: 'mexicocity', name: '멕시코시티', lat: 19.43, lon: -99.13, utcOffset: -6 },
  { id: 'denver', name: '덴버', lat: 39.74, lon: -104.99, utcOffset: -7 },
  { id: 'losangeles', name: '로스앤젤레스', lat: 34.05, lon: -118.24, utcOffset: -8 },
  { id: 'vancouver', name: '밴쿠버', lat: 49.28, lon: -123.12, utcOffset: -8 },
  { id: 'anchorage', name: '앵커리지', lat: 61.22, lon: -149.9, utcOffset: -9 },
  { id: 'honolulu', name: '호놀룰루', lat: 21.31, lon: -157.86, utcOffset: -10 },
  { id: 'pagopago', name: '파고파고', lat: -14.28, lon: -170.7, utcOffset: -11 },
];
