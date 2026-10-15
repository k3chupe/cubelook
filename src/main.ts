import "@fontsource/fira-sans/latin-400.css";
import "@fontsource/fira-sans/latin-ext-400.css";
import "@fontsource/fira-sans/latin-500.css";
import "@fontsource/fira-sans/latin-ext-500.css";
import "@fontsource/fira-sans/latin-700.css";
import "@fontsource/fira-sans/latin-ext-700.css";
import "@fontsource/fira-code/latin-500.css";
import "@fontsource/fira-code/latin-ext-500.css";
import "@fontsource/fira-code/latin-600.css";
import "@fontsource/fira-code/latin-ext-600.css";
import "./style.css";
import data from "./data/generated.json";
import type { AlgOut, CaseOut, GroupOut, SectionOut, TipSource } from "./data/types";
import { SOURCES, TOOLS, type SourceId } from "./data/sources";
import { leadTurn, withPreAuf } from "./cube";
import { caseDiagram } from "./diagram";
import { icons } from "./icons";
import { algCubingNetUrl, speedcubedbCaseLink, twizzleUrl } from "./links";
import { onChange, orderedAlgs, orderSubcases, resetSettings, settings, update } from "./store";
import { segmentAlg, TRIGGER_KINDS, usesSlice, isTwoGen, isRotation, hasRotation } from "./triggers";
import { openPlayer } from "./player";
import { content, detectLocale, isLocale, LOCALES, locale, plural, setLocale, t, type Locale } from "./i18n";

const sections = data as unknown as SectionOut[];
const APP_NAME = "CubeLook";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface CaseRef {
  section: SectionOut;
  group: GroupOut;
  c: CaseOut;
}
const caseIndex = new Map<string, CaseRef>();
for (const section of sections)
  for (const group of section.groups) for (const c of group.cases) caseIndex.set(c.id, { section, group, c });

/** Learning path decides which last-layer section is shown; F2L sections are always shown. */
const pathHidden = (id: string) => (settings.path === "4lll" ? ["oll", "pll"] : ["4lll"]).includes(id);
/** Integer (1e-9 units) so equal sums tie exactly; cases without prob (F2L) count as 0. */
const probOf = (c: CaseOut) => {
  const p = c.prob;
  return p ? Math.round((p[0] / p[1]) * 1e9) : 0;
};

/** Display-only copies: data and stored user order are never changed. Stable sort keeps F2L as is. Groups keep their stage order. */
function sortedSections(list: SectionOut[]): SectionOut[] {
  if (settings.sort === "groups") return list;
  const dir = settings.sort === "freqDesc" ? -1 : 1;
  return list.map((s) => ({
    ...s,
    groups: s.groups.map((g) => ({ ...g, cases: [...g.cases].sort((a, b) => (probOf(a) - probOf(b)) * dir) })),
  }));
}

const visibleSections = () => sortedSections(sections.filter((s) => !pathHidden(s.id)));

const algsBySource = () =>
  visibleSections()
    .flatMap((s) => s.groups.flatMap((g) => g.cases.flatMap((c) => c.algs)))
    .reduce<Record<string, number>>((acc, a) => ((acc[a.source] = (acc[a.source] ?? 0) + 1), acc), {});

const caseName = (c: CaseOut) => content("cases", c.id)?.name ?? c.name;
const caseSubtitle = (c: CaseOut) => content("cases", c.id)?.subtitle;
const caseTitle = (c: CaseOut) => [caseName(c), caseSubtitle(c)].filter(Boolean).join(" – ");

