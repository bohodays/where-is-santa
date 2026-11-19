# 컴포넌트 목록

2주차에 확정한 화면 시안(디자인 캔버스 "산타 어디쯤 화면 시안" 1안)을 3~4주차(핵심 기능 구현)와 5주차(공유 카드·데모 모드)의 구현 단위로 나눈 목록이다.
색·글자 크기는 `docs/design-tokens.md`의 토큰만 쓰고, 컴포넌트마다 같은 PR에서 스토리를 추가한다(CLAUDE.md).

- **서버/클라이언트:** CLAUDE.md대로 서버 컴포넌트가 기본이다. 상태·브라우저 API·시각이 필요할 때만 `'use client'`.
- **시각:** 글자로 보여주는 시각은 `useNow()`, 프레임마다 움직이는 것은 `useClock()`. 산타 위치는 `santaAt()`로만 계산한다.
- **주차:** 기획서 일정 기준. 3~4주차 = 11/23~12/6 핵심 기능 구현(경로 데이터 생성 스크립트, 지도, 카운트다운, 동네 선택), 5주차 = 12/7~13 공유 카드·데모 모드, 12/13 MVP 배포.

## 한눈에 보기

| 구분 | 컴포넌트 | 시안 | 종류 | 주차 |
|---|---|---|---|---|
| 기본 | `Button` · `LinkButton` | 전체 | 서버 | 3~4 |
| 기본 | `IconButton` | 1, 시트 닫기 | 서버 | 3~4 |
| 기본 | `Switch` | 5 | 클라이언트 | 3~4 |
| 기본 | `SegmentedControl` | 3, 5 | 클라이언트 | 3~4 |
| 기본 | `BottomSheet` | 1, 1-2, 2, 4, 5 | 클라이언트 | 3~4 |
| 지도 | `SantaMap` | 1, 1-1 | 클라이언트(동적 import) | 3~4 |
| 지도 | `MapAttribution` | 1, 1-1 | 서버 | 3~4 |
| 메인 | `SantaLocationBanner` | 1, 1-1 | 클라이언트 | 3~4 |
| 메인 | `CountdownCard` | 1, 1-1 | 클라이언트 | 3~4 |
| 메인 | `JourneyProgress` | 1, 1-1 | 클라이언트 | 3~4 |
| 메인 | `NorthPoleScene` | 3 | 서버(그림만) | 3~4 |
| 시트 | `ArrivalList` | 1-2 | 클라이언트 | 3~4 |
| 시트 | `NeighborhoodPicker` | 4 | 클라이언트 | 3~4 |
| 시트 | `SettingsPanel` | 5 | 클라이언트 | 3~4 |
| 시트 | `AttributionBox` | 5 | 서버 | 3~4 |
| 공유 | `SharePanel` | 2 | 클라이언트 | 5 |
| 데모 | `DemoPanel` · `DemoBadge` | 3 | 클라이언트 | 5 |

지금 있는 `SantaStatus`는 1주차 임시 화면이다. `SantaLocationBanner` + `CountdownCard`로 나누어 대체하고 지운다(px 고정 글자와 "890시간 43분" 표기 문제는 이때 고친다).

## 기본 요소

### Button · LinkButton
- **역할:** 주 버튼(`친구에게 알려주기`)과 보조 버튼(`산타 따라가기`). 다른 시트로 가는 것은 `LinkButton`(`<a href>`), 동작은 `Button`(`<button>`).
- **변형:** `primary`(bg-action, text-on-action) · `secondary`(테두리 border, bg-surface) · `quiet`(글자 링크 모양, 예: "동네 바꾸기", "도착 순서 보기").
- **상태:** 기본, 누름, 포커스, 사용 불가, 진행 중(복사 중 등).
- **토큰:** `h-button`, `rounded-button`, `text-body-lg`, `action`, `on-action`, `border`, `link`.
- **접근성:** 높이 52px(quiet는 최소 44px), 포커스 링이 보여야 한다. 아이콘이 있으면 `aria-hidden`.
- **스토리:** 변형 3개 × 상태.

