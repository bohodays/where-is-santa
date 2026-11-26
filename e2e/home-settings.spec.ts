import { attrsAtDomReady, axeViolations, expect, layoutShift, test } from "./fixtures";

// 동네 고르기와 설정: 이 기기에 저장되고, 새로고침하면 첫 화면부터 적용된다

const JOURNEY = "/?demo=2026-12-24T23:00:00%2B09:00&speed=1";

test("초성으로 동네를 찾아 고르면 저장되고, 새로고침해도 첫 화면부터 그 동네다", async ({
  page,
}) => {
  await page.goto(JOURNEY);
  const card = page.getByRole("region", { name: "우리 동네까지 남은 시간" });
  await expect(card).toContainText("지금은 서울 기준이에요");

  await card.getByRole("button", { name: "우리 동네 고르기" }).click();
  const sheet = page.getByRole("dialog", { name: "우리 동네 고르기" });
  await sheet.getByRole("searchbox").fill("ㅁㅍ");
  // 결과 버튼 이름은 "마포구 서울 · 산타 도착 …"(시군구 이름, 시도)
  await sheet.getByRole("button", { name: /^마포구 서울/ }).click();
  await expect(sheet).toBeHidden();
  await expect(card).toContainText("서울 마포구까지");
  await expect(card).not.toContainText("지금은 서울 기준이에요");

  await page.reload();
  await expect(card).toContainText("서울 마포구까지");
  // "서울 기준" 안내는 <head> 스크립트가 처음부터 숨긴다(나중에 사라지며 화면이 밀리지 않는다)
  expect((await attrsAtDomReady(page))["data-home"]).toBe("chosen");
  await expect(card.getByText("지금은 서울 기준이에요")).toBeHidden();
  expect(await layoutShift(page)).toBeLessThan(0.01);
});

test("큰 글씨·고대비를 켜면 저장되고, 새로고침해도 첫 화면부터 적용된다", async ({ page }) => {
  await page.goto(JOURNEY);
  await page.getByRole("button", { name: "설정" }).click();
  const sheet = page.getByRole("dialog", { name: "설정" });
  await sheet.getByRole("switch", { name: "큰 글씨" }).click();
  await sheet.getByRole("switch", { name: "고대비" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  expect(await axeViolations(page)).toEqual([]);

  await page.reload();
  const attrs = await attrsAtDomReady(page);
  expect(attrs["data-text-size"]).toBe("large");
  expect(attrs["data-contrast"]).toBe("high");
  expect(await layoutShift(page)).toBeLessThan(0.01);
});