const percent = (x: number) =>
  new Intl.NumberFormat(locale(), { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x);

function probBadge(c: CaseOut): string {
  const p = c.prob;
  if (!p) return "";
  const text = percent(p[0] / p[1]);
  return `<span class="badge prob" role="img" aria-label="${esc(`${t().ui.probability}: ${text}`)}" translate="no">${esc(text)}</span>`;
}

function isCollapsed(id: string, fallback: boolean): boolean {
  return settings.collapsed[id] ?? fallback;
}

/* ---------- algorithm rendering ---------- */

function triggerLabel(key: string, arg?: string): string {
  const label = t().triggers[key]?.label ?? key;
  return arg ? label.replace("{move}", arg) : label;
}

function renderAlg(alg: string): string {
  return segmentAlg(alg)
    .map((seg) => {
      const moves = seg.moves.map((m) => `<span class="mv${isRotation(m) ? " rot" : ""}">${esc(m)}</span>`).join(" ");
      if (!seg.kind)
        return `<span class="seg plain"><span class="seg-label" aria-hidden="true"></span><span class="seg-moves">${moves}</span></span>`;
      return `<span class="seg" style="--c:${seg.kind.color}"><span class="seg-label">${esc(triggerLabel(seg.labelKey!, seg.labelArg))}</span><span class="seg-moves">${moves}</span></span>`;
    })
    .join("");
}

/** Leading turn of the case's recommended alg: the default view is drawn at it, so that alg prints with no prefix. */
const anchorOf = (c: CaseOut) => leadTurn(c.algs[0].alg).amount;

/** Stored algs stay as-is (favourites, order); the rotated view only changes what is shown and played. Last layer only. */
const shownAlg = (caseId: string, alg: string, anchor: number) =>
  caseIndex.get(caseId)?.group.view === "f2l" ? alg : withPreAuf(alg, settings.auf[caseId] ?? 0, anchor);

function algTags(alg: string): string {
  const m = t().ui;
  const tags: string[] = [];
  if (isTwoGen(alg)) tags.push(`<span class="tag tag-ru">${esc(m.tagRU)}</span>`);
  if (usesSlice(alg)) tags.push(`<span class="tag tag-m">${esc(m.tagSlice)}</span>`);
  if (hasRotation(alg)) tags.push(`<span class="tag">${esc(m.tagRotation)}</span>`);
  return tags.join("");
}

/** Icon link with a speech-bubble tip (CSS `data-tip`, shown on hover/focus); the accessible name is the same text. */
function quickLink(href: string, tip: string, icon: string, cls: string): string {
  return `<a class="quick-link ${cls}" href="${esc(href)}" target="_blank" rel="noopener" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${icon}</a>`;
}

/** Case page on SpeedCubeDB and the alg on a virtual cube (Twizzle), at the right edge of a row. */
function quickLinks(ref: CaseRef, alg: string): string {
  const scdb = speedcubedbCaseLink(ref.c);
  const cube = twizzleUrl(alg, ref.group.view, caseTitle(ref.c));
  return `<span class="quick-links">${scdb ? quickLink(scdb, SOURCES.speedcubedb.short, icons.db, "scdb-link") : ""}${quickLink(cube, t().ui.openCubeHint, icons.twizzle, "cube-link")}</span>`;
}

function sourceChip(a: AlgOut): string {
  const s = SOURCES[a.source];
  const label = `${t().ui.source}: ${s.short}`;
  return a.sourceUrl
    ? `<a class="src src-${s.id}" href="${esc(a.sourceUrl)}" target="_blank" rel="noopener" title="${esc(label)}">${esc(s.short)}</a>`
    : `<span class="src src-${s.id}" title="${esc(label)}">${esc(s.short)}</span>`;
}

/** The case's algs in the user's order, favourite first, after the slice filter. */
function visibleAlgs(c: CaseOut): AlgOut[] {
  const all = orderedAlgs(c.id, c.algs, settings.hideSlice);
  const noSlice = settings.hideSlice ? all.filter((a) => !usesSlice(a.alg)) : [];
  return noSlice.length ? noSlice : all;
}

/** GLOSSARY "Chosen subcase" of a 4LLL case with subcases; undefined = none (the card's own 4LLL algs). */
const chosenOf = (c: CaseOut): string | undefined => settings.chosen[c.id] ?? c.defaultSubcase;

/** Whose algs a card shows: a chosen subcase other than the default (the 4LLL algs already solve the default). */
function algSource(ref: CaseRef): CaseRef {
  const id = chosenOf(ref.c);
  return (id !== ref.c.defaultSubcase && id && caseIndex.get(id)) || ref;
}

/** 4LLL CPLL diagrams show only corners; EOLL's own view already shows only edges. */
const cornersOnly = (ref: CaseRef) => ref.section.id === "4lll" && ref.group.goal === "cp";

/** At most `max` items, the rest behind a "+N" toggle. */
function capped(list: (html: string) => string, items: string[], id: string, max = 3): string {
  const open = !isCollapsed(id, true);
  const rest = items.length - max;
  return `${list((open ? items : items.slice(0, max)).join(""))}${
    rest > 0 && !open
      ? `<button class="more" data-action="toggle" data-id="${id}" aria-expanded="false">${esc(plural(rest, t().ui.subcasesMore))}</button>`
      : ""
  }`;
}

function iconButton(action: string, label: string, icon: string, extra = "", attrs = ""): string {
  return `<button class="icon-btn ${extra}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${attrs}>${icon}</button>`;
}

/** `aufId`: the card whose rotation the alg is shown in (a 4LLL card showing its chosen subcase's algs). */
function renderAlgRow(ref: CaseRef, a: AlgOut, index: number, count: number, showReorder: boolean, quick: boolean, aufId = ref.c.id): string {
  const m = t().ui;
  const title = caseTitle(ref.c);
  const fav = index === 0;
  const data = `data-case="${ref.c.id}" data-alg="${esc(a.alg)}" data-auf="${aufId}"`;
  const alg = shownAlg(aufId, a.alg, anchorOf(ref.c));
  const note = a.note ? content("notes", a.note) : undefined;
  const recommended = a.recommended ? `<span class="tag tag-rec">${esc(m.recommended)}</span>` : "";
  // compact collapsed: only the alg and its two icon links
  if (quick)
    return `
  <li class="alg-row is-fav quick">
    <div class="alg" translate="no" aria-label="${esc(alg)}">${renderAlg(alg)}</div>
    ${quickLinks(ref, alg)}
  </li>`;
  return `
  <li class="alg-row${fav ? " is-fav" : ""}">
    <div class="alg" translate="no" aria-label="${esc(alg)}">${renderAlg(alg)}</div>
    ${note ? `<div class="alg-note">${esc(note)}</div>` : ""}
    <div class="alg-actions">
      <span class="tags">${recommended}${algTags(alg)}${sourceChip(a)}</span>
      ${iconButton("fav", fav ? m.fav : m.setFav, icons.star, `star${fav ? " on" : ""}`, `${data} aria-pressed="${fav}"`)}
      ${
        showReorder
          ? iconButton("up", m.moveUp, icons.up, "", `${data} ${index === 0 ? "disabled" : ""}`) +
            iconButton("down", m.moveDown, icons.down, "", `${data} ${index === count - 1 ? "disabled" : ""}`)
          : ""
      }
      ${iconButton("play", m.playHere, icons.play, "play", data)}
      <a class="link-btn alt" href="${algCubingNetUrl(alg, title)}" target="_blank" rel="noopener">${esc(m.openTwizzle)}</a>
      ${quickLinks(ref, alg)}
    </div>
  </li>`;
}

/**
 * Full cases of a 4LLL case (subcases are in full-section order): the chosen one pinned on top, then by learned and
 * `settings.sort`. Each item opens its full case and has its own "use this" and learned toggles.
 */
function renderSubcases(ref: CaseRef): string {
  const { c } = ref;
  const m = t().ui;
  const chosen = chosenOf(c);
  const refs = (c.subcases ?? []).map((id) => caseIndex.get(id)).filter((r): r is CaseRef => !!r);
  const total = refs.reduce((n, r) => n + probOf(r.c), 0);
  const pickBtn = (caseId: string, on: boolean) =>
    iconButton("pick", m.pickSubcase, icons.pin, `pin${on ? " on" : ""}`, `data-id="${c.id}" data-case="${caseId}" aria-pressed="${on}"`);
  const items = orderSubcases(
    refs.map((r) => ({ id: r.c.id, p: probOf(r.c), r })),
    chosen,
    settings.learned,
    settings.sort,
  ).map(({ id, p, r }) => {
    const alg = shownAlg(id, visibleAlgs(r.c)[0].alg, anchorOf(r.c));
    const learned = !!settings.learned[id];
    const label = `${m.diagramLL}: ${caseTitle(r.c)}`;
    return `
    <li class="sub${id === chosen ? " pinned" : ""}${learned ? " learned" : ""}">
      <button class="sub-item" data-action="subcase" data-case="${id}">
        <span class="sub-diagram">${caseDiagram(r.c.setup, r.group.view, label, (anchorOf(r.c) + (settings.auf[id] ?? 0)) % 4)}</span>
        <span class="sub-body"><span class="sub-name">${esc(caseName(r.c))} <span class="sub-share">${esc(percent(total ? p / total : 0))}</span></span><span class="alg" translate="no" aria-label="${esc(alg)}">${renderAlg(alg)}</span></span>
      </button>
      <span class="sub-actions">
        ${pickBtn(id, id === chosen)}
        ${iconButton("learn", learned ? m.learned : m.markLearned, icons.check, `learn${learned ? " on" : ""}`, `data-case="${id}" aria-pressed="${learned}"`)}
      </span>
    </li>`;
  });
  if (!c.defaultSubcase) {
    // no subcase matches the 4LLL algs: they get their own entry, pinned while no subcase is chosen
    const alg = shownAlg(c.id, visibleAlgs(c)[0].alg, anchorOf(c));
    items.splice(chosen ? 1 : 0, 0, `
    <li class="sub${chosen ? "" : " pinned"}">
      <span class="sub-item"><span class="sub-body"><span class="sub-name">${esc(m.lllAlg)}</span><span class="alg" translate="no" aria-label="${esc(alg)}">${renderAlg(alg)}</span></span></span>
      <span class="sub-actions">${pickBtn("", !chosen)}</span>
    </li>`);
  }
  return capped((html) => `<ul class="sub-list">${html}</ul>`, items, `subcases-more:${c.id}`);
}

/** `hideLearned` is off in the full case dialog: a case opened there stays visible. */
function renderCase(ref: CaseRef, idPrefix = "case-", hideLearned = settings.hideLearned): string {
  const m = t().ui;
  const { c } = ref;
  const learned = !!settings.learned[c.id];
  if (learned && hideLearned) return "";
  const src = algSource(ref);
  const all = visibleAlgs(src.c);
  const subCount = c.subcases?.length ?? 0;
  const alts = all.length - 1;
  const open = !settings.onlyFav || !!settings.expanded[c.id];
  const fullTab = subCount > 0 && (!alts || !!settings.panelFull[c.id]);
  const chosen = chosenOf(c);
  const panelId = `panel-${idPrefix}${c.id}`;
  const sub = caseSubtitle(c);
  const diagramLabel = `${ref.group.view === "f2l" ? m.diagramF2L : m.diagramLL}: ${caseTitle(c)}`;
  const tab = (full: boolean, label: string) =>
    `<button role="radio" aria-checked="${fullTab === full}" data-action="tab" data-case="${c.id}" data-value="${full ? "full" : "alts"}">${esc(label)}</button>`;
  const moreLabel = [m.more, alts > 0 && plural(alts, m.algsCount), subCount > 0 && plural(subCount, m.cases)].filter(Boolean).join(" · ");
  return `
  <article class="case${learned ? " learned" : ""}" id="${idPrefix}${c.id}">
    <div class="case-top">
      <button class="diagram-btn" data-action="play" data-case="${src.c.id}" data-alg="${esc(all[0].alg)}" data-auf="${c.id}" title="${esc(m.playFav)}" aria-label="${esc(`${m.playFav}: ${caseTitle(c)}`)}">
        ${caseDiagram(src.c.setup, ref.group.view, diagramLabel, (anchorOf(src.c) + (settings.auf[c.id] ?? 0)) % 4, cornersOnly(ref))}
      </button>
      <div class="case-meta">
        <h4>${esc(caseName(c))}</h4>
        ${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
        ${c.sameAs ? `<span class="badge" title="${esc(m.sameAsHint)}" translate="no">= ${esc(c.sameAs)}</span>` : ""}
        ${probBadge(c)}
        ${chosen && caseIndex.has(chosen) ? `<span class="badge alg-from" translate="no">${esc(m.algFrom.replace("{name}", caseName(caseIndex.get(chosen)!.c)))}</span>` : ""}
      </div>
      ${iconButton("learn", learned ? m.learned : m.markLearned, icons.check, `learn${learned ? " on" : ""}`, `data-case="${c.id}" aria-pressed="${learned}"`)}
      ${ref.group.view === "f2l" ? "" : iconButton("rotate", m.rotateCase, '<span aria-hidden="true">⟳</span>', "rotate", `data-case="${c.id}"`)}
    </div>
    <ol class="algs">${renderAlgRow(src, all[0], 0, all.length, open && alts > 0, settings.compact && !open, c.id)}</ol>
    ${
      settings.onlyFav && (alts > 0 || subCount > 0)
        ? `<button class="more" data-action="expand" data-case="${c.id}" aria-expanded="${open}" aria-controls="${panelId}">${icons.chevron}${esc(open ? m.less : moreLabel)}</button>`
        : ""
    }
    ${
      open && (alts > 0 || subCount > 0)
        ? `<div class="panel" id="${panelId}">
            ${alts > 0 && subCount > 0 ? `<div class="segmented panel-tabs" role="radiogroup" aria-label="${esc(`${m.tabAlts} / ${m.tabFull}`)}">${tab(false, m.tabAlts)}${tab(true, m.tabFull)}</div>` : ""}
            ${
              fullTab
                ? renderSubcases(ref)
                : capped(
                    (html) => `<ol class="algs alts">${html}</ol>`,
                    all.slice(1).map((a, i) => renderAlgRow(src, a, i + 1, all.length, true, false, c.id)),
                    `algs-more:${c.id}`,
                    2, // the favourite above is the list's first item
                  )
            }
          </div>`
        : ""
    }
  </article>`;
}

/* ---------- sections ---------- */

/** Heading that contains the toggle button (a button must not contain a heading). */
function collapsibleHead(
  level: "section" | "group",
  id: string,
  collapsed: boolean,
  title: string,
  extra = "",
  headingId = "",
  tag = level === "section" ? "h2" : "h3",
): string {
  return `<${tag} class="${level}-heading"${headingId ? ` id="${headingId}"` : ""}><button class="${level}-head" data-action="toggle" data-id="${id}" aria-expanded="${!collapsed}">${icons.chevron}<span class="head-title">${title}</span>${extra}</button></${tag}>`;
}

function renderTip(tip: TipSource): string {
  const text = content("tips", tip.id);
  if (!text) return "";
  return `
  <div class="tip">
    <h4>${esc(text.title)}</h4>
    <p>${esc(text.body)}</p>
    ${
      tip.algs?.length
        ? `<div class="tip-algs">${tip.algs
            .map(
              (a) =>
                `<a class="tip-alg" href="${twizzleUrl(a, "f2l", text.title)}" target="_blank" rel="noopener" title="${esc(t().ui.seeOnCube)}"><span class="alg" translate="no">${renderAlg(a)}</span>${icons.external}</a>`,
            )
            .join("")}</div>`
        : ""
    }
  </div>`;
}

function renderTips(section: SectionOut): string {
  if (!section.tips?.length) return "";
  const id = `tips:${section.id}`;
  const collapsed = isCollapsed(id, section.id !== "f2l-beginner");
  return `
  <div class="group tips">
    ${collapsibleHead("group", id, collapsed, esc(t().ui.tips), `<span class="count">${section.tips.length}</span>`)}
    ${collapsed ? "" : `<div class="tips-grid">${section.tips.map(renderTip).join("")}</div>`}
  </div>`;
}

function renderGroup(section: SectionOut, group: GroupOut): string {
  const id = `group:${group.id}`;
  const collapsed = isCollapsed(id, false);
  const text = content("groups", group.id);
  const cards = group.cases.map((c) => renderCase({ section, group, c })).join("");
  const learnedCount = group.cases.filter((c) => settings.learned[c.id]).length;
  return `
  <div class="group">
    ${collapsibleHead(
      "group",
      id,
      collapsed,
      esc(text?.title ?? group.id),
      `<span class="count">${learnedCount ? `${learnedCount}/` : ""}${group.cases.length}</span>
       ${text?.description ? `<span class="group-desc">${esc(text.description)}</span>` : ""}`,
    )}
    ${collapsed ? "" : cards.trim() ? `<div class="grid">${cards}</div>` : `<p class="empty">${esc(t().ui.allLearned)}</p>`}
  </div>`;
}

function basedOn(ids: SourceId[]): string {
  const links = ids
    .map((id) => SOURCES[id])
    .map((s) =>
      s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name),
    )
    .join(" · ");
  return `<p class="based-on"><span>${esc(t().ui.basedOn)}</span> ${links} <a class="to-sources" href="#sources" data-action="jump" data-id="section:sources">↓</a></p>`;
}

