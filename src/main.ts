import "./style.css";
import data from "./data/generated.json";
import type { AlgOut, CaseOut, GroupOut, SectionOut, Tip } from "./data/types";
import { caseDiagram } from "./diagram";
import { icons } from "./icons";
import { algCubingNetUrl, twizzleUrl } from "./links";
import { onChange, orderedAlgs, resetSettings, settings, update } from "./store";
import { segmentAlg, TRIGGER_KINDS, usesSlice, isTwoGen, isRotation } from "./triggers";
import { openPlayer } from "./player";

const sections = data as unknown as SectionOut[];

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

function isCollapsed(id: string, fallback: boolean): boolean {
  return settings.collapsed[id] ?? fallback;
}

function renderAlg(alg: string): string {
  return segmentAlg(alg)
    .map((seg) => {
      const moves = seg.moves
        .map((m) => `<span class="mv${isRotation(m) ? " rot" : ""}">${esc(m)}</span>`)
        .join(" ");
      if (!seg.kind) return `<span class="seg plain"><span class="seg-label"></span><span class="seg-moves">${moves}</span></span>`;
      return `<span class="seg" style="--c:${seg.kind.color}"><span class="seg-label">${esc(seg.label ?? "")}</span><span class="seg-moves">${moves}</span></span>`;
    })
    .join("");
}

