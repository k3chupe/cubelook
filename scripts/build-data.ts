/**
 * Builds src/data/generated.json from the hand-written sources and the scraped speedcubedb data,
 * verifying every algorithm with the cube simulator. `--check` fails on any rejected hand-written alg.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { caseState, findPreAuf, invertAlg, parseAlg, applyAlg, GOAL_CHECK, type Goal, type Cube } from "../src/cube";
import type { AlgOut, CaseOut, CaseSource, GroupOut, SectionOut, SectionSource } from "../src/data/types";
import { f2lBeginner } from "../src/data/f2l-beginner";
import { fourLLL } from "../src/data/4lll";
import { f2lGroupOrder, f2lGroupTitles, f2lIntermediateBase } from "../src/data/f2l-intermediate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const errors: string[] = [];
let dropped = 0;

const tidy = (alg: string) =>
  alg
    .replace(/’/g, "'")
    .replace(/(\w)2'/g, "$12")
    .replace(/\s+/g, " ")
    .trim();

const LL_GOALS: Goal[] = ["eo", "oll", "cp", "pll"];

function findPrefix(start: Cube, alg: string, goal: Goal): string | null {
  const auf = findPreAuf(start, alg, goal);
  if (auf !== null) return auf;
  if (!LL_GOALS.includes(goal)) return null;
  for (const rot of ["y", "y2", "y'"]) {
    for (const a of ["", "U", "U2", "U'"]) {
      const pre = `${a} ${rot}`.trim();
      if (GOAL_CHECK[goal](applyAlg(start, `${pre} ${alg}`))) return pre;
    }
  }
  return null;
}

const U_AMOUNT: Record<string, number> = { "": 0, U: 1, U2: 2, "U'": 3 };
const U_NAME = ["", "U", "U2", "U'"];

/** Folds a pre-AUF into a leading U turn; otherwise shows it in parentheses. */
function withPrefix(pre: string, alg: string): string {
  if (!pre) return alg;
  const [head, ...rest] = alg.split(" ");
  if (pre in U_AMOUNT && head in U_AMOUNT) {
    const u = U_NAME[(U_AMOUNT[pre] + U_AMOUNT[head]) % 4];
    return [u, ...rest].filter(Boolean).join(" ");
  }
  return `(${pre}) ${alg}`;
}

const stripPrefix = (alg: string) => alg.replace(/^\(.*?\)\s*/, "");

/** Lower = preferred. Middle-slice and rotation-heavy algs sink to the bottom. */
function penalty(alg: string): number {
  const moves = parseAlg(alg);
  let p = 0;
  if (moves.some((m) => "MES".includes(m.face))) p += 10;
  if (moves.some((m) => "xyz".includes(m.face) && m !== moves[0])) p += 2;
  if (moves.length && "xyz".includes(moves[0].face)) p += 1;
  if (moves.some((m) => "Bb".includes(m.face))) p += 1;
  return p;
}

function verifyAlgs(
  label: string,
  start: Cube,
  goal: Goal,
  algs: (string | { alg: string; note?: string })[],
  strict: boolean,
): AlgOut[] {
  const out: AlgOut[] = [];
  const seen = new Set<string>();
  for (const raw of algs) {
    const src = typeof raw === "string" ? { alg: raw } : raw;
    const alg = tidy(src.alg);
    let pre: string | null;
    try {
      pre = findPrefix(start, alg, goal);
    } catch (e) {
      pre = null;
    }
    if (pre === null) {
      if (strict) errors.push(`${label}: "${alg}" nie rozwiązuje przypadku`);
      dropped++;
      continue;
    }
    const full = withPrefix(pre, alg);
    if (seen.has(full)) continue;
    seen.add(full);
    out.push(src.note ? { alg: full, note: src.note } : { alg: full });
  }
  return out;
}

function buildCase(c: CaseSource, goal: Goal, label: string): CaseOut {
  const first = typeof c.algs[0] === "string" ? c.algs[0] : c.algs[0].alg;
  const setup = tidy(c.setup ?? invertAlg(first));
  const start = caseState(setup);
  const algs = verifyAlgs(`${label} / ${c.name}`, start, goal, c.algs, !!c.strict);
  if (!algs.length) errors.push(`${label} / ${c.name}: brak poprawnych algorytmów`);
  return { id: c.id, name: c.name, subtitle: c.subtitle, setup, algs };
}

