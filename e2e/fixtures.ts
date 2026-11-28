import { test as base, expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";

// 장면마다 쓰는 도구: 콘솔 오류 모으기, 화면 밀림(CLS) 재기, axe 접근성 검사, 시각 고정.

const require = createRequire(import.meta.url);
/** axe-core는 Storybook 접근성 패널이 이미 설치한 것을 쓴다(새 의존성 없음) */
const AXE_PATH = require.resolve("axe-core/axe.min.js");

/** 한국 시각(KST)으로 적은 2026년 날짜를 epoch ms로 */
export const kst = (m: number, d: number, h: number, min = 0) =>
  Date.UTC(2026, m - 1, d, h - 9, min);

/**
 * 페이지마다 미리 심는 스크립트:
 * - 화면 밀림 합계. 자동 조작으로 연 페이지는 처음 이동이 "입력 직후"(hadRecentInput)로 표시되므로 그와 상관없이 모두 센다
 * - DOMContentLoaded 때 <html> 속성(React보다 먼저 켜졌는지 보려고)
 */
const INIT = `
  window.__cls = 0;
  window.__attrsAtDcl = {};
  new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__cls += e.value; })
    .observe({ type: "layout-shift", buffered: true });
  document.addEventListener("DOMContentLoaded", () => {
    for (const a of document.documentElement.getAttributeNames()) {
      window.__attrsAtDcl[a] = document.documentElement.getAttribute(a);
    }
  });
`;

type Fixtures = {
  /** 콘솔 오류·경고, 페이지 예외, 우리 서버의 실패 응답. 장면이 끝날 때 비어 있어야 한다 */
  consoleErrors: string[];
};

export const test = base.extend<Fixtures>({
  // auto: 장면이 이 값을 쓰지 않아도 늘 켠다(준비 스크립트와 오류 검사가 모든 장면에 걸리게)
  consoleErrors: [
    async ({ page, baseURL }, use) => {
      const errors: string[] = [];
      // 페이지가 우리 서버에 보낸 요청 중 404·500을 받은 것. 콘솔 메시지("Failed to load resource")보다 어느 주소인지 분명하다.
      // 단, 브라우저가 페이지 밖에서 보내는 favicon 요청은 여기에 오지 않는다(그건 share.spec의 아이콘 검사가 맡는다)
      page.on("response", (r) => {
        if (r.status() >= 400 && baseURL && r.url().startsWith(baseURL))
          errors.push(`${r.status()} ${r.url()}`);
      });
      page.on("console", (m) => {
        // 헤드리스 브라우저의 소프트웨어 그래픽 드라이버가 내는 알림("GL Driver Message … GPU stall")은 앱 오류가 아니다
        if (m.text().startsWith("[.WebGL-")) return;
        if (m.type() === "error" || m.type() === "warning") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(INIT);
      await use(errors);
      expect(errors, "콘솔 오류·경고").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** 지금까지의 화면 밀림 합계 */
export const layoutShift = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cls: number }).__cls);

/** DOMContentLoaded 때(React가 뜨기 전) <html>의 속성 */
export const attrsAtDomReady = (page: Page) =>
  page.evaluate(() => (window as unknown as { __attrsAtDcl: Record<string, string> }).__attrsAtDcl);

/** WCAG 2.2 AA axe 검사. 위반 id 목록(없으면 []) */
export async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: { run: (ctx: Document, opts: object) => Promise<{ violations: { id: string }[] }> };
      }
    ).axe;
    const result = await axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    });
    return result.violations.map((v) => v.id);
  });
}

/**
 * 실제 모드(데모 아님)의 시각을 at(epoch ms)으로 정한다.
 * 기기 시계만 바꾸면 앱이 서버 응답의 Date 헤더와 비교해 진짜 시각으로 되돌리므로(useNow),
 * 서버에 묻는 HEAD 요청에도 같은 가짜 시각을 돌려준다.
 */
export async function fixTime(page: Page, at: number): Promise<void> {
  const realStart = Date.now();
  await page.clock.install({ time: at });
  await page.route("**/*", async (route) => {
    if (route.request().method() !== "HEAD") return route.fallback();
    const fakeNow = at + (Date.now() - realStart);
    await route.fulfill({ status: 200, headers: { date: new Date(fakeNow).toUTCString() } });
  });
}