function renderSection(section: SectionOut): string {
  const id = `section:${section.id}`;
  const collapsed = isCollapsed(id, !!section.defaultCollapsed);
  const total = section.groups.reduce((n, g) => n + g.cases.length, 0);
  const text = content("sections", section.id);
  return `
  <section class="section" id="${section.id}" aria-labelledby="h-${section.id}">
    ${collapsibleHead(
      "section",
      id,
      collapsed,
      esc(text?.title ?? section.id),
      `<span class="count">${esc(plural(total, t().ui.cases))}</span>`,
      `h-${section.id}`,
    )}
    ${basedOn(section.basedOn)}
    ${
      collapsed
        ? ""
        : `<div class="section-body">
            ${text?.description ? `<p class="section-desc">${esc(text.description)}</p>` : ""}
            ${renderTips(section)}
            ${section.groups.map((g) => renderGroup(section, g)).join("")}
          </div>`
    }
  </section>`;
}

function renderSources(): string {
  const m = t().ui;
  const id = "section:sources";
  const collapsed = isCollapsed(id, false);
  const sourceCards = (Object.keys(SOURCES) as SourceId[])
    .map((sid) => {
      const s = SOURCES[sid];
      const count = algsBySource()[sid] ?? 0;
      return `
      <div class="source-card src-${sid}">
        <h3>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ${icons.external}</a>` : esc(s.name)}</h3>
        <p class="source-author">${esc(s.author)} · ${esc(plural(count, m.algCount))}</p>
        <p><b>${esc(m.sourcesUsedFor)}:</b> ${esc(content("sources", sid) ?? "")}</p>
      </div>`;
    })
    .join("");
  const tools = TOOLS.map(
    (tool) => `
    <li>
      <a href="${esc(tool.url)}" target="_blank" rel="noopener">${esc(tool.name)}</a>
      <span class="source-author">– ${esc(tool.author)}${tool.license !== "—" ? ` · ${esc(m.sourcesLicense)}: ${esc(tool.license)}` : ""}</span>
      <div>${esc(content("sources", `tool-${tool.key}`) ?? "")}</div>
    </li>`,
  ).join("");
  return `
  <section class="section sources" id="sources" aria-labelledby="h-sources">
    ${collapsibleHead("section", id, collapsed, esc(m.sourcesTitle), "", "h-sources")}
    ${
      collapsed
        ? ""
        : `<div class="section-body">
            <p class="section-desc">${esc(m.sourcesIntro)}</p>
            <div class="sources-grid">${sourceCards}</div>
            <h3 class="tools-title">${esc(m.toolsTitle)}</h3>
            <ul class="tools">${tools}</ul>
          </div>`
    }
  </section>`;
}

/* ---------- header & chrome ---------- */

function toggleBtn(action: string, label: string, on: boolean, hint: string): string {
  return `<button class="toggle${on ? " on" : ""}" data-action="${action}" aria-pressed="${on}" title="${esc(hint)}"><span class="dot" aria-hidden="true"></span>${esc(label)}</button>`;
}

function renderThemeSwitch(): string {
  const m = t().ui;
  const opts: [Settings["theme"], string][] = [
    ["system", m.themeSystem],
    ["light", m.themeLight],
    ["dark", m.themeDark],
  ];
  return `<div class="segmented" role="radiogroup" aria-label="${esc(m.theme)}">${opts
    .map(
      ([v, label]) =>
        `<button role="radio" aria-checked="${settings.theme === v}" data-action="theme" data-value="${v}">${esc(label)}</button>`,
    )
    .join("")}</div>`;
}

type Settings = typeof settings;

function renderSortSwitch(): string {
  const m = t().ui;
  const opts: [Settings["sort"], string][] = [
    ["groups", m.sortGroups],
    ["freqDesc", m.sortFreqDesc],
    ["freqAsc", m.sortFreqAsc],
  ];
  return `<div class="segmented" role="radiogroup" aria-label="${esc(m.sortLabel)}">${opts
    .map(
      ([v, label]) =>
        `<button role="radio" aria-checked="${settings.sort === v}" data-action="sort" data-value="${v}">${esc(label)}</button>`,
    )
    .join("")}</div>`;
}

function renderPathSwitch(): string {
  const m = t().ui;
  const opts: [Settings["path"], string][] = [
    ["4lll", m.path4lll],
    ["full", m.pathFull],
  ];
  return `<div class="segmented" role="radiogroup" aria-label="${esc(m.learningPath)}">${opts
    .map(
      ([v, label]) =>
        `<button role="radio" aria-checked="${settings.path === v}" data-action="path" data-value="${v}">${esc(label)}</button>`,
    )
    .join("")}</div>`;
}

function renderLanguagePicker(): string {
  const m = t().ui;
  return `<label class="lang"><span class="sr-only">${esc(m.language)}</span>
    <select data-action="locale" aria-label="${esc(m.language)}">
      ${(Object.keys(LOCALES) as Locale[])
        .map((l) => `<option value="${l}" ${l === locale() ? "selected" : ""}>${esc(LOCALES[l].meta.name)}</option>`)
        .join("")}
    </select></label>`;
}

function renderLegend(): string {
  const m = t();
  const collapsed = isCollapsed("legend", true);
  return `
  <div class="legend">
    ${collapsibleHead("group", "legend", collapsed, esc(m.ui.legend), "", "", "h2")}
    ${
      collapsed
        ? ""
        : `<div class="legend-body">
            <div class="legend-chips" translate="no">${TRIGGER_KINDS.map((k) => {
              const tr = m.triggers[k.legendKey];
              return `<span class="seg" style="--c:${k.color}"><span class="seg-label">${esc(tr.label.replace("{move}", "F"))}</span><span class="seg-moves">${esc(tr.description)}</span></span>`;
            }).join("")}</div>
            <ul class="howto">${m.ui.howto.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
            <ul class="icon-legend">${(
              [
                ["star", icons.star],
                ["updown", icons.up + icons.down],
                ["play", icons.play],
                ["rotate", '<span aria-hidden="true">⟳</span>'],
                ["learned", icons.check],
                ["db", icons.db],
                ["cube", icons.twizzle],
                ["more", icons.chevron],
                ["pin", icons.pin],
              ] as const
            )
              .map(([k, icon]) => `<li><span class="key-icon">${icon}</span> ${esc(m.ui.iconLegend[k])}</li>`)
              .join("")}</ul>
          </div>`
    }
  </div>`;
}

const app = document.querySelector<HTMLDivElement>("#app")!;

function applyChrome() {
  const root = document.documentElement;
  const dark = settings.theme === "dark" || (settings.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.density = settings.compact ? "compact" : "normal";
  setLocale(isLocale(settings.locale) ? settings.locale : detectLocale());
  document.title = `${APP_NAME} – ${t().app.tagline}`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t().app.description);
}

function render() {
  applyChrome();
  const m = t();
  // Full rebuild replaces the focused control; pin viewport to it so expand/collapse does not yank content away.
  const active = dialogCase ? null : (document.activeElement as HTMLElement | null);
  const focusedKey = active?.dataset?.focusKey;
  // Any action in a card re-orders its rows (and moves the clicked control with its row): keep the card top in place
  const card = active?.closest<HTMLElement>("article.case") ?? null;
  const anchorTop = (card ?? (focusedKey != null ? active : null))?.getBoundingClientRect().top ?? null;
  const scrollY = window.scrollY;
  app.innerHTML = `
  <a class="skip" href="#main">${esc(m.ui.sectionsNav)}</a>
  <header class="topbar">
    <div class="brand">
      <div class="logo" aria-hidden="true">${caseDiagram("", "pll", APP_NAME)}</div>
      <div>
        <h1 translate="no">${APP_NAME}</h1>
        <p>${esc(m.app.tagline)}</p>
      </div>
    </div>
    <nav class="jump" aria-label="${esc(m.ui.sectionsNav)}">
      ${visibleSections()
        .map((s) => `<a href="#${s.id}" data-action="jump" data-id="section:${s.id}">${esc((content("sections", s.id)?.title ?? s.id).split(" – ")[0])}</a>`)
        .join("")}
      <a href="#sources" data-action="jump" data-id="section:sources">${esc(m.ui.sourcesTitle)}</a>
    </nav>
    <div class="controls">
      ${toggleBtn("onlyFav", m.ui.onlyFav, settings.onlyFav, m.ui.onlyFavHint)}
      ${toggleBtn("hideSlice", m.ui.hideSlice, settings.hideSlice, m.ui.hideSliceHint)}
      ${toggleBtn("hideLearned", m.ui.hideLearned, settings.hideLearned, m.ui.hideLearnedHint)}
      ${toggleBtn("compact", m.ui.compact, settings.compact, m.ui.compactHint)}
      <span class="sep" aria-hidden="true"></span>
      ${renderPathSwitch()}
      ${renderSortSwitch()}
      ${renderThemeSwitch()}
      ${renderLanguagePicker()}
      <span class="sep" aria-hidden="true"></span>
      ${iconButton("collapseAll", m.ui.collapseAll, icons.fold)}
      ${iconButton("expandAll", m.ui.expandAll, icons.unfold)}
      ${iconButton("print", m.ui.print, icons.printer)}
    </div>
  </header>
  <main id="main">
    ${renderLegend()}
    ${visibleSections().map(renderSection).join("")}
    ${renderSources()}
  </main>
  <footer>
    <p>${esc(m.ui.footerVerified)} ${m.meta.machineTranslated ? esc(m.ui.footerMachine) : ""}</p>
    <button class="text-btn" data-action="reset">${esc(m.ui.reset)}</button>
  </footer>`;
  app.querySelectorAll<HTMLElement>("[data-action]").forEach(tagFocus);
  const focused = focusedKey
    ? app.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusedKey)}"]`)
    : null;
  const anchored = card ? document.getElementById(card.id) : focused;
  if (anchored && anchorTop != null) window.scrollBy(0, anchored.getBoundingClientRect().top - anchorTop);
  else window.scrollTo(0, scrollY);
  focused?.focus({ preventScroll: true });
  renderCaseDialog();
}

