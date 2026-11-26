import { defineConfig, devices } from "@playwright/test";

// E2E: 운영 빌드(next start)를 띄워 휴대폰 크기 Chromium으로 실제 흐름을 확인한다(CLAUDE.md: Playwright, 3주차부터).
// 시각은 데모 주소(?demo=)나 e2e/fixtures.ts의 fixTime으로 정한다. 기기 시계를 바꾸기만 하면 앱이 서버 Date 헤더로 되돌린다.
// 실행: npm run test:e2e (로컬은 빌드부터 한다. CI는 앞 단계에서 빌드한 것을 쓴다)

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // 한 장면이 데모 시계로 20초 넘게 기다리는 경우가 있다
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile-chromium" }],
  webServer: {
    command: process.env.CI
      ? `npx next start -p ${PORT}`
      : `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
