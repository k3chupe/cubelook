export interface TriggerKind {
  id: string;
  label: string;
  color: string;
  description: string;
}

export const TRIGGER_KINDS: TriggerKind[] = [
  { id: "sexy", label: "sexy", color: "#3b82f6", description: "R U R' U'" },
  { id: "rsexy", label: "odwr. sexy", color: "#06b6d4", description: "U R U' R' / R' U' R U" },
  { id: "sledge", label: "sledge", color: "#f97316", description: "R' F R F'" },
  { id: "hedge", label: "hedge", color: "#f59e0b", description: "F R' F' R" },
  { id: "sune", label: "sune", color: "#a855f7", description: "R U R' U R U2 R' i odmiany" },
  { id: "insert", label: "wstawka", color: "#22c55e", description: "R U R', R U' R', R' U R…" },
  { id: "insertF", label: "wstawka F/L", color: "#14b8a6", description: "F' U' F, L' U L…" },
  { id: "dtrick", label: "D-trik", color: "#eab308", description: "R D R', R' D' R…" },
  { id: "bracket", label: "nawias", color: "#ec4899", description: "F … F' / f … f' / x … x'" },
  { id: "auf", label: "AUF", color: "#94a3b8", description: "ustaw górę przed algorytmem" },
];

const KIND = Object.fromEntries(TRIGGER_KINDS.map((k) => [k.id, k]));

interface Pattern {
  kind: string;
  label?: string;
  seq: string[];
}

const P = (kind: string, seqs: string[], label?: string): Pattern[] =>
  seqs.map((s) => ({ kind, label, seq: s.split(" ") }));

const PATTERNS: Pattern[] = [
  ...P("sune", ["R U R' U R U2 R'"], "sune"),
  ...P("sune", ["R U2 R' U' R U' R'", "R' U' R U' R' U2 R"], "antysune"),
  ...P("sune", ["L' U' L U' L' U2 L", "L' U2 L U L' U L"], "lewe sune"),
  ...P("sexy", ["R U R' U'"]),
  ...P("sexy", ["r U R' U'"], "szeroki sexy"),
  ...P("sexy", ["L' U' L U"], "lewy sexy"),
  ...P("rsexy", ["U R U' R'", "R' U' R U"]),
  ...P("sledge", ["R' F R F'"]),
  ...P("sledge", ["r' F R F'"], "szeroki sledge"),
  ...P("hedge", ["F R' F' R"]),
  ...P("dtrick", ["R D R'", "R D' R'", "R' D R", "R' D' R", "R D2 R'", "R' D2 R"]),
  ...P("insert", ["R U R'", "R U' R'", "R U2 R'", "R' U R", "R' U' R", "R' U2 R"]),
  ...P("insertF", ["F' U' F", "F' U F", "F' U2 F", "F U F'", "F U' F'", "F U2 F'"]),
  ...P("insertF", ["L' U' L", "L' U L", "L' U2 L", "L U L'", "L U' L'", "L U2 L'"]),
].sort((a, b) => b.seq.length - a.seq.length);

export interface Segment {
  moves: string[];
  kind?: TriggerKind;
  label?: string;
}

const inverseOf = (m: string) => (m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : `${m}'`);

function matchPatterns(tokens: string[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < tokens.length) {
    const p = PATTERNS.find((pat) => pat.seq.every((m, k) => tokens[i + k] === m));
    if (p) {
      const kind = KIND[p.kind];
      out.push({ moves: tokens.slice(i, i + p.seq.length), kind, label: p.label ?? kind.label });
      i += p.seq.length;
    } else {
      const last = out[out.length - 1];
      if (last && !last.kind) last.moves.push(tokens[i]);
      else out.push({ moves: [tokens[i]] });
      i++;
    }
  }
  return out;
}

/** Splits an algorithm into colored, named trigger segments. */
export function segmentAlg(alg: string): Segment[] {
  const pre = /^\(([^)]*)\)\s*/.exec(alg);
  const segments: Segment[] = [];
  if (pre) {
    segments.push({ moves: pre[1].split(" "), kind: KIND.auf, label: "AUF" });
    alg = alg.slice(pre[0].length);
  }
  const tokens = alg.replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean);

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const wholeIsTrigger = PATTERNS.some((p) => p.seq.length === tokens.length && p.seq.every((m, k) => tokens[k] === m));
  const bracketable =
    !wholeIsTrigger && first && /^[Ffxy]'?$/.test(first) && tokens.length > 3 && last === inverseOf(first);
  if (bracketable) {
    const label = /^[xy]/.test(first) ? "obrót" : `nawias ${first}`;
    segments.push({ moves: [first], kind: KIND.bracket, label });
    segments.push(...matchPatterns(tokens.slice(1, -1)));
    segments.push({ moves: [last], kind: KIND.bracket, label });
  } else {
    segments.push(...matchPatterns(tokens));
  }
  return segments;
}

export const isRotation = (m: string) => /^[xyz]/.test(m);
export const usesSlice = (alg: string) => /(^|[\s(])[MES]/.test(alg);
export const isTwoGen = (alg: string) =>
  alg
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .every((m) => /^[RU]/.test(m));