/* ---------- full case dialog (opened from a subcase item) ---------- */

const caseDialog = document.createElement("dialog");
caseDialog.className = "case-dialog";
let dialogCase: string | null = null;

/** Same card as in its full section; re-rendered with the app so favourite changes show in both places. */
function renderCaseDialog() {
  if (!dialogCase) return;
  const ref = caseIndex.get(dialogCase)!;
  const focusKey = caseDialog.contains(document.activeElement)
    ? (document.activeElement as HTMLElement).dataset.focusKey
    : undefined;
  caseDialog.setAttribute("aria-label", caseTitle(ref.c));
  caseDialog.innerHTML = `
    <button class="icon-btn dialog-close" data-close aria-label="${esc(t().ui.close)}" title="${esc(t().ui.close)}">${icons.close}</button>
    ${renderCase(ref, "dialog-case-", false)}`;
  caseDialog.querySelectorAll<HTMLElement>("[data-action]").forEach(tagFocus);
  if (focusKey)
    caseDialog.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}

function openCaseDialog(caseId: string) {
  dialogCase = caseId;
  if (!caseDialog.isConnected) document.body.appendChild(caseDialog); // attached on first use: an empty unnamed dialog fails a11y checks
  renderCaseDialog();
  caseDialog.showModal();
}

