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

/** Fills of a card's main diagram: the 9 top-face tiles first (row by row), then the side strips. */
const diagramFills = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`#case-${id} .diagram-btn rect`).evaluateAll((rs) => rs.map((r) => r.getAttribute("fill")));

test("OLL 23 diagram shows the full top face: 7 yellow tiles", async ({ page }) => {
  const fills = await diagramFills(page, "oll-23");
  expect(fills.slice(0, 9).filter((f) => f === "var(--st-u)")).toHaveLength(7);
});

test("OCLL diagram shows all 12 side strips, gray ones included", async ({ page }) => {
  const fills = await diagramFills(page, "oll-23");
  expect(fills).toHaveLength(9 + 12);
  expect(fills.slice(9)).toContain("var(--st-gray)");
});

test("EOLL diagram has no side strips", async ({ page }) => {
  expect(await diagramFills(page, "eoll-dot")).toHaveLength(9);
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
  await card.locator(".panel .more").click();
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

test("default view prints the recommended alg without its leading rotation; rotating adds one", async ({ page }) => {
  // OLL 23's recommended alg starts with (U2): that turn is in the diagram, not in the text
  const card = page.locator("#case-oll-23");
  const fav = card.locator(".alg-row").first().locator(".alg");
  await expect(fav).not.toHaveAttribute("aria-label", /^(y|\()/);
  const diagram = await card.locator(".diagram").innerHTML();
  await card.locator('[data-action="rotate"]').click();
  await expect(fav).toHaveAttribute("aria-label", /^\(U'\) /);
  await expect.poll(() => card.locator(".diagram").innerHTML()).not.toBe(diagram);
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

/** Opens a 4LLL card's More panel on the Full cases tab. */
async function openFullCases(page: import("@playwright/test").Page, id: string) {
  const card = page.locator(`#case-${id}`);
  await card.locator('[data-action="expand"]').click();
  await card.locator('[data-action="tab"][data-value="full"]').click();
  return card;
}

test("EOLL dot full cases: three with one alg each, +N shows the rest, an item opens the full case, Esc closes", async ({ page }) => {
  const card = await openFullCases(page, "eoll-dot");
  const items = card.locator(".sub-item");
  await expect(items).toHaveCount(3);
  const algsPerItem = () => items.evaluateAll((els) => els.map((e) => e.querySelectorAll(".alg").length));
  expect(await algsPerItem()).toEqual([1, 1, 1]);

  const more = card.locator(".panel .more");
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

test("EOLL dot full cases follow the sort setting below the pinned chosen subcase", async ({ page }) => {
  const card = await openFullCases(page, "eoll-dot");
  await card.locator(".panel .more").click();
  const items = card.locator(".sub-item");
  const ids = () => items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.case!));
  const desc = await ids();
  expect(desc.length).toBeGreaterThan(3);
  await expect(card.locator(".sub.pinned .sub-item")).toHaveAttribute("data-case", "full-oll-2");
  expect(desc[0]).toBe("full-oll-2");

  await page.locator('[data-action="sort"][data-value="freqAsc"]').click();
  await expect(items.first()).toHaveAttribute("data-case", "full-oll-2");
  await expect(items.nth(1)).toHaveAttribute("data-case", desc.at(-1)!);
  expect(new Set(await ids())).toEqual(new Set(desc));

  await page.locator('[data-action="sort"][data-value="groups"]').click();
  await expect(items.nth(1)).toHaveAttribute("data-case", "full-oll-1");

  // a learned full case drops to the end; the 4LLL card itself stays unlearned
  await card.locator('.sub:has([data-case="full-oll-1"]) [data-action="learn"]').click();
  await expect(items.last()).toHaveAttribute("data-case", "full-oll-1");
  await expect(card.locator('.case-top [data-action="learn"]')).toHaveAttribute("aria-pressed", "false");
});

test("one More button per card with counts in every locale; tabs switch between the two lists", async ({ page }) => {
  const perCard = await page.locator("article.case").evaluateAll((cards) =>
    cards.map((c) => c.querySelectorAll('[data-action="expand"]').length),
  );
  expect(perCard.length).toBeGreaterThan(10);
  expect(perCard.filter((n) => n > 1)).toEqual([]);
  const more = page.locator('#case-pll-y [data-action="expand"]');
  await expect(more).toHaveText("Więcej · 2 algi · 5 przypadków");
  await expect(page.locator('#case-pll-ua [data-action="expand"]')).toHaveText("Więcej · 5 algów");
  await page.locator('select[data-action="locale"]').selectOption("en");
  await expect(more).toHaveText("More · 2 algs · 5 cases");
  await page.locator('select[data-action="locale"]').selectOption("fr");
  await expect(more).toHaveText("Plus · 2 algos · 5 cas");

  const card = page.locator("#case-pll-y");
  await more.click();
  const alts = card.locator('[data-action="tab"][data-value="alts"]');
  const full = card.locator('[data-action="tab"][data-value="full"]');
  await expect(alts).toHaveAttribute("aria-checked", "true");
  await expect(card.locator(".panel .alg-row")).toHaveCount(2);
  await expect(card.locator(".sub-item")).toHaveCount(0);
  await full.click();
  await expect(full).toHaveAttribute("aria-checked", "true");
  await expect(card.locator(".panel .alg-row")).toHaveCount(0);
  await expect(card.locator(".sub-item")).toHaveCount(3);
  await expect(card.locator(".panel .more")).toHaveText("+2 de plus");
  // several cards may be open at once
  await page.locator('#case-pll-a [data-action="expand"]').click();
  await expect(card.locator(".sub-item")).toHaveCount(3);
});

test("alternatives show the favourite and two more, +N shows the rest", async ({ page }) => {
  const card = page.locator("#case-pll-ua");
  await card.locator('[data-action="expand"]').click();
  await expect(card.locator(".alg-row")).toHaveCount(3);
  const plus = card.locator(".panel .more");
  await expect(plus).toHaveText("+3 więcej");
  await plus.click();
  await expect(card.locator(".alg-row")).toHaveCount(6);
});

for (const width of [1280, 360])
  test(`open panels stay inside their card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ["eoll-line", "eoll-l", "eoll-dot", "pll-a", "pll-y"]) {
      const card = await openFullCases(page, id);
      await card.locator(".panel .more").click();
    }
    await page.locator('#case-pll-ua [data-action="expand"]').click();
    await page.locator("#case-pll-ua .panel .more").click();
    const outside = await page.locator("article.case").evaluateAll((cards) =>
      cards.flatMap((card) => {
        const r = card.getBoundingClientRect();
        return [...card.querySelectorAll("*")]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && (b.left < r.left - 1 || b.right > r.right + 1 || b.bottom > r.bottom + 1);
          })
          .map((e) => `${card.id} ${e.tagName} ${e.getAttribute("class")}`);
      }),
    );
    expect(outside).toEqual([]);
  });

test("choosing E for no headlights pins it, shows its alg with a label, and survives reload", async ({ page }) => {
  const card = await openFullCases(page, "pll-y");
  await expect(card.locator(".sub.pinned .sub-item")).toHaveAttribute("data-case", "full-pll-y");
  await expect(card.locator(".alg-from")).toHaveText("alg: Y");
  await card.locator(".panel .more").click();
  const e = card.locator('.sub:has(.sub-item[data-case="full-pll-e"])');
  const eAlg = await e.locator(".alg").getAttribute("aria-label");
  const cardY = (await card.boundingBox())!.y;
  await e.locator('[data-action="pick"]').click();
  expect(Math.abs((await card.boundingBox())!.y - cardY)).toBeLessThan(2);

  const check = async () => {
    await expect(card.locator('[data-action="tab"][data-value="alts"]')).toHaveAttribute("aria-checked", "true");
    await expect(card.locator(".alg-row").first().locator(".alg")).toHaveAttribute("aria-label", eAlg!);
    await expect(card.locator(".alg-from")).toHaveText("alg: E");
    await card.locator('[data-action="tab"][data-value="full"]').click();
    await expect(card.locator(".sub-item").first()).toHaveAttribute("data-case", "full-pll-e");
    await expect(card.locator('.sub.pinned [data-action="pick"]')).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator('.sub.pinned [data-action="pick"]')).toHaveAccessibleName("Układaj ten krok tym przypadkiem");
  };
  await check();
  await card.locator('[data-action="tab"][data-value="alts"]').click();
  await page.reload();
  await check();

  // picking the default again restores the 4LLL algs
  await card.locator('.sub:has(.sub-item[data-case="full-pll-y"]) [data-action="pick"]').click();
  await expect(card.locator(".alg-from")).toHaveText("alg: Y");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cubelook:v1")!).chosen)).toEqual({});
});

test("no-headlights header names the concept only; the alg label follows the chosen subcase", async ({ page }) => {
  const card = await openFullCases(page, "pll-y");
  await expect(card.locator(".alg-from")).toHaveText("alg: Y");
  await card.locator(".panel .more").click();
  await card.locator('.sub:has(.sub-item[data-case="full-pll-v"]) [data-action="pick"]').click();
  await expect(card.locator(".alg-from")).toHaveText("alg: V");
  await expect(card.locator(".case-meta .sub")).toHaveText("zamiana rogów po przekątnej");
  await expect(card.locator(".case-top")).not.toContainText("Y-perm");
});

test("the full case dialog keeps a learned case visible with Hide learned on", async ({ page }) => {
  await page.locator('[data-action="hideLearned"]').click();
  const card = await openFullCases(page, "pll-y");
  await card.locator(".sub-item").first().click();
  const dialog = page.locator("dialog.case-dialog");
  const learn = dialog.locator('.case-top [data-action="learn"]');
  await learn.click();
  await expect(learn).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator("article.case")).toHaveCount(1);
  await learn.click();
  await expect(learn).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Escape");
  // the 4LLL card is not hidden by a learned full case
  await expect(card).toBeVisible();
});

test("More and its tabs keep the card top in place", async ({ page }) => {
  const card = page.locator("#case-pll-y");
  const y = async () => (await card.boundingBox())!.y;
  for (const sel of ['[data-action="expand"]', '[data-action="tab"][data-value="full"]', ".panel .more", '[data-action="tab"][data-value="alts"]', '[data-action="expand"]']) {
    await card.locator(sel).scrollIntoViewIfNeeded();
    const before = await y();
    await card.locator(sel).click();
    expect(Math.abs((await y()) - before), sel).toBeLessThan(2);
  }
});

for (const density of ["normal", "compact"] as const)
  for (const action of ["fav", "down"] as const)
    test(`${action} on an alternative keeps the card top and page scroll (${density})`, async ({ page }) => {
      if (density === "compact") await page.locator('[data-action="compact"]').click();
      const card = page.locator("#case-beg-1a");
      await card.locator('[data-action="expand"]').click();
      await card.evaluate((el) => el.scrollIntoView({ block: "center" }));
      const row = card.locator(".alg-row").nth(1);
      const button = row.locator(`[data-action="${action}"]`);
      await button.scrollIntoViewIfNeeded();
      const alg = await row.locator(".alg").getAttribute("aria-label");
      const before = { y: await page.evaluate(() => window.scrollY), top: (await card.boundingBox())!.y };
      expect(before.y).toBeGreaterThan(0);
      await button.click();
      await expect(card.locator(".alg-row").nth(action === "fav" ? 0 : 2).locator(".alg")).toHaveAttribute("aria-label", alg!);
      expect(Math.abs((await page.evaluate(() => window.scrollY)) - before.y)).toBeLessThan(1);
      expect(Math.abs((await card.boundingBox())!.y - before.top)).toBeLessThan(1);
    });

test("favourite inside the full case dialog does not scroll the page", async ({ page }) => {
  const card = await openFullCases(page, "pll-y");
  await card.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await card.locator(".sub-item").first().click();
  const dialog = page.locator("dialog.case-dialog");
  await dialog.locator('[data-action="expand"]').click();
  const row = dialog.locator(".alg-row").nth(1);
  const alg = await row.locator(".alg").getAttribute("aria-label");
  await row.locator('[data-action="fav"]').scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await row.locator('[data-action="fav"]').click();
  await expect(dialog.locator(".alg-row").first().locator(".alg")).toHaveAttribute("aria-label", alg!);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(1);
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