### IconButton
- **역할:** 아이콘만 있는 버튼. 설정(톱니바퀴), 시트 닫기(X).
- **토큰:** `h-touch`, `w-touch`, `rounded-pill`, `shadow-float`(지도 위), `ink`.
- **접근성:** `aria-label` 필수(CLAUDE.md). 44×44px.
- **스토리:** 설정, 닫기, 지도 위/시트 안.

### Switch
- **역할:** 설정의 켜기/끄기(큰 글씨, 고대비, 움직임 줄이기, 소리).
- **상태:** 켜짐(ink), 꺼짐(switch-off), 포커스, 설명 문구 있음("기기 설정을 따라 켜져 있어요").
- **접근성:** `<button role="switch" aria-checked>`, 이름은 옆 글자로 `aria-labelledby`. 꺼짐 색은 흰 바탕과 3:1 이상(토큰 테스트가 검사).
- **스토리:** 켜짐, 꺼짐, 설명 있음, 고대비 모드.

### SegmentedControl
- **역할:** 하나만 고르는 짧은 선택지. 지도 밝기(자동·밝게·어둡게), 데모 시간 흐름(실제 속도·1초=1분·1초=10분).
- **상태:** 선택됨(bg-ink, 흰 글자), 선택 안 됨, 포커스.
- **접근성:** 라디오 그룹(`role="radiogroup"` + `role="radio"` + `aria-checked`, 화살표 키로 이동). 각 칸 높이 46px 이상.
- **스토리:** 지도 밝기, 데모 속도.

### BottomSheet
- **역할:** 아래에서 올라오는 판. 두 가지 쓰임:
  - **고정형:** 메인의 카운트다운 카드. 닫기 없음, 지도 위에 늘 떠 있음.
  - **모달형:** 도착 순서, 동네 고르기, 설정, 공유, 데모. 뒤를 `backdrop`으로 어둡게, 제목과 닫기 버튼.
- **상태:** 열림, 닫힘, 여는 중(애니메이션), 내용이 길어 스크롤.
- **토큰:** `bg-surface`, `rounded-sheet`(위쪽만), `handle`, `backdrop`, `shadow-sheet`.
- **접근성:** 모달형은 `role="dialog"` + `aria-modal` + 제목 연결, 열리면 시트 안으로 포커스, Esc와 닫기로 닫고 연 버튼으로 포커스를 돌려준다. 움직임 줄이기면 애니메이션 없이 바로 열린다.
- **로직:** 어떤 시트가 열렸는지는 주소 해시나 상태로 둔다(뒤로 가기로 닫히게 할지는 구현 때 정한다).
- **스토리:** 고정형, 모달형(짧은 내용/긴 내용).

## 지도

### SantaMap
- **역할:** 세계 지도, 지나온 경로(실선)·남은 경로(점선), 산타 표시, 우리 동네 표시.
- **상태:**
  - 불러오는 중(지도 자리만, 글자는 이미 보임)
  - 타일 지도(밤/낮)
  - 윤곽 지도(OpenFreeMap 실패·응답 없음 10초, `docs/spike-map-fallback.md`)
  - 지도 없음(지도 JS 실패, 글자만: "지도를 불러오지 못했어요. 산타 소식은 위에서 계속 볼 수 있어요.")
  - 산타 따라가기 켬/끔
  - 출발 전·끝난 뒤에는 **지도를 불러오지 않는다.** 그 자리에 `NorthPoleScene`을 보여준다(아래, 결정 2026-11-17). 데모 모드는 시각을 이브 밤으로 옮기므로 늘 지도가 보인다
- **토큰:** `--map-*`(MapLibre 스타일에 CSS 변수 값을 읽어 넣는다), `santa`, `gold`/`map-route`.
- **접근성:** 지도 캔버스는 화면 낭독기에 숨기고, 위치는 `SantaLocationBanner`의 `aria-live` 문장으로 알린다(CLAUDE.md). 지도 조작 버튼이 있으면 모두 44px.
- **로직:** `santaAt`, `useClock`(프레임 보간), `maplibre-gl` 동적 import(첫 화면 번들에 넣지 않는다), `setWorkerUrl`, 지도 밝기(`useMapTone`).
- **스토리:** 밤/낮 타일, 윤곽 지도, 지도 없음, 데모 시각 고정(`?demo=` 대신 시계를 고정하는 decorator).
- **확인:** 4주차 끝(12/6)까지 실제 저사양 폰으로 FPS 측정(1주차에 남긴 일, 12/14 베타 전).