caseDialog.addEventListener("close", () => {
  dialogCase = null;
  caseDialog.replaceChildren();
});

/* ---------- interactions ---------- */

function moveAlg(caseId: string, alg: string, delta: number | "top") {
  const ref = caseIndex.get(caseId);
  if (!ref) return;
  const order = visibleAlgs(ref.c).map((a) => a.alg);
  const i = order.indexOf(alg);
  if (i < 0) return;
  order.splice(i, 1);
  const j = delta === "top" ? 0 : Math.max(0, Math.min(order.length, i + delta));
  order.splice(j, 0, alg);
  const key = settings.hideSlice ? "orderNoSlice" : "order";
  update((s) => (s[key][caseId] = order));
}

function setAll(collapsed: boolean) {
  update((s) => {
    for (const section of visibleSections()) {
      s.collapsed[`section:${section.id}`] = collapsed;
      s.collapsed[`tips:${section.id}`] = collapsed;
      for (const g of section.groups) s.collapsed[`group:${g.id}`] = collapsed;
    }
    s.collapsed["section:sources"] = collapsed;
  });
}

/** Keeps keyboard focus on the "same" control after a full re-render. */
function tagFocus(el: HTMLElement) {
  const { action, id, case: caseId, alg, value } = el.dataset;
  el.dataset.focusKey = [action, id, caseId, alg, value].filter(Boolean).join("|");
}

