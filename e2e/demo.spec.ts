import {
  attrsAtDomReady,
  axeViolations,
  expect,
  fixTime,
  kst,
  layoutShift,
  test,
} from "./fixtures";

// 데모 모드: 시즌 전 미리 보기 → 이브 밤으로 시간 이동 → 배속 바꾸기 → 새로고침 → 끝내기

test("시즌 전에 이브 밤으로 시간 이동해 우리 동네 도착을 본다", async ({ page, consoleErrors }) => {
  await fixTime(page, kst(11, 22, 12)); // 공개 한 달 전
  await page.goto("/");

  // 북극 마을, 데모 띠는 없다
  await expect(page.getByText("산타 출발까지")).toBeVisible();
  await expect(page.getByText("데모 모드", { exact: false })).toBeHidden();

  await page.getByRole("button", { name: "이브 밤으로 미리 보기" }).click();
  const sheet = page.getByRole("dialog", { name: "미리 체험해 보기" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("radio", { name: "1초 = 1분" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(sheet).toContainText("서울 중구에 오기 20분 전");
  expect(await axeViolations(page)).toEqual([]);

  await sheet.getByRole("button", { name: "이브 밤으로 시간 이동" }).click();
  await expect(sheet).toBeHidden();

  // 데모 띠, 주소, 카운트다운 20분 안쪽, 지도 자리
  await expect(page.locator(".demo-only")).toHaveText(/데모 모드 · 1초 = 1분/);
  await expect(page).toHaveURL(/[?&]demo=2026-12-2[45]T.*&speed=60/);
  const card = page.getByRole("region", { name: "우리 동네까지 남은 시간" });
  await expect(card).toContainText(/(1[0-9]|20)분/);
  expect(await axeViolations(page)).toEqual([]);

  // 1초 = 1분이라 약 20초 뒤 산타가 온다
  await expect(card).toContainText("산타가 왔어요!", { timeout: 30_000 });
  expect(consoleErrors).toEqual([]);
});

test("데모 중 배속을 바꾸고, 새로고침해도 이어지고, 끝내면 실제 시각으로 돌아온다", async ({
  page,
}) => {
  await fixTime(page, kst(11, 22, 12));
  await page.goto("/?demo=2026-12-24T23:30:00%2B09:00&speed=60");
  const badge = page.locator(".demo-only");
  await expect(badge).toHaveText(/데모 모드 · 1초 = 1분/);

  // 배속 바꾸기: 시트가 열려 있는 동안은 주소를 그대로 두고, 닫힌 뒤 바꾼다
  await page.getByRole("button", { name: "데모 바꾸기" }).click();
  const sheet = page.getByRole("dialog", { name: "데모 모드" });
  await sheet.getByRole("radio", { name: "1초 = 10분" }).click();
  await expect(badge).toHaveText(/1초 = 10분/);
  await sheet.getByRole("button", { name: "닫기" }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/speed=600/);

  // 새로고침: 첫 화면부터 데모 띠(<head> 스크립트), 화면 밀림 없음
  await page.reload();
  await expect(badge).toHaveText(/1초 = 10분/);
  expect((await attrsAtDomReady(page))["data-demo"]).toBe("on");
  expect(await layoutShift(page)).toBeLessThan(0.01);

  // 뒤로 가기로 시트를 닫아도 주소의 데모는 남는다
  await page.getByRole("button", { name: "데모 바꾸기" }).click();
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/demo=/);

  // 끝내기
  await page.getByRole("button", { name: "데모 바꾸기" }).click();
  await sheet.getByRole("button", { name: "데모 끝내기" }).click();
  await expect(page).not.toHaveURL(/demo=/);
  await expect(badge).toBeHidden();
  await expect(page.getByRole("button", { name: "이브 밤으로 미리 보기" })).toBeVisible();
});

test("진짜 이브 저녁에는 미리 보기를 권하지 않는다", async ({ page }) => {
  await fixTime(page, kst(12, 24, 17));
  await page.goto("/");
  await expect(page.getByText("산타 출발까지")).toBeVisible();
  await expect(page.getByRole("button", { name: "이브 밤으로 미리 보기" })).toHaveCount(0);
});