### MapAttribution
- **역할:** 지도 위 짧은 출처. 타일 지도는 "© OpenFreeMap © OpenMapTiles © OpenStreetMap", 윤곽 지도는 "Made with Natural Earth".
- **토큰:** `text-attribution`, `map-attribution`.
- **접근성:** 링크로 두면 44px 확보가 어려우므로 글자만 두고, 링크는 설정의 `AttributionBox`에 둔다.

## 메인

### SantaLocationBanner
- **역할:** 지도 위 "지금 산타는 ○○ 상공" 한 줄과 "다음 도착: 부산, 19분 뒤".
- **상태:** 출발 전("산타는 북극에서 출발 준비 중"), 도시 방문 중, 비행 중, 끝난 뒤("산타는 북극으로 돌아갔어요").
- **토큰:** 알약 `bg-surface` `shadow-float` `text-body`, 아래 줄 `map-text` `text-caption`.
- **접근성:** `aria-live="polite"`. 비행 중에는 문장이 자주 바뀌지 않게 **도시가 바뀔 때만** 갱신한다(1초마다 읽히면 화면 낭독기가 시끄럽다).
- **로직:** `santaAt`, `useNow`, 위치 문장 만들기(순수 함수, 아래 "로직" 참고).
- **스토리:** 상태 4개 × 밤/낮 지도.

### CountdownCard
- **역할:** 고정형 시트의 내용. "서울 마포구까지" + "동네 바꾸기", 남은 시간, 도착 예정 시각.
- **상태:**
  - 불러오는 중(서버 렌더, 시각 없음)
  - 동네 안 고름(서울 기준으로 보여주고 "동네 고르기"를 강조)
  - 출발 전, 하루 넘게 남음("37일 2시간")
  - 하루 안("3시간 12분")
  - 1시간 안("27분"), 1분 안("1분 이내")
  - 도착("산타가 우리 동네에 왔어요"), 지나감("산타가 다녀갔어요")
- **토큰:** `text-countdown` `font-display`, `text-body`, `ink`, `ink-soft`.
- **접근성:** 남은 시간은 1초마다 읽지 않는다(`aria-live` 없음). 도착 순간만 `SantaLocationBanner`에서 알린다.
- **로직:** `timeUntil`, 남은 시간·도착 시각 표기(순수 함수), `useHome`.
- **스토리:** 상태별, 큰 글씨(줄바꿈 확인), 고대비.

### NorthPoleScene (북극 마을)
- **결정 (2026-11-17):** 메르카토르 지도는 북극(위도 약 85도 위)을 그리지 못한다. 산타가 북극에 있는 동안은 지도 대신 북극 마을 그림을 보여준다. 다른 안이던 "지도 위쪽 끝에 표시"는 산타가 잘 안 보이고, "지구본 지도"는 디자인 전체가 바뀌고 성능 위험이 커서 MVP 뒤 검토 거리로 남겼다.
- **역할:** 지도 자리를 채우는 북극 마을 그림과 한 줄 안내. 시안 "3. 시즌 전 — 데모 모드"의 그림을 쓴다.
- **상태:**
  - 출발 전: "북극 마을 · 선물 포장 중", 출발까지 남은 시간("12월 24일 밤 7시 29분, 키리티마티에서 출발해요"), "이브 밤으로 미리 보기"(데모)
  - 끝난 뒤: "산타가 북극으로 돌아갔어요", "다시 보기"(데모)
- **바뀌는 순간:** 첫 도착 시각에 지도로 바뀐다. 이때 지도 JS를 처음 불러오므로, 출발 몇 분 전부터 미리 불러 둔다. 움직임 줄이기가 켜져 있으면 전환 애니메이션 없이 바꾼다.
- **아래 카드는 그대로:** 출발 전에도 `CountdownCard`(우리 동네까지 남은 시간), 도착 순서(예정 목록), 동네 고르기, 설정, 공유는 모두 동작한다.
- **토큰:** `night`, `gold`(별), `santa`, `text-body`, `map-text`.
- **접근성:** 그림은 `role="img"` + 설명("북극 마을에서 출발을 준비하는 산타"), 남은 시간은 글자로 따로 보여준다.
- **성능:** 출발 전 방문(공개 전 방문 대부분)은 지도 JS를 받지 않으므로 첫 화면이 가장 가볍다.
- **스토리:** 출발 전, 끝난 뒤, 큰 글씨.

