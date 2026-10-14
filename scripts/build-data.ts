/**
 * Builds src/data/generated.json from the hand-written sources and the scraped SpeedCubeDB data,
 * verifying every algorithm with the cube simulator and attributing each one to its source.
 * `--check` writes nothing; it fails on any rejected hand-written alg or if generated.json is stale.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { caseState, findPreAuf, invertAlg, parseAlg, applyAlg, GOAL_CHECK, type Goal, type Cube } from "../src/cube";
import type { AlgOut, AlgSource, CaseOut, CaseSource, GroupOut, SectionOut, SectionSource } from "../src/data/types";
import { SOURCES, speedcubedbCaseUrl, type SourceId } from "../src/data/sources";
import { f2lBeginner } from "../src/data/f2l-beginner";
import { fourLLL } from "../src/data/4lll";
import { f2lGroupIds, f2lGroupOrder, f2lIntermediateBase } from "../src/data/f2l-intermediate";

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

/** Comparable form: no parentheses, no leading/trailing whole-cube rotations. */
const comparable = (alg: string) => {
  const t = tidy(alg.replace(/[()]/g, " ")).split(" ").filter(Boolean);
  while (t.length && /^[xyz]/.test(t[0])) t.shift();
  while (t.length && /^[xyz]/.test(t[t.length - 1])) t.pop();
  return t.join(" ");
};

interface Scraped {
  name: string;
  sub: string;
  setup: string | null;
  algs: string[];
}
const readRaw = (f: string): Scraped[] => JSON.parse(readFileSync(join(root, "scripts/raw", f), "utf8"));

const scdb: Record<"OLL" | "PLL", Map<string, Set<string>>> = { OLL: new Map(), PLL: new Map() };
for (const r of [...readRaw("speedcubedb-oll.json"), ...readRaw("speedcubedb-2look-oll.json")])
  scdb.OLL.set(r.name, new Set([...(scdb.OLL.get(r.name) ?? []), ...r.algs.map(comparable)]));
for (const r of readRaw("speedcubedb-pll.json")) scdb.PLL.set(r.name, new Set(r.algs.map(comparable)));
// SpeedCubeDB's first alg per OLL/PLL case (names are unique across the files).
const scdbFirst = new Map<string, string>();
for (const r of [...readRaw("speedcubedb-oll.json"), ...readRaw("speedcubedb-2look-oll.json"), ...readRaw("speedcubedb-pll.json")])
  if (!scdbFirst.has(r.name)) scdbFirst.set(r.name, r.algs[0]);

// Algorithms as printed on cubingcheatsheet.com/algs3x_4lll.html and in the r/Cubers thread.
const CHEATSHEET = new Set(
  [
    "F R U R' U' F'", "f R U R' U' f'", "R U2 R2 F R F' U2 R' F R F'", "R U R' U R U2 R'", "L' U' L U' L' U2 L",
    "F R U R' U' R U R' U' R U R' U' F'", "R U2 R2 U' R2 U' R2 U2 R", "R2 D R' U2 R D' R' U2 R'",
    "r U R' U' r' F R F'", "F' r U R' U' r' F R", "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    "M2 U M U2 M' U M2", "M2 U' M U2 M' U' M2", "M2 U' M2 U' M' U2 M2 U2 M'", "M2 U M2 U2 M2 U M2",
  ].map(comparable),
);
const REDDIT = new Set(
  [
    "R U2 R' U' R U' R'", "R' U' R U' R' U2 R", "x R' U R' D2 R U' R' D2 R2", "R' U' R U' R' U R U' R' U2 R",
    "R U2 R' U' R U R' U' R U' R'", "M' U M2 U M2 U M' U2 M2", "f R U R' U' f' F R U R' U' F'",
  ].map(comparable),
);

interface Attribution {
  source: SourceId;
  sourceUrl?: string;
}

/** Explicit source → r/Cubers → Cubing Cheat Sheet → SpeedCubeDB → fallback. */
function attribute(alg: string, c: Pick<CaseSource, "ref" | "source">, explicit?: SourceId): Attribution {
  const key = comparable(alg);
  const url = (id: SourceId) => SOURCES[id].url;
  if (explicit) return { source: explicit, sourceUrl: url(explicit) };
  if (REDDIT.has(key)) return { source: "reddit", sourceUrl: url("reddit") };
  if (CHEATSHEET.has(key)) return { source: "cubingcheatsheet", sourceUrl: url("cubingcheatsheet") };
  if (c.ref && scdb[c.ref.set].get(c.ref.name)?.has(key))
    return { source: "speedcubedb", sourceUrl: speedcubedbCaseUrl(c.ref.set, c.ref.name) };
  for (const set of ["PLL", "OLL"] as const)
    for (const [name, algs] of scdb[set])
      if (algs.has(key)) return { source: "speedcubedb", sourceUrl: speedcubedbCaseUrl(set, name) };
  const fallback = c.source ?? "community";
  return { source: fallback, sourceUrl: url(fallback) };
}

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
  if (moves.slice(1).some((m) => "xyz".includes(m.face))) p += 2;
  if (moves.length && "xyz".includes(moves[0].face)) p += 1;
  if (moves.some((m) => "Bb".includes(m.face))) p += 1;
  return p;
}

function verifyAlgs(
  label: string,
  start: Cube,
  goal: Goal,
  algs: (string | AlgSource)[],
  strict: boolean,
  attr: (alg: string, explicit?: SourceId) => Attribution,
): AlgOut[] {
  const out: AlgOut[] = [];
  const seen = new Set<string>();
  for (const raw of algs) {
    const src: AlgSource = typeof raw === "string" ? { alg: raw } : raw;
    const alg = tidy(src.alg);
    let pre: string | null;
    try {
      pre = findPrefix(start, alg, goal);
    } catch {
      pre = null;
    }
    if (pre === null) {
      if (strict) errors.push(`${label}: "${alg}" does not solve the case`);
      dropped++;
      continue;
    }
    const full = withPrefix(pre, alg);
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ alg: full, ...(src.note ? { note: src.note } : {}), ...attr(alg, src.source) });
  }
  return out;
}

