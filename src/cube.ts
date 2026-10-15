export type Vec = [number, number, number];
export type Face = "U" | "D" | "F" | "B" | "R" | "L";

export interface Sticker {
  pos: Vec;
  normal: Vec;
  color: Face;
  /** Home position of the piece this sticker belongs to. */
  home: Vec;
}

export type Cube = Sticker[];

const FACE_NORMALS: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

export function faceOfNormal(n: Vec): Face {
  for (const f of Object.keys(FACE_NORMALS) as Face[]) {
    const v = FACE_NORMALS[f];
    if (v[0] === n[0] && v[1] === n[1] && v[2] === n[2]) return f;
  }
  throw new Error(`bad normal ${n}`);
}

export function solvedCube(): Cube {
  const cube: Cube = [];
  for (const f of Object.keys(FACE_NORMALS) as Face[]) {
    const n = FACE_NORMALS[f];
    const axis = n.findIndex((v) => v !== 0);
    const others = [0, 1, 2].filter((i) => i !== axis);
    for (const a of [-1, 0, 1]) {
      for (const b of [-1, 0, 1]) {
        const pos: Vec = [0, 0, 0];
        pos[axis] = n[axis];
        pos[others[0]] = a;
        pos[others[1]] = b;
        cube.push({ pos, normal: [...n] as Vec, color: f, home: [...pos] as Vec });
      }
    }
  }
  return cube;
}

/** axis 0=x 1=y 2=z, layers = coordinates affected, quarter = clockwise quarter turns seen from +axis. */
interface Turn {
  axis: 0 | 1 | 2;
  layers: number[];
  quarters: number;
}

const BASE: Record<string, { axis: 0 | 1 | 2; layers: number[]; sign: 1 | -1 }> = {
  R: { axis: 0, layers: [1], sign: 1 },
  L: { axis: 0, layers: [-1], sign: -1 },
  M: { axis: 0, layers: [0], sign: -1 },
  x: { axis: 0, layers: [-1, 0, 1], sign: 1 },
  r: { axis: 0, layers: [0, 1], sign: 1 },
  l: { axis: 0, layers: [-1, 0], sign: -1 },
  U: { axis: 1, layers: [1], sign: 1 },
  D: { axis: 1, layers: [-1], sign: -1 },
  E: { axis: 1, layers: [0], sign: -1 },
  y: { axis: 1, layers: [-1, 0, 1], sign: 1 },
  u: { axis: 1, layers: [0, 1], sign: 1 },
  d: { axis: 1, layers: [-1, 0], sign: -1 },
  F: { axis: 2, layers: [1], sign: 1 },
  B: { axis: 2, layers: [-1], sign: -1 },
  S: { axis: 2, layers: [0], sign: 1 },
  z: { axis: 2, layers: [-1, 0, 1], sign: 1 },
  f: { axis: 2, layers: [0, 1], sign: 1 },
  b: { axis: 2, layers: [-1, 0], sign: -1 },
};

export interface Move {
  face: string;
  amount: number; // 1, 2 or 3 (=prime)
}

const TOKEN = /^([RLUDFBMESxyzrludfb])(w?)(\d*)('?)$/;

export function parseAlg(alg: string): Move[] {
  const cleaned = alg.replace(/[()[\]]/g, " ").replace(/’/g, "'").trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/).map((tok) => {
    const m = TOKEN.exec(tok);
    if (!m) throw new Error(`Nieznany ruch: ${tok}`);
    let face = m[1];
    if (m[2]) face = face.toLowerCase();
    let amount = m[3] ? parseInt(m[3], 10) : 1;
    if (m[4]) amount = -amount;
    amount = ((amount % 4) + 4) % 4;
    return { face, amount };
  });
}

export function formatMove(m: Move): string {
  if (m.amount === 0) return "";
  return m.face + (m.amount === 1 ? "" : m.amount === 2 ? "2" : "'");
}

export function invertAlg(alg: string): string {
  return parseAlg(alg)
    .reverse()
    .map((m) => formatMove({ face: m.face, amount: (4 - m.amount) % 4 }))
    .filter(Boolean)
    .join(" ");
}

function rotate(v: Vec, axis: number, quarters: number): Vec {
  let [x, y, z] = v;
  for (let i = 0; i < quarters; i++) {
    // one clockwise quarter seen from +axis
    if (axis === 0) [y, z] = [z, -y];
    else if (axis === 1) [x, z] = [-z, x];
    else [x, y] = [y, -x];
  }
  return [x, y, z];
}

function toTurn(m: Move): Turn {
  const b = BASE[m.face];
  const q = b.sign === 1 ? m.amount : (4 - m.amount) % 4;
  return { axis: b.axis, layers: b.layers, quarters: q };
}

export function applyMoves(cube: Cube, moves: Move[]): Cube {
  let out = cube.map((s) => ({ ...s, pos: [...s.pos] as Vec, normal: [...s.normal] as Vec }));
  for (const m of moves) {
    const t = toTurn(m);
    if (t.quarters === 0) continue;
    out = out.map((s) =>
      t.layers.includes(s.pos[t.axis])
        ? { ...s, pos: rotate(s.pos, t.axis, t.quarters), normal: rotate(s.normal, t.axis, t.quarters) }
        : s,
    );
  }
  return out;
}

