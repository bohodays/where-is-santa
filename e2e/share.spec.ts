import { serializeHome } from "../src/lib/santa/home";
import { NEIGHBORHOODS } from "../src/lib/santa/neighborhoods";
import { axeViolations, expect, fixTime, kst, test } from "./fixtures";
import type { Page } from "@playwright/test";

// 공유 카드: 보내는 사람(공유 시트, 링크 복사)과 받는 사람(링크 미리보기 <meta>, 인사말 시트, 내 동네 기준)

const byLabel = (label: string) => NEIGHBORHOODS.find((n) => n.label === label)!;
const MAPO = byLabel("서울 마포구");

/** 이 기기에 동네를 저장해 둔 채로 시작한다(useHome과 같은 형식) */
const saveHome = (page: Page, label: string) =>
  page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    ["where-is-santa:home", serializeHome(byLabel(label))],
  );

test("보내는 사람: 카드 미리보기, 인사말, 링크 복사", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await fixTime(page, kst(12, 20, 20));
  await saveHome(page, "서울 마포구");
  await page.goto("/");

  await page.getByRole("button", { name: "친구에게 알려주기" }).click();
  const sheet = page.getByRole("dialog", { name: "친구에게 알려주기" });
  await expect(sheet).toContainText("서울 마포구에 산타가 오는 시간");
  await expect(sheet).toContainText("12월 24일 밤 12시 32분");
  expect(await axeViolations(page)).toEqual([]);

  const greeting = sheet.getByRole("textbox", { name: "인사말" });
  await greeting.fill("오늘 밤 같이 보자 🎅");
  await expect(sheet).toContainText("12 / 40자"); // 이모지도 한 글자

  await sheet.getByRole("button", { name: "링크 복사" }).click();
  await expect(sheet).toContainText("복사했어요");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const url = new URL(copied);
  expect(url.pathname).toBe(`/s/${MAPO.id}`);
  expect(url.searchParams.get("m")).toBe("오늘 밤 같이 보자 🎅");

  // 40자를 넘기면 알리고 보내기를 막는다
  await greeting.fill("가".repeat(41));
  await expect(sheet).toContainText("인사말은 40자까지 쓸 수 있어요.");
  await expect(sheet.getByRole("button", { name: "링크 복사" })).toBeDisabled();
  await expect(greeting).toHaveAttribute("aria-invalid", "true");
});

test("받는 사람: 미리보기 <meta>, 인사말 시트, 시트 안에서 내 동네 고르기", async ({
  page,
  request,
}) => {
  await fixTime(page, kst(12, 20, 20));
  await page.goto(`/s/${MAPO.id}?m=${encodeURIComponent("오늘 밤 같이 보자 🎅")}`);

  // 메신저가 읽는 <meta>: 제목은 인사말, 그림은 보낸 사람 동네 카드
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "오늘 밤 같이 보자 🎅",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    new RegExp(`/og/${MAPO.id}$`),
  );
  const image = await request.get(`/og/${MAPO.id}`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");

  // 처음 들어오면 인사말 시트. 동네를 안 골랐으니 고르기를 권한다
  const sheet = page.getByRole("dialog", { name: "친구가 보낸 산타 소식" });
  await expect(sheet).toContainText("오늘 밤 같이 보자 🎅");
  await expect(sheet).toContainText("서울 중구 기준");
  expect(await axeViolations(page)).toEqual([]);

  // 같은 시트 안에서 동네 고르기로 바뀐다(시트를 닫고 새로 열지 않는다)
  await sheet.getByRole("button", { name: "우리 동네 고르기" }).click();
  const picker = page.getByRole("dialog", { name: "우리 동네 고르기" });
  await picker.getByRole("searchbox").fill("해운대");
  await picker.getByRole("button", { name: /^해운대구 부산/ }).click();
  await expect(picker).toBeHidden();

  // 보낸 사람(마포구)이 아니라 받는 사람이 고른 동네 기준
  const card = page.getByRole("region", { name: "우리 동네까지 남은 시간" });
  await expect(card).toContainText("부산 해운대구까지");
});

test("받는 사람: 동네를 이미 골랐고 인사말이 없으면 시트를 띄우지 않는다", async ({ page }) => {
  await fixTime(page, kst(12, 20, 20));
  await saveHome(page, "부산 해운대구");
  await page.goto(`/s/${MAPO.id}`);
  const card = page.getByRole("region", { name: "우리 동네까지 남은 시간" });
  await expect(card).toContainText("부산 해운대구까지");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "서울 마포구에 산타가 오는 시간",
  );
});

test("없는 동네 링크는 첫 페이지로, 첫 페이지와 아이콘에도 미리보기가 있다", async ({
  page,
  request,
}) => {
  await page.goto("/s/kr-00000?m=hi");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /icon\.svg/);
  for (const path of ["/icon.svg", "/apple-icon", "/og/kr-00000"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(path === "/og/kr-00000" ? 404 : 200);
  }
});