/** Puts SpeedCubeDB's first alg at index 0; an equal alg already in the list is moved, keeping its note. */
function recommend(algs: AlgOut[], first: AlgOut | undefined): AlgOut[] {
  if (!first) return algs;
  const item = algs.find((a) => a.alg === first.alg) ?? first;
  return [{ ...item, recommended: true }, ...algs.filter((a) => a.alg !== first.alg)];
}

function buildCase(c: CaseSource, goal: Goal, sectionId: string): CaseOut {
  const first = typeof c.algs[0] === "string" ? c.algs[0] : c.algs[0].alg;
  const setup = tidy(c.setup ?? invertAlg(first));
  const start = caseState(setup);
  const algs = verifyAlgs(`${sectionId}/${c.id}`, start, goal, c.algs, !!c.strict, (a, e) => attribute(a, c, e));
  if (!algs.length) errors.push(`${sectionId}/${c.id}: no valid algorithms`);
  return { id: c.id, name: c.ref?.name ?? c.id, setup, algs };
}

function buildSection(s: SectionSource): SectionOut {
  return {
    ...s,
    groups: s.groups.map(
      (g): GroupOut => ({
        id: g.id,
        goal: g.goal,
        view: g.view,
        cases: g.cases.map((c) => {
          const out = buildCase(c, g.goal, s.id);
          const scdbAlg = c.ref && scdbFirst.get(c.ref.name);
          const [first] = scdbAlg ? verifyAlgs(`${s.id}/${c.id}`, caseState(out.setup), g.goal, [scdbAlg], false, (a) => attribute(a, c)) : [];
          return { ...out, algs: recommend(out.algs, first) };
        }),
      }),
    ),
  };
}

function buildIntermediate(): SectionOut {
  const raw = readRaw("speedcubedb-f2l.json");
  const groups: GroupOut[] = f2lGroupOrder.map((sub) => ({ id: f2lGroupIds[sub], goal: "f2l", view: "f2l", cases: [] }));
  for (const r of raw) {
    const setup = tidy(r.setup ?? invertAlg(r.algs[0]));
    const start = caseState(setup);
    const sourceUrl = speedcubedbCaseUrl("F2L", r.name);
    const fromScdb = () => ({ source: "speedcubedb" as const, sourceUrl });
    const [first] = verifyAlgs(r.name, start, "f2l", r.algs.slice(0, 1), false, fromScdb);
    const rest = verifyAlgs(r.name, start, "f2l", r.algs.slice(1), false, fromScdb)
      .map((a, i) => ({ a, i }))
      .sort((x, y) => penalty(x.a.alg) - penalty(y.a.alg) || x.i - y.i)
      .map((x) => x.a);
    const algs = recommend(rest, first).slice(0, 6);
    if (!algs.length) errors.push(`${r.name}: no valid algorithms`);
    const num = r.name.replace("F2L ", "");
    groups[f2lGroupOrder.indexOf(r.sub)].cases.push({ id: `f2l-${num}`, name: `F2L ${num}`, setup, algs });
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
        errors.push(`${c.id}: "${first}" does not solve ${c.expect ?? "any of the 41 F2L cases"}`);
        return buildCase(c, "f2l-free-br", s.id);
      }
      const start = caseState(match.setup);
      const own = verifyAlgs(`${s.id}/${c.id}`, start, "f2l-free-br", c.algs, !!c.strict, (a, e) =>
        attribute(a, c, e ?? c.source),
      );
      const scdbUrl = speedcubedbCaseUrl("F2L", match.name);
      const extra = verifyAlgs(c.id, start, "f2l", match.algs.map((a) => stripPrefix(a.alg)), false, () => ({
        source: "speedcubedb",
        sourceUrl: scdbUrl,
      }));
      const [scdbFirstAlg] = verifyAlgs(c.id, start, "f2l", match.algs.filter((a) => a.recommended).map((a) => stripPrefix(a.alg)), false, () => ({
        source: "speedcubedb",
        sourceUrl: scdbUrl,
      }));
      const algs = [...own];
      for (const e of extra) if (!algs.some((a) => a.alg === e.alg) && algs.length < 5) algs.push(e);
      return { id: c.id, name: c.id, setup: match.setup, algs: recommend(algs, scdbFirstAlg), sameAs: match.name };
    });
    return { id: g.id, goal: g.goal, view: g.view, cases };
  });
  return { ...s, groups };
}

const beginner = buildBeginner(f2lBeginner);

const sections = [beginner, intermediate, lll];
const all = sections.flatMap((s) => s.groups.flatMap((g) => g.cases.flatMap((c) => c.algs)));
const bySource = all.reduce<Record<string, number>>((acc, a) => ((acc[a.source] = (acc[a.source] ?? 0) + 1), acc), {});

const json = JSON.stringify(sections, null, 1) + "\n";
const outFile = join(root, "src/data/generated.json");
const stale = check && readFileSync(outFile, "utf8") !== json;
if (!check) writeFileSync(outFile, json);
console.log(`${check ? "Checked" : "Wrote"} ${all.length} algorithms (dropped ${dropped} non-matching alternatives).`, bySource);
for (const e of errors) console.error("ERROR:", e);
if (stale) console.error("ERROR: src/data/generated.json is out of date; run npm run data");
if (check && (stale || errors.length)) process.exit(1);