app.addEventListener("change", (e) => {
  const el = e.target as HTMLSelectElement;
  if (el.dataset.action === "locale" && isLocale(el.value)) {
    const value = el.value;
    update((s) => (s.locale = value));
  }
});

function onClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el || el.tagName === "SELECT") return;
  // Programmatic clicks skip focus; render pins scroll to the focused control.
  el.focus({ preventScroll: true });
  const { action, id, case: caseId, alg, value } = el.dataset;
  switch (action) {
    case "toggle": {
      const nowCollapsed = el.getAttribute("aria-expanded") === "true";
      update((s) => (s.collapsed[id!] = nowCollapsed));
      break;
    }
    case "jump":
      e.preventDefault();
      update((s) => (s.collapsed[id!] = false));
      document.getElementById(id!.replace("section:", ""))?.scrollIntoView({ behavior: "smooth" });
      break;
    case "onlyFav":
      update((s) => (s.onlyFav = !s.onlyFav));
      break;
    case "hideSlice":
      update((s) => (s.hideSlice = !s.hideSlice));
      break;
    case "hideLearned":
      update((s) => (s.hideLearned = !s.hideLearned));
      break;
    case "compact":
      update((s) => (s.compact = !s.compact));
      break;
    case "theme":
      update((s) => (s.theme = value as Settings["theme"]));
      break;
    case "path":
      update((s) => (s.path = value as Settings["path"]));
      break;
    case "sort":
      update((s) => (s.sort = value as Settings["sort"]));
      break;
    case "collapseAll":
      setAll(true);
      break;
    case "expandAll":
      setAll(false);
      break;
    case "print":
      window.print();
      break;
    case "reset":
      if (confirm(t().ui.resetConfirm)) resetSettings();
      break;
    case "fav":
      moveAlg(caseId!, alg!, "top");
      break;
    case "up":
      moveAlg(caseId!, alg!, -1);
      break;
    case "down":
      moveAlg(caseId!, alg!, 1);
      break;
    case "expand":
      update((s) => (s.expanded[caseId!] = !s.expanded[caseId!]));
      break;
    case "tab":
      update((s) => {
        if (value === "full") s.panelFull[caseId!] = true;
        else delete s.panelFull[caseId!];
      });
      break;
    case "subcase":
      openCaseDialog(caseId!);
      break;
    case "pick":
      // id = 4LLL case, case = full case ("" = its own 4LLL algs); the default is stored as no choice
      update((s) => {
        if (caseId && caseId !== caseIndex.get(id!)?.c.defaultSubcase) s.chosen[id!] = caseId;
        else delete s.chosen[id!];
        delete s.panelFull[id!];
      });
      break;
    case "learn":
      update((s) => (s.learned[caseId!] = !s.learned[caseId!]));
      break;
    case "play": {
      const ref = caseIndex.get(caseId!);
      if (!ref) break;
      const shown = shownAlg(el.dataset.auf ?? caseId!, alg!, anchorOf(ref.c));
      openPlayer({ alg: shown, view: ref.group.view, title: caseTitle(ref.c), algHtml: renderAlg(shown) });
      break;
    }
    case "rotate":
      update((s) => {
        const k = ((s.auf[caseId!] ?? 0) + 1) % 4;
        if (k) s.auf[caseId!] = k as 1 | 2 | 3;
        else delete s.auf[caseId!];
      });
      break;
  }
}

app.addEventListener("click", onClick);
caseDialog.addEventListener("click", (e) => {
  if (e.target === caseDialog || (e.target as HTMLElement).closest("[data-close]")) caseDialog.close();
  else onClick(e);
});

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (settings.theme === "system") render();
});

/** `?theme=light|dark|system&lang=pl|en|fr&density=compact|normal` – handy for links, screenshots and tests. */
function applyUrlOverrides() {
  const q = new URLSearchParams(location.search);
  const theme = q.get("theme");
  const lang = q.get("lang");
  const density = q.get("density");
  if (theme === "light" || theme === "dark" || theme === "system") settings.theme = theme;
  if (isLocale(lang)) settings.locale = lang;
  if (density) settings.compact = density === "compact";
}

applyUrlOverrides();
onChange(render);
render();