### JourneyProgress
- **역할:** "산타의 여정 18%" 막대, 출발·끝 시각, "도착 순서 보기".
- **토큰:** `line`(바탕), `santa`(채움), `text-caption`.
- **접근성:** `role="progressbar"` + `aria-valuenow`/`aria-valuetext`("전체 여정의 18%"). 막대 색은 바탕과 3:1 이상(토큰 테스트가 검사).
- **로직:** 진행률 = (지금 − 첫 도착) ÷ (마지막 도착 − 첫 도착).

## 시트 내용

### ArrivalList (도착 순서)
- **역할:** 지나간 도시, 지금 위치, 다음 도시를 한국 시각으로. 우리 동네 행 강조. "다음 도시 더 보기".
- **행 상태:** 지나감(`ink-faint`), 지금(`now` + 산타 점), 곧 도착("19분 뒤"), 우리 동네(`highlight` 바탕).
- **출발 전:** 지나간 도시가 없으므로 첫 도착(키리티마티)부터 **예정 목록**으로 보여주고, 제목 아래에 "12월 24일 밤 7시 29분 출발 예정"을 쓴다.
- **접근성:** `<ol>`. 우리 동네 행은 글자로도 "우리 동네"라고 쓴다(색만으로 구분하지 않는다). 시트가 열리면 지금 행이 보이게 스크롤.
- **로직:** 경로에서 지금 앞뒤 N개 고르기(순수 함수), 한국 시각 표기("밤 12시 32분", "새벽 1시 14분").
- **스토리:** 출발 직후, 한국 근처(시안과 같은 장면), 우리 동네 지난 뒤.

### NeighborhoodPicker (동네 고르기)
- **역할:** 시·군·구 검색(초성 지원), 결과마다 도착 시각, 지금 고른 동네 표시, "내 위치로 찾기", 저장 안내.
- **상태:** 빈 검색어(지금 동네만), 결과 있음, 결과 없음("찾는 동네가 없어요"), 위치 찾는 중, 위치 권한 거부, 위치를 못 찾음.
- **토큰:** 입력창 `rounded-input` `border-link`(포커스), 결과 `surface-muted`(선택됨), `ink-soft`.
- **접근성:** `<label>` 있는 `<input type="search">`, 결과 개수를 `aria-live`로 알림("찾은 동네 2곳"), 결과는 버튼(`aria-pressed`), 56px 이상.
- **로직:** 초성 검색(순수 함수), 가장 가까운 시군구(순수 함수), `SIGUNGU` 데이터, `useHome`(localStorage, 서버로 보내지 않는다).
- **스토리:** 상태별, "ㅁㅍ" 검색(마포구·목포시), 큰 글씨.

### SettingsPanel
- **역할:** 지도 밝기, 큰 글씨, 고대비, 움직임 줄이기, 소리, 출처.
- **상태:** 기본값, 각 설정 켬. 움직임 줄이기는 기기 설정(`prefers-reduced-motion`)이 켜져 있으면 기본으로 켜짐.
- **로직:** `useSettings`(localStorage). 설정은 `<html>` 속성(`data-map-tone`, `data-text-size`, `data-contrast`)으로 바로 반영한다(`docs/design-tokens.md`).
- **스토리:** 기본, 모두 켬.

### AttributionBox
- **역할:** 지도·데이터 출처 상자. OpenFreeMap, OpenMapTiles, OpenStreetMap 기여자, GeoNames, 국가데이터처 SGIS, Natural Earth.
- **토큰:** `surface-muted`, `text-fine`, `link`.
- **접근성:** 링크 글자 대비 4.5:1 이상(토큰 테스트가 검사). 줄 사이 간격을 넉넉히 둬 링크끼리 붙지 않게 한다.

