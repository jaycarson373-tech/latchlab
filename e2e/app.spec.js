import { test, expect } from "@playwright/test";
test("complete all vaults, persist progress, and reset safely", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Turbo", exact: true }).click();
  for (let i = 1; i <= 5; i++) {
    await page
      .getByRole("button", { name: new RegExp(`^Vault ${i}:`) })
      .click();
    await page.locator("#launch").click();
    await expect(page.locator("#vault-status")).toHaveText("CRACKED ✓", {
      timeout: 15000,
    });
  }
  await expect(page.locator("#total-points")).toHaveText("8,750 PTS");
  await page.reload();
  await expect(page.locator("#total-points")).toHaveText("8,750 PTS");
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator("#total-points")).toHaveText("8,750 PTS");
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset all progress", exact: true })
    .click();
  await expect(page.locator("#total-points")).toHaveText("0 PTS");
  expect(errors).toEqual([]);
});
test("manual wrong answers and correct answers; pause resumes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "☻ You", exact: true }).click();
  await page.locator("#launch").click();
  await page.locator("#answer").fill("wrong");
  await page.locator("#answer-form button").click();
  await expect(page.locator("#log")).toContainText("not the answer");
  const clue = await page.locator("#log").textContent();
  const nums = clue.match(/sequence: (\d+), (\d+), (\d+), (\d+)/);
  await page
    .locator("#answer")
    .fill(String(Number(nums[4]) + Number(nums[2]) - Number(nums[1])));
  await page.locator("#answer-form button").click();
  await expect(page.locator("#progress-text")).toHaveText("1 / 3");
  await page.getByRole("button", { name: "Pause run" }).click();
  await expect(page.locator("#launch")).toBeEnabled();
  await page.reload();
  await expect(page.locator("#progress-text")).toHaveText("1 / 3");
});
test("AI failures are visible; keys never persist", async ({ page }) => {
  await page.route("https://api.openai.com/**", (r) =>
    r.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "⌘ Your AI", exact: true }).click();
  await page.locator("#api-key").fill("fake-test-key");
  await page.locator("#launch").click();
  await expect(page.locator("#log")).toContainText("API key rejected", {
    timeout: 10000,
  });
  await expect(page.locator("#launch")).toBeEnabled();
  await page.reload();
  await expect(page.locator("#api-key")).toHaveValue("");
});
test("desktop and mobile layout, docs, selection and screenshot", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("#scene canvas")).toBeVisible();
  await page.screenshot({ path: "/tmp/latchlab-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Next vault" }).click();
  await expect(page.locator("#panel-name")).toHaveText("Prism");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/latchlab-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#launch").scrollIntoViewIfNeeded();
  await expect(page.locator("#launch")).toBeVisible();
});