export function applyAlg(cube: Cube, alg: string): Cube {
  return applyMoves(cube, parseAlg(alg));
}

const key = (p: Vec, n: Vec) => `${p.join(",")}|${n.join(",")}`;

export function stickerMap(cube: Cube): Map<string, Sticker> {
  return new Map(cube.map((s) => [key(s.pos, s.normal), s]));
}

export function stickerAt(map: Map<string, Sticker>, pos: Vec, normal: Vec): Sticker {
  const s = map.get(key(pos, normal));
  if (!s) throw new Error(`no sticker at ${pos} ${normal}`);
  return s;
}

const ROTATIONS: string[] = (() => {
  const out: string[] = [];
  for (const a of ["", "x", "x2", "x'", "z", "z'"]) for (const b of ["", "y", "y2", "y'"]) out.push(`${a} ${b}`.trim());
  return out;
})();

/** Rotates the whole cube so that centers are back home (undoes net x/y/z rotations). */
export function normalizeOrientation(cube: Cube): Cube {
  for (const r of ROTATIONS) {
    const c = applyAlg(cube, r);
    const m = stickerMap(c);
    if (
      stickerAt(m, [0, 1, 0], [0, 1, 0]).color === "U" &&
      stickerAt(m, [0, 0, 1], [0, 0, 1]).color === "F"
    )
      return c;
  }
  throw new Error("cannot normalize");
}

const stickerSolved = (s: Sticker) => s.color === faceOfNormal(s.normal);

export function isF2LSolved(cube: Cube): boolean {
  return normalizeOrientation(cube).every((s) => s.pos[1] === 1 || stickerSolved(s));
}

const inBackRightSlot = (p: Vec) => p[0] === 1 && p[2] === -1 && p[1] !== 1;

/** F2L solved, treating the back-right slot as still empty (it may be used for the "hiding" trick). */
export function isF2LSolvedFreeBR(cube: Cube): boolean {
  return normalizeOrientation(cube).every(
    (s) => s.pos[1] === 1 || inBackRightSlot(s.pos) || inBackRightSlot(s.home) || stickerSolved(s),
  );
}

export function isEOSolved(cube: Cube): boolean {
  const c = normalizeOrientation(cube);
  if (!c.every((s) => s.pos[1] === 1 || stickerSolved(s))) return false;
  return c
    .filter((s) => s.normal[1] === 1 && Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 1)
    .every((s) => s.color === "U");
}

export function isOLLSolved(cube: Cube): boolean {
  const c = normalizeOrientation(cube);
  return c.every((s) => (s.pos[1] === 1 && s.normal[1] !== 1 ? true : stickerSolved(s)));
}

export const AUFS = ["", "U", "U2", "U'"];

const LEAD_BLOCK = /^\((\s*[Uy]['’2]?(?:\s+[Uy]['’2]?)*\s*)\)\s*|^([Uy]['’2]?)(?:\s+|$)/;

/**
 * Last-layer `alg` for the case seen after pre-AUF number `k` (AUFS[k]). The leading AUFs / y rotations and U^-k
 * become one net turn (for the last layer y only adds a cube rotation and a final AUF compared to U):
 * dropped when it cancels, else shown as y if the block had a y, otherwise as `(U)`.
 */
export function withPreAuf(alg: string, k: number): string {
  let rest = alg;
  let amount = 4 - k;
  let hasY = false;
  for (let m; (m = LEAD_BLOCK.exec(rest)); rest = rest.slice(m[0].length)) {
    const block = m[1] ?? m[2];
    amount += parseAlg(block).reduce((n, mv) => n + mv.amount, 0);
    hasY ||= block.includes("y");
  }
  const turn = formatMove({ face: hasY ? "y" : "U", amount: amount % 4 });
  if (!turn) return rest;
  return hasY ? `${turn} ${rest}` : `(${turn}) ${rest}`;
}

function solvedAfterAuf(cube: Cube, test: (c: Cube) => boolean): boolean {
  const c = normalizeOrientation(cube);
  return AUFS.some((a) => test(applyAlg(c, a)));
}

export function isCPSolved(cube: Cube): boolean {
  return solvedAfterAuf(cube, (c) =>
    isOLLSolved(c) &&
    c.filter((s) => s.pos[1] === 1 && Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 2).every(stickerSolved),
  );
}

export function isSolved(cube: Cube): boolean {
  return solvedAfterAuf(cube, (c) => c.every(stickerSolved));
}

export type Goal = "f2l" | "f2l-free-br" | "eo" | "oll" | "cp" | "pll";

export const GOAL_CHECK: Record<Goal, (c: Cube) => boolean> = {
  f2l: isF2LSolved,
  "f2l-free-br": isF2LSolvedFreeBR,
  eo: isEOSolved,
  oll: isOLLSolved,
  cp: isCPSolved,
  pll: isSolved,
};

/**
 * Returns the pre-AUF ("" | "U" | "U2" | "U'") with which `alg` solves `goal` from `start`, or null.
 */
export function findPreAuf(start: Cube, alg: string, goal: Goal): string | null {
  for (const a of AUFS) {
    if (GOAL_CHECK[goal](applyAlg(start, `${a} ${alg}`))) return a;
  }
  return null;
}

export function caseState(setupAlg: string): Cube {
  return applyAlg(solvedCube(), setupAlg);
}