## 공유·데모 (5주차)

### SharePanel
- **역할:** 공유 카드 미리보기, 인사말 입력(40자), "링크 복사", "메신저로 보내기".
- **상태:** 기본, 인사말 입력 중(글자 수), 40자 초과, 복사됨("복사했어요"), 복사 실패, 공유 기능 없는 브라우저(메신저 버튼 숨김).
- **접근성:** `<label>`이 있는 `<textarea>`, 글자 수는 `aria-describedby`, 복사 결과는 `aria-live`.
- **로직:** 공유 링크 만들기(받는 사람 동네 기준으로 열림), OG 이미지 라우트, Web Share API.

### DemoPanel · DemoBadge
- **역할:** 시즌 전 화면. 출발까지 남은 시간, 시간 흐름 선택(`SegmentedControl`), "이브 밤으로 시간 이동". 데모 중에는 메인 위에 `DemoBadge`("데모 모드").
- **로직:** `parseClockConfig`(이미 있음, `src/lib/santa/clock.ts`), 데모 주소 만들기.
- **접근성:** 데모 모드 표시는 글자로(색만으로 구분하지 않는다).

## 화면 밖 로직 (컴포넌트가 쓰는 것)

| 이름 | 위치 | 내용 | 주차 |
|---|---|---|---|
| `formatRemaining` | `src/lib/santa/` | 남은 시간 표기("37일 2시간", "27분", "1분 이내") | 3~4 |
| `formatKstTime` | `src/lib/santa/` | 한국 시각 표기("밤 12시 32분", "새벽 1시 14분") | 3~4 |
| `describeSanta` | `src/lib/santa/` | 위치 문장("○○ 상공", "A에서 B로 가는 중"). 두 도시가 300km 이하면 "상공", 멀면 "가는 중" | 3~4 |
| `nearbyStops` | `src/lib/santa/` | 도착 순서 목록에 보일 앞뒤 도시 | 3~4 |
| `journeyProgress` | `src/lib/santa/` | 전체 여정 진행률 | 3~4 |
| `sunTimes` | `src/lib/santa/` | 위도·경도·날짜로 해 뜨고 지는 시각(낮/밤 지도) | 3~4 |
| `matchChosung` | `src/lib/` (새 폴더 또는 santa 옆) | 초성 검색 | 3~4 |
| `nearestSigungu` | `src/lib/santa/` | 위치에서 가장 가까운 시군구 | 3~4 |
| `useHome` | `src/hooks/` | 고른 동네(localStorage) | 3~4 |
| `useSettings` | `src/hooks/` | 설정(localStorage) + `<html>` 속성 반영 | 3~4 |
| `useMapTone` | `src/hooks/` | 설정 "자동"이면 `sunTimes`로 낮/밤 결정 | 3~4 |

`src/lib/`는 순수 함수만(CLAUDE.md) — 시각은 인자로 받는다. 위 함수마다 테스트를 같은 커밋에 넣는다.

## 3~4주차 만드는 순서 (11/23~12/6, 제안)

1. **로직과 기본 요소:** `formatRemaining`·`formatKstTime`·`describeSanta`·`journeyProgress` + `Button`·`IconButton`·`BottomSheet`
2. **메인 글자 화면:** `SantaLocationBanner`·`CountdownCard`·`JourneyProgress`로 `SantaStatus` 대체, 지도 자리에 `NorthPoleScene`. 지도 없이도 완성된 첫 화면(LCP 목표의 핵심). 공개 전 방문은 이 화면을 본다
3. **경로 데이터 생성 스크립트:** 샘플 53곳 → GeoNames + 시군구 데이터(기획서 핵심 기능 구현 항목)
4. **지도:** `SantaMap`·`MapAttribution`, 낮/밤(`sunTimes`·`useMapTone`), 장애 대응
5. **시트:** `ArrivalList`, `NeighborhoodPicker`(`matchChosung`·`nearestSigungu`·`useHome`), `SettingsPanel`·`AttributionBox`(`useSettings`)
6. **E2E:** Playwright로 시계를 고정해 이브 밤 흐름 확인(CLAUDE.md: 3주차부터)