function algTags(alg: string): string {
  const tags: string[] = [];
  if (isTwoGen(alg)) tags.push(`<span class="tag tag-ru">tylko R U</span>`);
  if (usesSlice(alg)) tags.push(`<span class="tag tag-m">M/S</span>`);
  if (/(^|\s)[xyz]/.test(alg.replace(/^\(.*?\)/, ""))) tags.push(`<span class="tag">obrót</span>`);
  return tags.join("");
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

function renderAlgRow(ref: CaseRef, a: AlgOut, index: number, count: number, showReorder: boolean): string {
  const title = `${ref.c.name}${ref.c.subtitle ? ` – ${ref.c.subtitle}` : ""}`;
  const fav = index === 0;
  return `
  <li class="alg-row${fav ? " is-fav" : ""}">
    <div class="alg-main">
      <div class="alg" aria-label="${esc(a.alg)}">${renderAlg(a.alg)}</div>
      ${a.note ? `<div class="alg-note">${esc(a.note)}</div>` : ""}
    </div>
    <div class="alg-actions">
      <span class="tags">${algTags(a.alg)}</span>
      <button class="icon-btn star${fav ? " on" : ""}" data-action="fav" data-case="${ref.c.id}" data-alg="${esc(a.alg)}" title="${fav ? "Twój ulubiony" : "Ustaw jako ulubiony"}" aria-pressed="${fav}">${icons.star}</button>
      ${
        showReorder
          ? `<button class="icon-btn" data-action="up" data-case="${ref.c.id}" data-alg="${esc(a.alg)}" title="W górę" ${index === 0 ? "disabled" : ""}>${icons.up}</button>
             <button class="icon-btn" data-action="down" data-case="${ref.c.id}" data-alg="${esc(a.alg)}" title="W dół" ${index === count - 1 ? "disabled" : ""}>${icons.down}</button>`
          : ""
      }
      <button class="icon-btn play" data-action="play" data-case="${ref.c.id}" data-alg="${esc(a.alg)}" title="Animacja tutaj">${icons.play}</button>
      <a class="link-btn" href="${algCubingNetUrl(a.alg, title)}" target="_blank" rel="noopener" title="Otwórz na wirtualnej kostce (alg.cubing.net)">kostka ${icons.external}</a>
      <a class="link-btn alt" href="${twizzleUrl(a.alg, ref.group.view, title)}" target="_blank" rel="noopener" title="Otwórz w Twizzle">Twizzle</a>
    </div>
  </li>`;
}

function renderCase(ref: CaseRef): string {
  const { c } = ref;
  const learned = !!settings.learned[c.id];
  if (learned && settings.hideLearned) return "";
  const { list, hidden, all } = visibleAlgs(c);
  const expanded = !settings.onlyFav || !!settings.expanded[c.id];
  return `
  <article class="case${learned ? " learned" : ""}" id="case-${c.id}">
    <div class="case-top">
      <button class="diagram-btn" data-action="play" data-case="${c.id}" data-alg="${esc(all[0].alg)}" title="Odtwórz ulubiony algorytm">
        ${caseDiagram(c.setup, ref.group.view)}
      </button>
      <div class="case-meta">
        <h4>${esc(c.name)}</h4>
        ${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ""}
        ${c.sameAs ? `<span class="badge" title="Ten sam przypadek w sekcji średniozaawansowanej">= ${esc(c.sameAs)}</span>` : ""}
      </div>
      <button class="icon-btn learn${learned ? " on" : ""}" data-action="learn" data-case="${c.id}" title="${learned ? "Oznaczone jako opanowane" : "Oznacz jako opanowane"}" aria-pressed="${learned}">${icons.check}</button>
    </div>
    <ol class="algs">${list.map((a, i) => renderAlgRow(ref, a, i, list.length, expanded && list.length > 1)).join("")}</ol>
    ${
      settings.onlyFav && all.length > 1
        ? `<button class="more" data-action="expand" data-case="${c.id}">${
            expanded ? "Pokaż tylko ulubiony" : `+${hidden} ${hidden === 1 ? "alternatywa" : hidden < 5 ? "alternatywy" : "alternatyw"} – wybierz ulubiony`
          }</button>`
        : ""
    }
  </article>`;
}

function renderTips(section: SectionOut): string {
  if (!section.tips?.length) return "";
  const id = `tips:${section.id}`;
  const collapsed = isCollapsed(id, section.id !== "f2l-beginner");
  return `
  <div class="group tips">
    <button class="group-head" data-action="toggle" data-id="${id}" aria-expanded="${!collapsed}">
      ${icons.chevron}<h3>Wskazówki i triki</h3><span class="count">${section.tips.length}</span>
    </button>
    ${
      collapsed
        ? ""
        : `<div class="tips-grid">${section.tips.map((t) => renderTip(t)).join("")}</div>`
    }
  </div>`;
}

function renderTip(t: Tip): string {
  return `
  <div class="tip">
    <h5>${esc(t.title)}</h5>
    <p>${esc(t.body)}</p>
    ${
      t.algs?.length
        ? `<div class="tip-algs">${t.algs
            .map(
              (a) =>
                `<a class="tip-alg" href="${algCubingNetUrl(a, t.title)}" target="_blank" rel="noopener" title="Zobacz na wirtualnej kostce"><span class="alg">${renderAlg(a)}</span>${icons.external}</a>`,
            )
            .join("")}</div>`
        : ""
    }
  </div>`;
}

function renderGroup(section: SectionOut, group: GroupOut): string {
  const id = `group:${group.id}`;
  const collapsed = isCollapsed(id, false);
  const cards = group.cases.map((c) => renderCase({ section, group, c })).join("");
  const learnedCount = group.cases.filter((c) => settings.learned[c.id]).length;
  return `
  <div class="group">
    <button class="group-head" data-action="toggle" data-id="${id}" aria-expanded="${!collapsed}">
      ${icons.chevron}<h3>${esc(group.title)}</h3>
      <span class="count">${learnedCount ? `${learnedCount}/` : ""}${group.cases.length}</span>
      ${group.description ? `<span class="group-desc">${esc(group.description)}</span>` : ""}
    </button>
    ${
      collapsed
        ? ""
        : cards.trim()
          ? `<div class="grid">${cards}</div>`
          : `<p class="empty">Wszystkie przypadki w tej grupie są opanowane. Wyłącz „Ukryj opanowane”, żeby je zobaczyć.</p>`
    }
  </div>`;
}

function renderSection(section: SectionOut): string {
  const id = `section:${section.id}`;
  const collapsed = isCollapsed(id, !!section.defaultCollapsed);
  const total = section.groups.reduce((n, g) => n + g.cases.length, 0);
  return `
  <section class="section" id="${section.id}">
    <button class="section-head" data-action="toggle" data-id="${id}" aria-expanded="${!collapsed}">
      ${icons.chevron}
      <h2>${esc(section.title)}</h2>
      <span class="count">${total} przypadków</span>
    </button>
    ${
      collapsed
        ? ""
        : `<div class="section-body">
            <p class="section-desc">${esc(section.description)}</p>
            ${renderTips(section)}
            ${section.groups.map((g) => renderGroup(section, g)).join("")}
          </div>`
    }
  </section>`;
}

function toggleBtn(action: string, label: string, on: boolean, hint: string): string {
  return `<button class="toggle${on ? " on" : ""}" data-action="${action}" aria-pressed="${on}" title="${esc(hint)}"><span class="dot"></span>${esc(label)}</button>`;
}

function renderLegend(): string {
  const collapsed = isCollapsed("legend", true);
  return `
  <div class="legend">
    <button class="group-head" data-action="toggle" data-id="legend" aria-expanded="${!collapsed}">
      ${icons.chevron}<h3>Legenda kolorów i jak używać</h3>
    </button>
    ${
      collapsed
        ? ""
        : `<div class="legend-body">
            <div class="legend-chips">${TRIGGER_KINDS.map(
              (k) => `<span class="seg" style="--c:${k.color}"><span class="seg-label">${esc(k.label)}</span><span class="seg-moves">${esc(k.description)}</span></span>`,
            ).join("")}</div>
            <ul class="howto">
              <li><b>★</b> ustawia algorytm jako ulubiony – przy „Tylko ulubiony” widzisz tylko jego.</li>
              <li><b>+N alternatyw</b> rozwija pozostałe algorytmy danego przypadku; strzałkami zmieniasz kolejność.</li>
              <li><b>▶</b> albo klik w obrazek odtwarza animację tutaj, <b>kostka</b> otwiera alg.cubing.net, <b>Twizzle</b> – edytor cubing.net.</li>
              <li><b>✓</b> oznacza przypadek jako opanowany. Wszystko zapisuje się w tej przeglądarce.</li>
              <li>Trzymanie kostki: żółty na górze, zielony z przodu, biały krzyż na dole. Slot F2L zawsze z przodu po prawej.</li>
            </ul>
          </div>`
    }
  </div>`;
}

const app = document.querySelector<HTMLDivElement>("#app")!;

function render() {
  const scrollY = window.scrollY;
  app.innerHTML = `
  <header class="topbar">
    <div class="brand">
      <div class="logo" aria-hidden="true">${caseDiagram("", "pll")}</div>
      <div>
        <h1>Ściąga: F2L + 4LLL</h1>
        <p>Beginner F2L (5 przypadków) · F2L średniozaawansowane · 4-look last layer</p>
      </div>
    </div>
    <nav class="jump" aria-label="Sekcje">
      ${sections.map((s) => `<a href="#${s.id}" data-action="jump" data-id="section:${s.id}">${esc(s.title.split(" – ")[0])}</a>`).join("")}
    </nav>
    <div class="controls">
      ${toggleBtn("onlyFav", "Tylko ulubiony", settings.onlyFav, "Pokazuj jeden (ulubiony) algorytm na przypadek")}
      ${toggleBtn("hideSlice", "Bez M/S", settings.hideSlice, "Ukryj algorytmy z ruchami środka (M, S, E)")}
      ${toggleBtn("hideLearned", "Ukryj opanowane", settings.hideLearned, "Ukryj przypadki oznaczone ✓")}
      <span class="sep"></span>
      <button class="icon-btn" data-action="collapseAll" title="Zwiń wszystko">${icons.fold}</button>
      <button class="icon-btn" data-action="expandAll" title="Rozwiń wszystko">${icons.unfold}</button>
      <button class="icon-btn" data-action="print" title="Drukuj / zapisz jako PDF">${icons.printer}</button>
    </div>
  </header>
  <main>
    ${renderLegend()}
    ${sections.map(renderSection).join("")}
  </main>
  <footer>
    Algorytmy: <a href="https://speedcubedb.com/a/3x3/F2L" target="_blank" rel="noopener">speedcubedb.com</a>,
    <a href="https://cubingcheatsheet.com/algs3x_4lll.html" target="_blank" rel="noopener">cubingcheatsheet.com</a>,
    <a href="https://www.reddit.com/r/Cubers/comments/boukt3/" target="_blank" rel="noopener">r/Cubers</a>.
    F2L dla początkujących wg <a href="https://www.youtube.com/watch?v=Hx9ZbPdX8zM" target="_blank" rel="noopener">ParadoxCubing</a>.
    Każdy algorytm sprawdzony symulatorem kostki.
    <button class="text-btn" data-action="reset">Przywróć ustawienia domyślne</button>
  </footer>`;
  window.scrollTo(0, scrollY);
}

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
  });
}

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el) return;
  const { action, id, case: caseId, alg } = el.dataset;
  switch (action) {
    case "toggle": {
      const btn = el as HTMLButtonElement;
      const nowCollapsed = btn.getAttribute("aria-expanded") === "true";
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
      if (confirm("Przywrócić domyślne ulubione, kolejność i zwinięcia?")) resetSettings();
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
      if (ref) openPlayer({ alg: alg!, view: ref.group.view, title: `${ref.c.name}${ref.c.subtitle ? ` – ${ref.c.subtitle}` : ""}`, algHtml: renderAlg(alg!) });
      break;
    }
  }
});

onChange(render);
render();
