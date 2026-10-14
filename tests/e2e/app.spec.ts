import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?lang=pl&theme=dark");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/?lang=pl&theme=dark");
});

test("sections collapse and the state survives a reload", async ({ page }) => {
  const head = page.locator('button.section-head[data-id="section:f2l-beginner"]');
  await expect(head).toHaveAttribute("aria-expanded", "true");
  await head.click();
  await expect(page.locator('button.section-head[data-id="section:f2l-beginner"]')).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(page.locator('button.section-head[data-id="section:f2l-beginner"]')).toHaveAttribute("aria-expanded", "false");
});

test("+N and group toggle change only their target and keep the clicked control in place", async ({ page }) => {
  const more = page.locator('#case-beg-1a [data-action="expand"]');
  await more.scrollIntoViewIfNeeded();
  const moreY = (await more.boundingBox())!.y;
  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "true");
  expect(Math.abs((await more.boundingBox())!.y - moreY)).toBeLessThan(2);
  await expect(page.locator("#case-beg-1b .alg-row")).toHaveCount(1);

  const head = page.locator('button.group-head[data-id="group:beg-basic"]');
  const sibling = page.locator('button.group-head[data-id="group:beg-pairs"]');
  await head.scrollIntoViewIfNeeded();
  const headY = (await head.boundingBox())!.y;
  await head.click();
  await expect(head).toHaveAttribute("aria-expanded", "false");
  await expect(sibling).toHaveAttribute("aria-expanded", "true");
  expect(Math.abs((await head.boundingBox())!.y - headY)).toBeLessThan(2);
});

test("choosing a favourite moves it to the top and persists", async ({ page }) => {
  const card = page.locator("#case-beg-1a");
  await card.locator('[data-action="expand"]').click();
  const second = card.locator(".alg-row").nth(1);
  const alg = await second.locator(".alg").getAttribute("aria-label");
  await second.locator('[data-action="fav"]').click();
  await expect(page.locator("#case-beg-1a .alg-row").first().locator(".alg")).toHaveAttribute("aria-label", alg!);
  await page.reload();
  await expect(page.locator("#case-beg-1a .alg-row").first().locator(".alg")).toHaveAttribute("aria-label", alg!);
});

test("language switch translates the UI and sets <html lang>", async ({ page }) => {
  await page.locator('select[data-action="locale"]').selectOption("fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#h-sources")).not.toHaveText("Źródła i podziękowania");
  await page.locator('select[data-action="locale"]').selectOption("en");
  await expect(page.locator("#h-sources")).toHaveText("Sources and thanks");
});

test("theme and density switches update the root element", async ({ page }) => {
  await page.locator('[data-action="theme"][data-value="light"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator('[data-action="compact"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
});

test("every algorithm row has a source chip", async ({ page }) => {
  const rows = page.locator(".alg-row");
  const count = await rows.count();
  expect(count).toBeGreaterThan(10);
  await expect(page.locator(".alg-row .src")).toHaveCount(count);
});

test("hide M/S removes slice algorithms from EPLL", async ({ page }) => {
  await page.locator('[data-action="onlyFav"]').click();
  await page.locator('[data-action="hideSlice"]').click();
  const ua = page.locator("#case-pll-ua .alg");
  await expect(ua.first()).toBeVisible();
  for (const label of await ua.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? "")))
    expect(label).not.toMatch(/(^|\s)M/);
});

test("recommended badge stays on the SpeedCubeDB alg when another favourite is picked", async ({ page }) => {
  const card = page.locator("#case-beg-1a");
  const rows = card.locator(".alg-row");
  await expect(rows.first().locator(".tag-rec")).toHaveCount(1);
  const recommended = await rows.first().locator(".alg").getAttribute("aria-label");
  await card.locator('[data-action="expand"]').click();
  await rows.nth(1).locator('[data-action="fav"]').click();
  await expect(card.locator(".tag-rec")).toHaveCount(1);
  await expect(rows.nth(1).locator(".tag-rec")).toHaveCount(1);
  await expect(rows.nth(1).locator(".alg")).toHaveAttribute("aria-label", recommended!);
});

test("favourite is remembered per slice-filter context", async ({ page }) => {
  const card = page.locator("#case-pll-ua");
  const rows = card.locator(".alg-row");
  await card.locator('[data-action="expand"]').click();
  const slice = card.locator(".alg-row:has(.tag-m)").first();
  const sliceAlg = await slice.locator(".alg").getAttribute("aria-label");
  await slice.locator('[data-action="fav"]').click();
  await expect(rows.first().locator(".alg")).toHaveAttribute("aria-label", sliceAlg!);

  await page.locator('[data-action="hideSlice"]').click();
  await rows.nth(1).locator('[data-action="fav"]').click();
  const noSliceAlg = await rows.first().locator(".alg").getAttribute("aria-label");
  expect(noSliceAlg).not.toBe(sliceAlg);

  await page.locator('[data-action="hideSlice"]').click();
  await expect(rows.first().locator(".alg")).toHaveAttribute("aria-label", sliceAlg!);
  await page.locator('[data-action="hideSlice"]').click();
  await expect(rows.first().locator(".alg")).toHaveAttribute("aria-label", noSliceAlg!);
});
