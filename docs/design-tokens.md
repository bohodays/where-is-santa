# 디자인 토큰

값은 `src/app/globals.css`의 CSS 변수에만 두고, Tailwind(`tailwind.config.ts`)는 그 변수를 가리킨다. 대비는 `src/app/tokens.test.ts`가 검사한다.
기준 시안: Claude 디자인 캔버스 "산타 어디쯤 화면 시안"의 1안(2026-11-17 확정).

## 원칙

- **색은 역할 이름으로 쓴다.** `bg-action`(주 버튼), `text-ink-soft`(보조 글자)처럼 쓰고, 색 이름(`red`)이나 hex를 컴포넌트에 직접 쓰지 않는다.
- **화면은 낮/밤이 같고, 지도만 두 벌이다.** 바텀시트·버튼·글자는 늘 같은 색이고, `--map-*`만 낮/밤으로 바뀐다.
- **모드는 `<html>` 속성으로 켠다.** 컴포넌트는 모드를 몰라도 토큰만 쓰면 따라 바뀐다.

## 모드

| 속성 | 켜지는 때 | 바뀌는 것 |
|---|---|---|
| `data-map-tone="day"` | 지도 밝기 "자동"에서 우리 동네 해 뜬 뒤~해 지기 전(동네가 없으면 서울), 또는 설정 "밝게" | `--map-*` 낮 지도 색 |
| `data-text-size="large"` | 설정 "큰 글씨" | 기준 글자 16px → 18px. rem 단위 글자가 모두 커진다 |
| `data-contrast="high"` | 설정 "고대비" | 보조 글자·테두리·지도 글자를 진하게(본문 7:1 이상) |
| (`prefers-reduced-motion`), `data-motion="reduce"` | 기기의 "동작 줄이기" 또는 설정 "움직임 줄이기". 기기가 줄이기여도 설정에서 끄면 `data-motion="full"`이라 움직인다 | 애니메이션 시간을 0에 가깝게(목록 나타나기는 끈다). 지도 이동은 `isMotionReduced()`가 같은 규칙 |

## 색

| 토큰 | Tailwind | 값 | 쓰는 곳 |
|---|---|---|---|
| `--color-night` | `night` | #0b1830 | 앱 바탕 |
| `--color-surface` | `surface` | #ffffff | 바텀시트, 떠 있는 버튼 |
| `--color-surface-muted` | `surface-muted` | #f3f6fb | 선택된 항목, 출처 상자 |
| `--color-ink` | `ink` | #13213d | 본문, 켜진 스위치 |
| `--color-ink-soft` | `ink-soft` | #4a5875 | 보조 글자 |
| `--color-ink-faint` | `ink-faint` | #5d6a85 | 지나간 도시 |
| `--color-line` | `line` | #e8ecf3 | 구분선, 진행 막대 바탕 |
| `--color-border` | `border` | #c9d1df | 보조 버튼 테두리 |
| `--color-handle` | `handle` | #d5dbe6 | 시트 손잡이 |
| `--color-backdrop` | `backdrop` | rgb(5 10 22 / .55) | 시트 뒤 어둡게 |
| `--color-santa` | `santa` | #d6453b | 산타 표시, 진행 막대. **그래픽 전용** |
| `--color-action` | `action` | #c23a30 | 주 버튼 바탕(흰 글자 5.33:1) |
| `--color-on-action` | `on-action` | #ffffff | 주 버튼 글자 |
| `--color-now` | `now` | #b8352b | "지금" 강조 글자 |
| `--color-gold` | `gold` | #f2c14e | 밤 지도 경로 |
| `--color-highlight` | `highlight` | #fff1cc | 우리 동네 행 바탕 |
| `--color-link` / `--color-link-hover` | `link` / `link-hover` | #2c5fb3 / #1d4384 | 글자 링크 |
| `--color-switch-off` | `switch-off` | #7d889c | 꺼진 스위치(3.58:1) |
| `--color-focus` | `focus` | #2c5fb3 | 키보드 포커스 링 |
| `--color-focus-halo` | `focus-halo` | #ffffff | 포커스 링 안쪽 흰 띠 |

