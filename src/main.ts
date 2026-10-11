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
import { caseDiagram } from "./diagram";
import { icons } from "./icons";
import { algCubingNetUrl, twizzleUrl } from "./links";
import { onChange, orderedAlgs, resetSettings, settings, update } from "./store";
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

const algsBySource = sections
  .flatMap((s) => s.groups.flatMap((g) => g.cases.flatMap((c) => c.algs)))
  .reduce<Record<string, number>>((acc, a) => ((acc[a.source] = (acc[a.source] ?? 0) + 1), acc), {});

const caseName = (c: CaseOut) => content("cases", c.id)?.name ?? c.name;
const caseSubtitle = (c: CaseOut) => content("cases", c.id)?.subtitle;
const caseTitle = (c: CaseOut) => [caseName(c), caseSubtitle(c)].filter(Boolean).join(" – ");

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

function algTags(alg: string): string {
  const m = t().ui;
  const tags: string[] = [];
  if (isTwoGen(alg)) tags.push(`<span class="tag tag-ru">${esc(m.tagRU)}</span>`);
  if (usesSlice(alg)) tags.push(`<span class="tag tag-m">${esc(m.tagSlice)}</span>`);
  if (hasRotation(alg)) tags.push(`<span class="tag">${esc(m.tagRotation)}</span>`);
  return tags.join("");
}

function sourceChip(a: AlgOut): string {
  const s = SOURCES[a.source];
  const label = `${t().ui.source}: ${s.short}`;
  return a.sourceUrl
    ? `<a class="src src-${s.id}" href="${esc(a.sourceUrl)}" target="_blank" rel="noopener" title="${esc(label)}">${esc(s.short)}</a>`
    : `<span class="src src-${s.id}" title="${esc(label)}">${esc(s.short)}</span>`;
}

function visibleAlgs(c: CaseOut): { list: AlgOut[]; hidden: number; all: AlgOut[] } {
  let all = orderedAlgs(c.id, c.algs);
  if (settings.hideSlice) {
    const noSlice = all.filter((a) => !usesSlice(a.alg));
    if (noSlice.length) all = noSlice;
  }
  const showAll = !settings.onlyFav || settings.expanded[c.id];
  const list = showAll ? all : all.slice(0, 1);
  return { list, hidden: all.length - list.length, all };
}

function iconButton(action: string, label: string, icon: string, extra = "", attrs = ""): string {
  return `<button class="icon-btn ${extra}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${attrs}>${icon}</button>`;
}

function renderAlgRow(ref: CaseRef, a: AlgOut, index: number, count: number, showReorder: boolean): string {
  const m = t().ui;
  const title = caseTitle(ref.c);
  const fav = index === 0;
  const data = `data-case="${ref.c.id}" data-alg="${esc(a.alg)}"`;
  const note = a.note ? content("notes", a.note) : undefined;
  return `
  <li class="alg-row${fav ? " is-fav" : ""}">
    <div class="alg" translate="no" aria-label="${esc(a.alg)}">${renderAlg(a.alg)}</div>
    ${note ? `<div class="alg-note">${esc(note)}</div>` : ""}
    <div class="alg-actions">
      <span class="tags">${algTags(a.alg)}${sourceChip(a)}</span>
      ${iconButton("fav", fav ? m.fav : m.setFav, icons.star, `star${fav ? " on" : ""}`, `${data} aria-pressed="${fav}"`)}
      ${
        showReorder
          ? iconButton("up", m.moveUp, icons.up, "", `${data} ${index === 0 ? "disabled" : ""}`) +
            iconButton("down", m.moveDown, icons.down, "", `${data} ${index === count - 1 ? "disabled" : ""}`)
          : ""
      }
      ${iconButton("play", m.playHere, icons.play, "play", data)}
      <a class="link-btn" href="${twizzleUrl(a.alg, ref.group.view, title)}" target="_blank" rel="noopener" title="${esc(m.openCubeHint)}">${esc(m.openCube)} ${icons.external}</a>
      <a class="link-btn alt" href="${algCubingNetUrl(a.alg, title)}" target="_blank" rel="noopener">${esc(m.openTwizzle)}</a>
    </div>
  </li>`;
}

