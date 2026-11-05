# 산타 어디쯤

크리스마스이브에 산타의 현재 위치와 우리 동네 도착까지 남은 시간을 보여주는 웹 서비스.
2026년 12월 24일 공개 예정.

기획, 디자인, 구현, 테스트, 자동화 전 과정을 AI와 함께 진행하고,
AI를 어떻게 통제하고 검증했는지를 [`docs/ai-log.md`](docs/ai-log.md)에 기록한다.
AI 작업 규칙은 [`CLAUDE.md`](CLAUDE.md).

## 산타 위치는 어떻게 정하나

산타는 "막 12월 25일 자정이 된 곳"에 있다. 자정은 시계가 아니라 해 기준으로 본다.

    도착 시각(UTC) = 12월 25일 00:00 UTC − 보정 경도 ÷ 15시간

- 동쪽 도시부터 차례로 도착하므로 산타는 한 방향으로만 움직인다.
- 같은 시간대 안에서도 도쿄 → 오사카 → 부산 → 서울처럼 몇 분씩 차이가 난다.
- 날짜변경선 근처(키리바시, 사모아 등)는 경도를 ±360° 보정한다.
- 현재 위치는 직전 도시와 다음 도시 사이를 대권 경로로 보간한다. (`src/lib/santa/santa.ts`)

## 시작하기

    npm install
    npm run dev          # http://localhost:3000
    npm test             # 경로 로직 테스트
    npm run typecheck
    npm run lint

데모 모드: 아무 날짜에나 이브 밤을 볼 수 있다.

    http://localhost:3000/?demo=2026-12-25T00:20:00%2B09:00&speed=60

경로 확인 화면(설치 없이 Node 22만으로):

    npm run preview:route   # preview/index.html 생성 후 브라우저로 열기

## 진행 상황

- [x] 1주차: 기획서, 경로 계산 로직과 테스트, 저장소·CI 세팅
- [ ] 2주차: 디자인 시안 확정, 디자인 토큰
- [ ] 3~5주차: 지도, 카운트다운, 동네 선택
- [ ] 5주차: 공유 카드, 데모 모드 UI
- [ ] 12월 13일: MVP 배포
- [ ] 12월 24일: 공개

## 데이터 출처

- 도시 좌표(예정): [GeoNames](https://www.geonames.org/) (CC BY 4.0)
- 지도 타일(예정): [OpenFreeMap](https://openfreemap.org) © OpenMapTiles © OpenStreetMap contributors
- 현재 `src/lib/santa/cities.ts`는 검증용 샘플 53곳(좌표 대략값)