`santa`(#d6453b)는 흰 글자와 4.40:1이라 글자 바탕으로 쓰지 않는다. 버튼은 `action`을 쓴다.

**포커스 표시:** 누르는 요소에는 `focus-ring` 클래스(globals.css)를 붙인다. 키보드로 옮겨 갈 때만 `요소 | 흰 띠 2px | 파란 링 3px`이 나온다. 파란 링만으로는 앱 바탕(night)과 2.86:1이라 모자라서 흰 띠를 함께 둔다. 둘 중 하나가 바탕과 3:1 이상인지 토큰 테스트가 시트·주 버튼·앱 바탕·지도(낮/밤) 위에서 검사한다.

### 북극 마을 그림

출발 전·끝난 뒤 지도 자리에 나오는 `NorthPoleScene`의 색. **늘 밤 그림**이라 `--map-*`(낮/밤으로 바뀐다)을 쓰지 않고 따로 둔다. 낮 지도 모드에서도 그대로인지 토큰 테스트가 검사한다.

| 토큰 | Tailwind | 값 | 쓰는 곳 |
|---|---|---|---|
| `--scene-ice` | `scene-ice` | #13284a | 얼음 땅 |
| `--scene-ring` | `scene-ring` | #2b4675 | 위도 점선 |
| `--scene-snow` | `scene-snow` | #e9eef7 | 눈 언덕 |
| `--scene-house` | `scene-house` | #2c5fb3 | 파란 집 |
| `--scene-text` | `scene-text` | #dbe5f5 | 그림 위 글자 |
| `--scene-text-soft` | `scene-text-soft` | #c9d6ee | 그림 위 보조 글자 |

바탕은 `night`, 남은 시간은 `gold`, 산타와 빨간 집은 `santa`, 지붕은 `surface`.

### 지도

| 토큰 | Tailwind | 밤 | 낮 |
|---|---|---|---|
| `--map-sea` | `map-sea` | #0b1830 | #d9e6e6 |
| `--map-land` | `map-land` | #1a2e52 | #fbf7ee |
| `--map-land-line` | `map-land-line` | #2b4675 | #c9bfa9 |
| `--map-route` | `map-route` | #f2c14e | #c23a30 |
| `--map-label` | `map-label` | #c9d6ee | #34413a |
| `--map-label-strong` | `map-label-strong` | #ffffff | #13213d |
| `--map-text` | `map-text` | #dbe5f5 | #13213d |
| `--map-attribution` | `map-attribution` | #8ea3c7 | #4f5b55 |

MapLibre 스타일은 JS에서 색을 받으므로, 3주차 지도 구현 때 이 변수를 읽어 스타일에 넣는다.

## 글꼴과 글자 크기

- 제목·카운트다운: 주아(`font-display`), 본문: IBM Plex Sans KR(`font-sans`). `next/font`로 빌드 때 받아 우리 도메인에서 내보낸다.
- 크기는 rem이라 큰 글씨 모드에서 함께 커진다.

| 토큰 | Tailwind | 기본 크기 | 쓰는 곳 |
|---|---|---|---|
| `--text-countdown` | `text-countdown` | 48px | 남은 시간 |
| `--text-title` | `text-title` | 20px | 시트 제목 |
| `--text-body-lg` | `text-body-lg` | 16px | 버튼 |
| `--text-body` | `text-body` | 15px | 본문 |
| `--text-caption` | `text-caption` | 13px | 보조 설명 |
| `--text-fine` | `text-fine` | 12px | 출처 상자 |
| `--text-map-label` | `text-map-label` | 12px | 지도 도시 이름 |
| `--text-attribution` | `text-attribution` | 10px | 지도 위 출처 |

## 모서리·크기·그림자

| 토큰 | Tailwind | 값 |
|---|---|---|
| `--radius-sheet` / `card` / `button` / `input` / `pill` | `rounded-sheet` 등 | 24 / 16 / 14 / 12 / 999px |
| `--size-touch` | `h-touch`, `w-touch` | 44px (누르는 곳 최소) |
| `--size-button` | `min-h-button` | 52px (큰 글씨에서 두 줄이 되면 늘어나게 min-h로 쓴다) |
| `--shadow-float` / `--shadow-sheet` | `shadow-float` / `shadow-sheet` | 떠 있는 버튼 / 바텀시트 |

## Storybook

`npm run storybook`(http://localhost:6006)으로 토큰과 컴포넌트를 본다. CI는 `npm run build-storybook`으로 스토리가 깨지지 않았는지 확인한다.

- **모드 툴바:** 위쪽 툴바의 "지도(밤/낮)", "글자(보통/큰 글씨)", "대비(보통/고대비)"는 앱과 같은 `<html>` 속성을 켠다(`.storybook/preview.tsx`). 움직임 줄이기는 기기 설정(`prefers-reduced-motion`)과 앱 설정(`data-motion`)을 따르므로 툴바에 없다.
- **첫 화면:** 큰 글씨·고대비·움직임 줄이기는 `app/layout.tsx`의 짧은 스크립트(`SETTINGS_BOOT_SCRIPT`)가 React보다 먼저 `<html>`에 켠다. 지도 밝기는 시각과 동네가 필요해서 `useMapTone`이 켠다.
- **접근성:** 아래 패널의 Accessibility 탭(axe)에 위반이 없어야 한다.
- **스토리 위치:** 컴포넌트 스토리는 컴포넌트 옆(`src/components/X.stories.tsx`), 토큰처럼 컴포넌트가 아닌 문서는 `src/stories/`.
- **글꼴:** 앱과 같은 `src/app/fonts.ts`를 쓴다.
- **스토리 이름:** export 이름은 영어(`Seoul`), 화면에 보이는 이름은 `name`에 한국어로(`'서울'`).
