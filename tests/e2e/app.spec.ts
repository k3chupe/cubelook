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

test("+N and group toggle change only their target and keep their anchor in place", async ({ page }) => {
  const card = page.locator("#case-beg-1a");
  const more = card.locator('[data-action="expand"]');
  await more.scrollIntoViewIfNeeded();
  const cardY = (await card.boundingBox())!.y;
  const favY = (await card.locator(".alg-row").first().boundingBox())!.y;
  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "true");
  // the card stays put and the alternatives appear below the favourite, not at the end of the page
  expect(Math.abs((await card.boundingBox())!.y - cardY)).toBeLessThan(2);
  expect(Math.abs((await card.locator(".alg-row").first().boundingBox())!.y - favY)).toBeLessThan(2);
  const alt = card.locator(".alg-row").nth(1);
  await expect(alt).toBeVisible();
  expect((await alt.boundingBox())!.y).toBeGreaterThan(favY);
  await more.scrollIntoViewIfNeeded();
  const expandedY = (await card.boundingBox())!.y;
  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  expect(Math.abs((await card.boundingBox())!.y - expandedY)).toBeLessThan(2);
  await expect(page.locator("#case-beg-1b .alg-row")).toHaveCount(1);
});

test("group toggle changes only its target and keeps the header in place", async ({ page }) => {
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

test("every algorithm row has a SpeedCubeDB icon link to its case", async ({ page }) => {
  const rows = await page.locator(".alg-row").count();
  expect(rows).toBeGreaterThan(10);
  const hrefs = await page.locator(".alg-row .scdb-link").evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs).toHaveLength(rows);
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

test("PLL cases are most common first inside each group, SCDB groups restore the original order, choice persists", async ({ page }) => {
  const sortRadio = (v: string) => page.locator(`[data-action="sort"][data-value="${v}"]`);
  /** Per group in display order: the cases with their probability (in %). */
  const pllGroups = () =>
    page.locator('section[id="pll"] .group').evaluateAll((groups) =>
      groups
        .map((g) =>
          [...g.querySelectorAll(".case")].map((c) => ({
            id: c.id,
            p: parseFloat(c.querySelector(".badge.prob")!.textContent!.replace(",", ".")),
          })),
        )
        .filter((cases) => cases.length),
    );
  const isDesc = (xs: number[]) => xs.every((x, i) => i === 0 || xs[i - 1] >= x - 1e-9);

  await page.locator('[data-action="path"][data-value="full"]').click();
  await page.locator('button.section-head[data-id="section:pll"]').click();
  await expect(sortRadio("freqDesc")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('section[id="pll"] .badge.prob').first()).toContainText("%");

  const desc = await pllGroups();
  for (const g of desc) expect(isDesc(g.map((c) => c.p))).toBe(true);
  const sortedIds = desc.flat().map((c) => c.id);

  await sortRadio("groups").click();
  await expect(sortRadio("groups")).toHaveAttribute("aria-checked", "true");
  const scdb = await pllGroups();
  // sorting moves cases inside a group, never the groups themselves
  expect(scdb.map((g) => g.map((c) => c.id).sort())).toEqual(desc.map((g) => g.map((c) => c.id).sort()));
  const scdbIds = scdb.flat().map((c) => c.id);
  expect(scdbIds).not.toEqual(sortedIds);

  await page.reload();
  await expect(sortRadio("groups")).toHaveAttribute("aria-checked", "true");
  expect((await pllGroups()).flat().map((c) => c.id)).toEqual(scdbIds);

  await sortRadio("freqDesc").click();
  expect((await pllGroups()).flat().map((c) => c.id)).toEqual(sortedIds);
});

test("Most common keeps the 4LLL stage order", async ({ page }) => {
  const head = page.locator('button.section-head[data-id="section:4lll"]');
  if ((await head.getAttribute("aria-expanded")) === "false") await head.click();
  const sortRadio = (v: string) => page.locator(`[data-action="sort"][data-value="${v}"]`);
  const stages = () => page.locator('section[id="4lll"] .group:not(.tips) h3.group-heading .head-title').allTextContents();

  await sortRadio("groups").click();
  const scdb = await stages();
  expect(scdb).toHaveLength(4);
  await sortRadio("freqDesc").click();
  await expect(sortRadio("freqDesc")).toHaveAttribute("aria-checked", "true");
  expect(await stages()).toEqual(scdb);
});

test("EOLL dot strip: three full cases with one alg each, +N shows the rest, an item opens the full case, Esc closes", async ({ page }) => {
  const section = page.locator('button.section-head[data-id="section:4lll"]');
  if ((await section.getAttribute("aria-expanded")) === "false") await section.click();
  const card = page.locator("#case-eoll-dot");
  const head = card.locator(".subcases-head");
  await expect(head).toHaveAttribute("aria-expanded", "false");
  await head.click();
  const items = card.locator(".sub-item");
  await expect(items).toHaveCount(3);
  const algsPerItem = () => items.evaluateAll((els) => els.map((e) => e.querySelectorAll(".alg").length));
  expect(await algsPerItem()).toEqual([1, 1, 1]);

  const more = card.locator(".subcases .more");
  const rest = parseInt((await more.textContent())!.slice(1), 10);
  expect(rest).toBeGreaterThan(0);
  await more.click();
  await expect(items).toHaveCount(3 + rest);
  expect(await algsPerItem()).toEqual(Array(3 + rest).fill(1));

  await items.first().click();
  const dialog = page.locator("dialog.case-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("article.case .diagram")).toHaveCount(1);
  await expect(dialog.locator(".alg-row").first()).toBeVisible();
  await expect(page.locator('section[id="4lll"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("EOLL dot strip follows the sort setting", async ({ page }) => {
  const section = page.locator('button.section-head[data-id="section:4lll"]');
  if ((await section.getAttribute("aria-expanded")) === "false") await section.click();
  const card = page.locator("#case-eoll-dot");
  await card.locator(".subcases-head").click();
  await card.locator(".subcases .more").click();
  const ids = () => card.locator(".sub-item").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.case!));
  const desc = await ids();
  expect(desc.length).toBeGreaterThan(3);

  await page.locator('[data-action="sort"][data-value="freqAsc"]').click();
  await expect(card.locator(".sub-item").first()).toHaveAttribute("data-case", desc.at(-1)!);
  expect(new Set(await ids())).toEqual(new Set(desc));

  await page.locator('[data-action="sort"][data-value="groups"]').click();
  await expect(card.locator(".sub-item").first()).toHaveAttribute("data-case", "full-oll-1");
});

test("compact: collapsed rows show only the case and cube links, hover changes nothing, +N shows the full details", async ({ page }) => {
  await page.locator('[data-action="compact"]').click();
  const card = page.locator("#case-beg-1a");
  await card.scrollIntoViewIfNeeded();
  const row = card.locator(".alg-row");
  await expect(row).toHaveCount(1);
  const links = row.locator(".quick-links > a");
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveClass(/scdb-link/);
  await expect(row.locator('[data-action="fav"]')).toHaveCount(0);

  const snapshot = async () => ({
    card: (await card.boundingBox())!,
    alg: (await row.locator(".alg").boundingBox())!,
    links: (await row.locator(".quick-links").boundingBox())!,
  });
  const before = await snapshot();
  expect(before.links.height).toBeLessThanOrEqual(before.alg.height);
  await page.mouse.move(before.alg.x + before.alg.width / 2, before.alg.y + before.alg.height / 2);
  const hovered = await snapshot();
  for (const k of Object.keys(before) as (keyof typeof before)[]) {
    expect(Math.abs(before[k].y - hovered[k].y), k).toBeLessThan(1);
    expect(Math.abs(before[k].height - hovered[k].height), k).toBeLessThan(1);
  }

  const more = card.locator('[data-action="expand"]');
  const cardY = (await card.boundingBox())!.y;
  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "true");
  expect(Math.abs((await card.boundingBox())!.y - cardY)).toBeLessThan(2);
  const second = card.locator(".alg-row").nth(1);
  const star = second.locator('[data-action="fav"]');
  await expect(star).toBeVisible();
  const secondAlg = await second.locator(".alg").getAttribute("aria-label");
  await star.click();
  await expect(card.locator(".alg-row").first().locator(".alg")).toHaveAttribute("aria-label", secondAlg!);
});

test("icon links are named, show a speech bubble on hover, and hovering changes no box", async ({ page }) => {
  const card = page.locator("#case-beg-1a");
  await card.scrollIntoViewIfNeeded();
  const row = card.locator(".alg-row").first();
  const scdb = row.locator("a.scdb-link");
  const cube = row.locator("a.cube-link");
  await expect(scdb).toHaveAccessibleName("SpeedCubeDB");
  await expect(cube).toHaveAccessibleName(/Twizzle/);
  for (const link of [scdb, cube]) {
    const b = (await link.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(24);
    expect(b.height).toBeGreaterThanOrEqual(24);
  }

  const snapshot = async () => ({ row: (await row.boundingBox())!, card: (await card.boundingBox())! });
  const before = await snapshot();
  await cube.hover();
  await expect.poll(() => cube.evaluate((a) => getComputedStyle(a, "::after").opacity)).toBe("1");
  expect(await cube.evaluate((a) => getComputedStyle(a, "::after").content)).toContain("Twizzle");
  const hovered = await snapshot();
  for (const k of ["row", "card"] as const) {
    expect(Math.abs(before[k].y - hovered[k].y), k).toBeLessThan(1);
    expect(Math.abs(before[k].height - hovered[k].height), k).toBeLessThan(1);
    expect(Math.abs(before[k].width - hovered[k].width), k).toBeLessThan(1);
  }
});

test("header controls wrap at 360px: nothing is clipped and the page does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const outside = [
      ...document.querySelectorAll<HTMLElement>(
        ".topbar .controls button, .topbar .controls select, .topbar .controls label, .topbar .controls .segmented, .topbar .jump a",
      ),
    ]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.left < -1 || b.right > W + 1;
      })
      .map((el) => el.textContent?.trim());
    return { scroll: document.documentElement.scrollWidth, width: W, outside };
  });
  expect(r.scroll).toBeLessThanOrEqual(r.width);
  expect(r.outside).toEqual([]);
});
