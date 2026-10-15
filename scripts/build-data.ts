/**
 * Builds src/data/generated.json from the hand-written sources and the scraped SpeedCubeDB data,
 * verifying every algorithm with the cube simulator and attributing each one to its source.
 * `--check` writes nothing; it fails on any rejected hand-written alg or if generated.json is stale.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  caseState, findPreAuf, invertAlg, parseAlg, applyAlg, GOAL_CHECK, normalizeOrientation, solvedCube, stickerAt, stickerMap,
  type Goal, type Cube, type Vec,
} from "../src/cube";
import type { AlgOut, AlgSource, CaseOut, CaseSource, GroupOut, SectionOut, SectionSource } from "../src/data/types";
import { SOURCES, speedcubedbCaseUrl, type SourceId } from "../src/data/sources";
import { f2lBeginner } from "../src/data/f2l-beginner";
import { fourLLL } from "../src/data/4lll";
import { f2lGroupIds, f2lGroupOrder, f2lIntermediateBase } from "../src/data/f2l-intermediate";
import { ollGroupIds, pllGroupIds } from "../src/data/oll-pll";

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

/** SpeedCubeDB case → verified algs: SpeedCubeDB's first alg recommended, the rest by penalty, at most 6. */
function scdbCase(r: Scraped, set: "F2L" | "OLL" | "PLL", goal: Goal, id: string): CaseOut {
  const setup = tidy(r.setup ?? invertAlg(r.algs[0]));
  const start = caseState(setup);
  const sourceUrl = speedcubedbCaseUrl(set, r.name);
  const fromScdb = () => ({ source: "speedcubedb" as const, sourceUrl });
  const [first] = verifyAlgs(r.name, start, goal, r.algs.slice(0, 1), false, fromScdb);
  const rest = verifyAlgs(r.name, start, goal, r.algs.slice(1), false, fromScdb)
    .map((a, i) => ({ a, i }))
    .sort((x, y) => penalty(x.a.alg) - penalty(y.a.alg) || x.i - y.i)
    .map((x) => x.a);
  const algs = recommend(rest, first).slice(0, 6);
  if (!algs.length) errors.push(`${r.name}: no valid algorithms`);
  return { id, name: r.name, setup, algs };
}

function buildIntermediate(): SectionOut {
  const raw = readRaw("speedcubedb-f2l.json");
  const groups: GroupOut[] = f2lGroupOrder.map((sub) => ({ id: f2lGroupIds[sub], goal: "f2l", view: "f2l", cases: [] }));
  for (const r of raw) {
    const num = r.name.replace("F2L ", "");
    groups[f2lGroupOrder.indexOf(r.sub)].cases.push(scdbCase(r, "F2L", "f2l", `f2l-${num}`));
  }
  return { ...f2lIntermediateBase, groups };
}