function renderCase(ref: CaseRef): string {
  const m = t().ui;
  const { c } = ref;
  const learned = !!settings.learned[c.id];
  if (learned && settings.hideLearned) return "";
  const { list, hidden, all } = visibleAlgs(c);
  const expanded = !settings.onlyFav || !!settings.expanded[c.id];
  const sub = caseSubtitle(c);
  const diagramLabel = `${ref.group.view === "f2l" ? m.diagramF2L : m.diagramLL}: ${caseTitle(c)}`;
  return `
  <article class="case${learned ? " learned" : ""}" id="case-${c.id}">
    <div class="case-top">
      <button class="diagram-btn" data-action="play" data-case="${c.id}" data-alg="${esc(all[0].alg)}" title="${esc(m.playFav)}" aria-label="${esc(`${m.playFav}: ${caseTitle(c)}`)}">
        ${caseDiagram(c.setup, ref.group.view, diagramLabel)}
      </button>
      <div class="case-meta">
        <h4>${esc(caseName(c))}</h4>
        ${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
        ${c.sameAs ? `<span class="badge" title="${esc(m.sameAsHint)}" translate="no">= ${esc(c.sameAs)}</span>` : ""}
      </div>
      ${iconButton("learn", learned ? m.learned : m.markLearned, icons.check, `learn${learned ? " on" : ""}`, `data-case="${c.id}" aria-pressed="${learned}"`)}
    </div>
    <ol class="algs">${list.map((a, i) => renderAlgRow(ref, a, i, list.length, expanded && list.length > 1)).join("")}</ol>
    ${
      settings.onlyFav && all.length > 1
        ? `<button class="more" data-action="expand" data-case="${c.id}" aria-expanded="${expanded}">${
            expanded ? esc(m.showOnlyFav) : `${esc(plural(hidden, m.alternatives))} – ${esc(m.chooseFav)}`
          }</button>`
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
      const count = algsBySource[sid] ?? 0;
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
  const scrollY = window.scrollY;
  const focusedKey = (document.activeElement as HTMLElement | null)?.dataset?.focusKey;
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
      ${sections
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
    ${sections.map(renderSection).join("")}
    ${renderSources()}
  </main>
  <footer>
    <p>${esc(m.ui.footerVerified)} ${m.meta.machineTranslated ? esc(m.ui.footerMachine) : ""}</p>
    <button class="text-btn" data-action="reset">${esc(m.ui.reset)}</button>
  </footer>`;
  window.scrollTo(0, scrollY);
  app.querySelectorAll<HTMLElement>("[data-action]").forEach(tagFocus);
  if (focusedKey) app.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusedKey)}"]`)?.focus();
}

/* ---------- interactions ---------- */

function moveAlg(caseId: string, alg: string, delta: number | "top") {
  const ref = caseIndex.get(caseId);
  if (!ref) return;
  const order = orderedAlgs(caseId, ref.c.algs).map((a) => a.alg);
  const i = order.indexOf(alg);
  if (i < 0) return;
  order.splice(i, 1);
  const j = delta === "top" ? 0 : Math.max(0, Math.min(order.length, i + delta));
  order.splice(j, 0, alg);
  update((s) => (s.order[caseId] = order));
}

function setAll(collapsed: boolean) {
  update((s) => {
    for (const section of sections) {
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

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el || el.tagName === "SELECT") return;
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
    case "learn":
      update((s) => (s.learned[caseId!] = !s.learned[caseId!]));
      break;
    case "play": {
      const ref = caseIndex.get(caseId!);
      if (ref) openPlayer({ alg: alg!, view: ref.group.view, title: caseTitle(ref.c), algHtml: renderAlg(alg!) });
      break;
    }
  }
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
