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

test("learning path: 4LLL by default, OLL + PLL swaps the last-layer sections and survives reload", async ({ page }) => {
  const ll4 = page.locator('section[id="4lll"]');
  const oll = page.locator('section[id="oll"]');
  const pll = page.locator('section[id="pll"]');
  await expect(ll4).toHaveCount(1);
  await expect(oll).toHaveCount(0);
  await page.locator('[data-action="path"][data-value="full"]').click();
  await expect(ll4).toHaveCount(0);
  await expect(oll).toHaveCount(1);
  await expect(pll).toHaveCount(1);
  await page.reload();
  await expect(ll4).toHaveCount(0);
  await expect(oll).toHaveCount(1);
});

test("every algorithm row has a source chip", async ({ page }) => {
  const rows = page.locator(".alg-row");
  const count = await rows.count();
  expect(count).toBeGreaterThan(10);
  await expect(page.locator(".alg-row .src:not(.scdb-link)")).toHaveCount(count);
});

test("first link in every algorithm row goes to SpeedCubeDB", async ({ page }) => {
  const hrefs = await page.locator(".alg-row").evaluateAll((rows) => rows.map((r) => r.querySelector("a")?.href ?? ""));
  expect(hrefs.length).toBeGreaterThan(10);
  expect(hrefs.filter((h) => !h.startsWith("https://speedcubedb.com/a/3x3/"))).toEqual([]);
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

test("rotating a PLL case changes the shown alg and diagram, persists, and starring still works", async ({ page }) => {
  const card = page.locator("#case-pll-ua");
  const fav = card.locator(".alg-row").first().locator(".alg");
  const alg = await fav.getAttribute("aria-label");
  const diagram = await card.locator(".diagram").innerHTML();
  await card.locator('[data-action="rotate"]').click();
  await expect(fav).not.toHaveAttribute("aria-label", alg!);
  await expect.poll(() => card.locator(".diagram").innerHTML()).not.toBe(diagram);
  const rotated = await fav.getAttribute("aria-label");
  await page.reload();
  await expect(fav).toHaveAttribute("aria-label", rotated!);

  await card.locator('[data-action="expand"]').click();
  const second = card.locator(".alg-row").nth(1);
  const secondAlg = await second.locator(".alg").getAttribute("aria-label");
  await second.locator('[data-action="fav"]').click();
  await expect(fav).toHaveAttribute("aria-label", secondAlg!);
  await page.reload();
  await expect(fav).toHaveAttribute("aria-label", secondAlg!);
});

test("Animate here opens the 3D player without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.locator("#case-beg-1a .alg-row").first().locator('[data-action="play"]').click();
  await expect(page.locator("dialog.player twisty-player")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("dialog.player .player-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("PLL is ordered most common first by default, SCDB groups restore the original order, choice persists", async ({ page }) => {
  const sortRadio = (v: string) => page.locator(`[data-action="sort"][data-value="${v}"]`);
  /** Per group in display order: the cases with their probability. */
  const pllGroups = () =>
    page.locator('section[id="pll"] .group').evaluateAll((groups) =>
      groups
        .map((g) =>
          [...g.querySelectorAll(".case")].map((c) => {
            const [n, d] = c.querySelector(".badge.prob")!.textContent!.match(/(\d+)\/(\d+)/)!.slice(1).map(Number);
            return { id: c.id, p: n / d };
          }),
        )
        .filter((cases) => cases.length),
    );
  const isDesc = (xs: number[]) => xs.every((x, i) => i === 0 || xs[i - 1] >= x - 1e-9);

  await page.locator('[data-action="path"][data-value="full"]').click();
  await page.locator('button.section-head[data-id="section:pll"]').click();
  await expect(sortRadio("freqDesc")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('section[id="pll"] .badge.prob').first()).toContainText("%");

  const desc = await pllGroups();
  expect(isDesc(desc.map((g) => g.reduce((n, c) => n + c.p, 0)))).toBe(true);
  for (const g of desc) expect(isDesc(g.map((c) => c.p))).toBe(true);
  const sortedIds = desc.flat().map((c) => c.id);

  await sortRadio("groups").click();
  await expect(sortRadio("groups")).toHaveAttribute("aria-checked", "true");
  const scdbIds = (await pllGroups()).flat().map((c) => c.id);
  expect(scdbIds).not.toEqual(sortedIds);

  await page.reload();
  await expect(sortRadio("groups")).toHaveAttribute("aria-checked", "true");
  expect((await pllGroups()).flat().map((c) => c.id)).toEqual(scdbIds);

  await sortRadio("freqDesc").click();
  expect((await pllGroups()).flat().map((c) => c.id)).toEqual(sortedIds);
});