/** Full OLL / PLL: SpeedCubeDB subgroups become groups. Ids get a `full-` prefix (4LLL already uses oll-21…27, pll-ua…). */
function buildFull(kind: "oll" | "pll", groupIds: Record<string, string>): SectionOut {
  const subs = Object.keys(groupIds);
  const groups: GroupOut[] = subs.map((sub) => ({ id: groupIds[sub], goal: kind, view: kind, cases: [] }));
  for (const r of readRaw(`speedcubedb-${kind}.json`)) {
    const id = `full-${kind}-${r.name.split(" ").pop()!.toLowerCase()}`;
    groups[subs.indexOf(r.sub)].cases.push(scdbCase(r, kind.toUpperCase() as "OLL" | "PLL", kind, id));
  }
  return { id: kind, defaultCollapsed: true, basedOn: ["speedcubedb"], groups };
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

// ---- Case probability (GLOSSARY "Case probability") ----
// A random solve reaches a uniform last-layer state with F2L solved: 288 permutations × 216 orientations = 62208.
// Enumerate them with the simulator, then group each stage's states into classes equal up to AUF;
// a case's probability is its class size over the stage's universe. The skip (solved) class is left out of cases.
const LL_GENS = ["U", "R U R' U R U2 R'", "R U R' U' R' F R2 U' R' U' R U R' F'", "F R U R' U' F'"]; // U, Sune, T-perm, edge-flip
const SOLVED = solvedCube();
const LOCS = SOLVED; // one sticker per physical location (position + normal)
const TOP_CORNERS = SOLVED.filter((s) => s.pos[1] === 1 && Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 2);
const TOP_EDGES = SOLVED.filter((s) => s.pos[1] === 1 && Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 1);
const CORNER_POS: Vec[] = [[1, 1, 1], [1, 1, -1], [-1, 1, -1], [-1, 1, 1]];
const EDGE_POS: Vec[] = [[1, 1, 0], [0, 1, -1], [-1, 1, 0], [0, 1, 1]];

/** Colours visible at the given locations, as one string. */
function colorsAt(cube: Cube, locs: Cube): string {
  const m = stickerMap(cube);
  return locs.map((l) => stickerAt(m, l.pos, l.normal).color).join("");
}

const SOLVED_KEY = colorsAt(SOLVED, LOCS);
/** Location permutation of an alg: the sticker at location j after it came from location src[j]. */
function locPerm(alg: string): number[] {
  const src: number[] = [];
  applyAlg(SOLVED, alg).forEach((s, i) => {
    src[LOCS.findIndex((l) => l.pos.join() === s.pos.join() && l.normal.join() === s.normal.join())] = i;
  });
  return src;
}
const apply = (key: string, src: number[]) => src.map((i) => key[i]).join("");
const GEN_PERMS = LL_GENS.map(locPerm);
const U_PERM = locPerm("U");
const TOP_CORNER_IDX = TOP_CORNERS.map((l) => LOCS.indexOf(l));
const TOP_EDGE_IDX = TOP_EDGES.map((l) => LOCS.indexOf(l));
/** Per top piece, the locations of its stickers as [U, side, ...]: index into these = its twist. */
const PIECE_SLOTS: number[][] = [...CORNER_POS, ...EDGE_POS].map((p) =>
  ([[0, 1, 0], [p[0], 0, 0], [0, 0, p[2]]] as Vec[])
    .filter((n) => n.some((v) => v !== 0))
    .map((n) => LOCS.findIndex((l) => l.pos.join() === p.join() && l.normal.join() === n.join())),
);
/** Per top piece: index of its sticker showing U (0 = oriented; corners 0-2, edges 0-1), for a state key. */
function orient(key: string): string {
  return PIECE_SLOTS.map((slots) => {
    const i = slots.findIndex((j) => key[j] === "U");
    if (i < 0) throw new Error(`no U sticker in ${key}`);
    return i;
  }).join("");
}

interface LLState {
  key: string;
  /** Indices into LL_GENS that reach this state from solved (no whole-cube rotations). */
  path: number[];
  /** orient() after 0, 1, 2, 3 extra U turns: the orientation seen under pre-AUF. */
  o: string[];
}

/** BFS over the last-layer group from solved, keyed by visible colours. */
function enumerateLL(): Map<string, LLState> {
  const states = new Map<string, LLState>();
  let layer: LLState[] = [];
  const visit = (key: string, path: number[]) => {
    if (states.has(key)) return;
    const u1 = apply(key, U_PERM), u2 = apply(u1, U_PERM), u3 = apply(u2, U_PERM);
    const st: LLState = { key, path, o: [orient(key), orient(u1), orient(u2), orient(u3)] };
    states.set(key, st);
    layer.push(st);
  };
  visit(SOLVED_KEY, []);
  while (layer.length) {
    const current = layer;
    layer = [];
    for (const st of current) GEN_PERMS.forEach((perm, g) => visit(apply(st.key, perm), [...st.path, g]));
  }
  return states;
}
const LL = enumerateLL();
if (LL.size !== 288 * 216) errors.push(`last-layer group has ${LL.size} states, expected ${288 * 216}`);

interface Variant { full: string; corners: string; edges: string }
const variantMemo = new Map<string, Variant[]>();
/** The 16 pre/post-AUF variants U^a · path · U^b of a state, as colours at all / top-corner / top-edge stickers. */
function variants(st: LLState): Variant[] {
  let v = variantMemo.get(st.key);
  if (!v) {
    const turns = (key: string, n: number) => (n ? turns(apply(key, U_PERM), n - 1) : key);
    v = [0, 1, 2, 3]
      .flatMap((a) => {
        const pre = st.path.reduce((key, g) => apply(key, GEN_PERMS[g]), turns(SOLVED_KEY, a));
        return [0, 1, 2, 3].map((b) => turns(pre, b));
      })
      .map((key) => ({
        full: key,
        corners: TOP_CORNER_IDX.map((i) => key[i]).join(""),
        edges: TOP_EDGE_IDX.map((i) => key[i]).join(""),
      }));
    variantMemo.set(st.key, v);
  }
  return v;
}

type Stage = "oll" | "eo" | "ocll" | "cp" | "ep" | "pll";
const ORIENTED = orient(SOLVED_KEY);
const SOLVED_CORNERS = colorsAt(SOLVED, TOP_CORNERS);
const min = (xs: string[]) => xs.reduce((a, b) => (b < a ? b : a));
/** Class of a state at each stage (null = outside the stage). Orientation strings are shifted by U: pre-AUF on o[]. */
const CLASS: Record<Stage, (st: LLState) => string | null> = {
  oll: (st) => min(st.o),
  eo: (st) => min(st.o.map((o) => o.slice(4))),
  ocll: (st) => (st.o[0].slice(4) === "0000" ? min(st.o.map((o) => o.slice(0, 4))) : null),
  cp: (st) => (st.o[0] === ORIENTED ? min(variants(st).map((v) => v.corners)) : null),
  ep: (st) => {
    if (st.o[0] !== ORIENTED) return null;
    const edges = variants(st).filter((v) => v.corners === SOLVED_CORNERS).map((v) => v.edges);
    return edges.length ? min(edges) : null;
  },
  pll: (st) => (st.o[0] === ORIENTED ? min(variants(st).map((v) => v.full)) : null),
};

const tables = new Map<Stage, { counts: Map<string, number>; total: number }>();
/** Class sizes over the stage's universe. */
function table(stage: Stage) {
  let t = tables.get(stage);
  if (!t) {
    const counts = new Map<string, number>();
    let total = 0;
    for (const st of LL.values()) {
      const cls = CLASS[stage](st);
      if (cls === null) continue;
      total++;
      counts.set(cls, (counts.get(cls) ?? 0) + 1);
    }
    t = { counts, total };
    tables.set(stage, t);
  }
  return t;
}

/** Stage by section and group goal: 4LLL "oll" goal is OCLL; 4LLL "pll" goal is EPLL. */
const STAGE_OF: Record<string, Stage> = {
  "4lll/eo": "eo", "4lll/oll": "ocll", "4lll/cp": "cp", "4lll/pll": "ep", "oll/oll": "oll", "pll/pll": "pll",
};
const claimed = new Map<Stage, Set<string>>();
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const SOLVED_STATE = LL.get(SOLVED_KEY)!;

function withProbability(section: SectionOut): SectionOut {
  return {
    ...section,
    groups: section.groups.map((g) => {
      const stage = STAGE_OF[`${section.id}/${g.goal}`];
      if (!stage) return g;
      const { counts, total } = table(stage);
      const nonSkip = total - counts.get(CLASS[stage](SOLVED_STATE)!)!;
      const used = claimed.get(stage) ?? new Set<string>();
      claimed.set(stage, used);
      return {
        ...g,
        cases: g.cases.map((c): CaseOut => {
          const st = LL.get(colorsAt(normalizeOrientation(caseState(c.setup)), LOCS));
          const cls = st ? CLASS[stage](st) : null;
          const n = cls === null ? undefined : counts.get(cls);
          if (cls === null || n === undefined || used.has(cls)) {
            errors.push(`${c.id}: setup is not a distinct ${stage} case`);
            return c;
          }
          used.add(cls);
          const d = gcd(n, nonSkip);
          return { ...c, prob: [n / d, nonSkip / d] };
        }),
      };
    }),
  };
}

const fullOll = buildFull("oll", ollGroupIds);
const fullPll = buildFull("pll", pllGroupIds);
const stateOf = (c: CaseOut) => LL.get(colorsAt(normalizeOrientation(caseState(c.setup)), LOCS))!;
const FULL_BY_STAGE = {
  eo: fullOll.groups.flatMap((g) => g.cases),
  ocll: fullOll.groups.flatMap((g) => g.cases),
  cp: fullPll.groups.flatMap((g) => g.cases),
  ep: fullPll.groups.flatMap((g) => g.cases),
} as Partial<Record<Stage, CaseOut[]>>;

/**
 * Links each 4LLL case to the full OLL/PLL cases in its class at its stage: `subcases` for EOLL and CPLL,
 * `sameAs` (the one matching full case) for OCLL and EPLL.
 */
function linkLll(s: SectionOut): SectionOut {
  return {
    ...s,
    groups: s.groups.map((g) => {
      const stage = STAGE_OF[`4lll/${g.goal}`];
      return {
        ...g,
        cases: g.cases.map((c): CaseOut => {
          const cls = CLASS[stage](stateOf(c));
          const hits = cls === null ? [] : (FULL_BY_STAGE[stage] ?? []).filter((f) => CLASS[stage](stateOf(f)) === cls);
          if (!hits.length || ((stage === "ocll" || stage === "ep") && hits.length !== 1))
            errors.push(`${c.id}: ${hits.length} full cases in its ${stage} class`);
          if (stage === "eo" || stage === "cp") {
            // GLOSSARY "Chosen subcase": the full case the 4LLL recommended alg already solves completely
            const rec = stripPrefix((c.algs.find((a) => a.recommended) ?? c.algs[0]).alg);
            const goal = stage === "eo" ? "oll" : "pll";
            const def = hits.find((f) => findPrefix(caseState(f.setup), rec, goal) !== null);
            return { ...c, subcases: hits.map((f) => f.id), ...(def ? { defaultSubcase: def.id } : {}) };
          }
          return { ...c, sameAs: c.sameAs ?? hits[0]?.name };
        }),
      };
    }),
  };
}

const sections = [beginner, intermediate, lll, fullOll, fullPll]
  .map(withProbability)
  .map((s) => (s.id === "4lll" ? linkLll(s) : s));

/** Every stage class except the skip must be claimed by exactly one case. */
for (const [stage, used] of claimed) {
  const skip = CLASS[stage](LL.get(colorsAt(SOLVED, LOCS))!)!;
  if (used.has(skip) || table(stage).counts.size !== used.size + 1)
    errors.push(`${stage}: ${table(stage).counts.size - 1} classes but ${used.size} cases`);
}
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
