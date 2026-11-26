import { axeViolations, expect, fixTime, kst, layoutShift, test } from "./fixtures";

// 여정 중(이브 밤)과 끝난 뒤

test("여정 중: 위치 알약, 카운트다운, 도착 순서 시트(뒤로 가기로 닫기)", async ({ page }) => {
  await page.goto("/?demo=2026-12-25T00:20:00%2B09:00&speed=1");

  await expect(page.getByText(/지금 산타는/)).toBeVisible();
  const card = page.getByRole("region", { name: "우리 동네까지 남은 시간" });
  await expect(card).toContainText("서울 중구까지");
  await expect(page.getByRole("progressbar", { name: "산타의 여정" })).toHaveAttribute(
    "aria-valuetext",
    /전체 여정의 \d+%/,
  );
  expect(await layoutShift(page)).toBeLessThan(0.01);
  expect(await axeViolations(page)).toEqual([]);

  await page.getByRole("button", { name: "도착 순서 보기" }).click();
  const sheet = page.getByRole("dialog", { name: "산타의 도착 순서" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("서울 중구");
  expect(await axeViolations(page)).toEqual([]);

  // 휴대폰 뒤로 가기는 시트만 닫고 페이지에 머문다
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/demo=/);
});

test("끝난 뒤: 북극 마을과 다시 보기", async ({ page }) => {
  await fixTime(page, kst(12, 26, 9));
  await page.goto("/");
  await expect(page.getByText("산타가 북극으로 돌아갔어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 보기" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