function buildSection(s: SectionSource): SectionOut {
  return {
    ...s,
    groups: s.groups.map(
      (g): GroupOut => ({
        id: g.id,
        title: g.title,
        description: g.description,
        goal: g.goal,
        view: g.view,
        cases: g.cases.map((c) => buildCase(c, g.goal, s.title)),
      }),
    ),
  };
}

interface Scraped {
  name: string;
  sub: string;
  setup: string | null;
  algs: string[];
}

function buildIntermediate(): SectionOut {
  const raw: Scraped[] = JSON.parse(readFileSync(join(root, "scripts/raw/speedcubedb-f2l.json"), "utf8"));
  const groups: GroupOut[] = f2lGroupOrder.map((sub) => ({
    id: `f2l-${sub.toLowerCase().replace(/\s+/g, "-")}`,
    title: f2lGroupTitles[sub].title,
    description: f2lGroupTitles[sub].description,
    goal: "f2l",
    view: "f2l",
    cases: [],
  }));
  for (const r of raw) {
    const setup = tidy(r.setup ?? invertAlg(r.algs[0]));
    const start = caseState(setup);
    const algs = verifyAlgs(r.name, start, "f2l", r.algs, false)
      .map((a, i) => ({ a, i }))
      .sort((x, y) => penalty(x.a.alg) - penalty(y.a.alg) || x.i - y.i)
      .map((x) => x.a)
      .slice(0, 6);
    if (!algs.length) errors.push(`${r.name}: brak poprawnych algorytmów`);
    const num = r.name.replace("F2L ", "");
    groups[f2lGroupOrder.indexOf(r.sub)].cases.push({
      id: `f2l-${num}`,
      name: `F2L ${num}`,
      setup,
      algs,
    });
  }
  return { ...f2lIntermediateBase, groups };
}

const intermediate = buildIntermediate();
const lll = buildSection(fourLLL);
const numbered = intermediate.groups.flatMap((g) => g.cases);

/**
 * Beginner algs may lift the back-right slot ("hiding" trick), so their inverse is not a clean case.
 * Instead, find the numbered F2L case they solve (with BR treated as empty) and use its position.
 */
function buildBeginner(s: SectionSource): SectionOut {
  const groups = s.groups.map((g): GroupOut => {
    const cases = g.cases.map((c): CaseOut => {
      const first = stripPrefix(tidy(typeof c.algs[0] === "string" ? c.algs[0] : c.algs[0].alg));
      const candidates = c.expect ? numbered.filter((n) => n.name === c.expect) : numbered;
      let match: CaseOut | undefined;
      for (const wanted of ["", "U", "U2", "U'"]) {
        match = candidates.find((n) => findPreAuf(caseState(n.setup), first, "f2l-free-br") === wanted);
        if (match) break;
      }
      if (!match) {
        errors.push(`${c.name} (${c.subtitle}): "${first}" nie rozwiązuje ${c.expect ?? "żadnego z 41 przypadków"}`);
        return buildCase(c, "f2l-free-br", s.title);
      }
      const start = caseState(match.setup);
      const own = verifyAlgs(`${s.title} / ${c.name}`, start, "f2l-free-br", c.algs, !!c.strict);
      const extra = verifyAlgs(c.name, start, "f2l", match.algs.map((a) => stripPrefix(a.alg)), false);
      const algs = [...own];
      for (const e of extra) if (!algs.some((a) => a.alg === e.alg) && algs.length < 5) algs.push(e);
      return { id: c.id, name: c.name, subtitle: c.subtitle, setup: match.setup, algs, sameAs: match.name };
    });
    return { id: g.id, title: g.title, description: g.description, goal: g.goal, view: g.view, cases };
  });
  return { ...s, groups };
}

const beginner = buildBeginner(f2lBeginner);

const sections = [beginner, intermediate, lll];
const total = sections.flatMap((s) => s.groups.flatMap((g) => g.cases.flatMap((c) => c.algs))).length;

writeFileSync(join(root, "src/data/generated.json"), JSON.stringify(sections, null, 1) + "\n");
console.log(`Zapisano ${total} algorytmów (odrzucono ${dropped} niepasujących alternatyw).`);
for (const e of errors) console.error("BŁĄD:", e);
if (check && errors.length) process.exit(1);
