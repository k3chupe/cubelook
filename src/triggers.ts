export interface TriggerKind {
  id: string;
  color: string;
  /** Example label key (in `Messages.triggers`) used in the legend. */
  legendKey: string;
}

/** Colors are CSS custom properties so themes can tune them for contrast. */
export const TRIGGER_KINDS: TriggerKind[] = [
  { id: "sexy", color: "var(--t-sexy)", legendKey: "sexy" },
  { id: "rsexy", color: "var(--t-rsexy)", legendKey: "rsexy" },
  { id: "sledge", color: "var(--t-sledge)", legendKey: "sledge" },
  { id: "hedge", color: "var(--t-hedge)", legendKey: "hedge" },
  { id: "sune", color: "var(--t-sune)", legendKey: "sune" },
  { id: "insert", color: "var(--t-insert)", legendKey: "insert" },
  { id: "insertF", color: "var(--t-insertF)", legendKey: "insertF" },
  { id: "dtrick", color: "var(--t-dtrick)", legendKey: "dtrick" },
  { id: "bracket", color: "var(--t-bracket)", legendKey: "bracket" },
  { id: "auf", color: "var(--t-auf)", legendKey: "auf" },
];

const KIND = Object.fromEntries(TRIGGER_KINDS.map((k) => [k.id, k]));

interface Pattern {
  kind: string;
  labelKey: string;
  seq: string[];
}

const P = (kind: string, labelKey: string, seqs: string[]): Pattern[] =>
  seqs.map((s) => ({ kind, labelKey, seq: s.split(" ") }));

const PATTERNS: Pattern[] = [
  ...P("sune", "sune", ["R U R' U R U2 R'"]),
  ...P("sune", "antisune", ["R U2 R' U' R U' R'", "R' U' R U' R' U2 R"]),
  ...P("sune", "leftSune", ["L' U' L U' L' U2 L", "L' U2 L U L' U L"]),
  ...P("sexy", "sexy", ["R U R' U'"]),
  ...P("sexy", "wideSexy", ["r U R' U'"]),
  ...P("sexy", "leftSexy", ["L' U' L U"]),
  ...P("rsexy", "rsexy", ["U R U' R'", "R' U' R U"]),
  ...P("sledge", "sledge", ["R' F R F'"]),
  ...P("sledge", "wideSledge", ["r' F R F'"]),
  ...P("hedge", "hedge", ["F R' F' R"]),
  ...P("dtrick", "dtrick", ["R D R'", "R D' R'", "R' D R", "R' D' R", "R D2 R'", "R' D2 R"]),
  ...P("insert", "insert", ["R U R'", "R U' R'", "R U2 R'", "R' U R", "R' U' R", "R' U2 R"]),
  ...P("insertF", "insertF", ["F' U' F", "F' U F", "F' U2 F", "F U F'", "F U' F'", "F U2 F'"]),
  ...P("insertF", "insertF", ["L' U' L", "L' U L", "L' U2 L", "L U L'", "L U' L'", "L U2 L'"]),
].sort((a, b) => b.seq.length - a.seq.length);

export interface Segment {
  moves: string[];
  kind?: TriggerKind;
  /** Key in `Messages.triggers`; `{move}` in the label is replaced by `labelArg`. */
  labelKey?: string;
  labelArg?: string;
}

const inverseOf = (m: string) => (m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : `${m}'`);

function matchPatterns(tokens: string[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < tokens.length) {
    const p = PATTERNS.find((pat) => pat.seq.every((m, k) => tokens[i + k] === m));
    if (p) {
      out.push({ moves: tokens.slice(i, i + p.seq.length), kind: KIND[p.kind], labelKey: p.labelKey });
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
    segments.push({ moves: pre[1].split(" "), kind: KIND.auf, labelKey: "auf" });
    alg = alg.slice(pre[0].length);
  }
  const tokens = alg.replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean);

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const wholeIsTrigger = PATTERNS.some((p) => p.seq.length === tokens.length && p.seq.every((m, k) => tokens[k] === m));
  const bracketable =
    !wholeIsTrigger && first && /^[Ffxy]'?$/.test(first) && tokens.length > 3 && last === inverseOf(first);
  if (bracketable) {
    const rotation = /^[xy]/.test(first);
    const seg = (m: string): Segment => ({
      moves: [m],
      kind: KIND.bracket,
      labelKey: rotation ? "rotation" : "bracket",
      labelArg: first,
    });
    segments.push(seg(first), ...matchPatterns(tokens.slice(1, -1)), seg(last));
  } else {
    segments.push(...matchPatterns(tokens));
  }
  return segments;
}

export const isRotation = (m: string) => /^[xyz]/.test(m);
export const usesSlice = (alg: string) => /(^|[\s(])[MES]/.test(alg);
export const hasRotation = (alg: string) => /(^|\s)[xyz]/.test(alg.replace(/^\(.*?\)/, ""));
export const isTwoGen = (alg: string) =>
  alg
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .every((m) => /^[RU]/.test(m));
