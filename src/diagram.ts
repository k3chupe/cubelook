import { AUFS, caseState, stickerMap, stickerAt, type Face, type Sticker, type Vec } from "./cube";
import type { CaseView } from "./data/types";

/** Sticker colors are CSS custom properties defined per theme. */
export const FACE_COLORS: Record<Face, string> = {
  U: "var(--st-u)",
  D: "var(--st-d)",
  F: "var(--st-f)",
  B: "var(--st-b)",
  R: "var(--st-r)",
  L: "var(--st-l)",
};
const GRAY = "var(--st-gray)";
const STROKE = "var(--st-stroke)";

function llColor(s: Sticker, view: CaseView, onTop: boolean, cornersOnly: boolean): string {
  const isEdge = Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 1;
  if (cornersOnly && isEdge) return GRAY;
  if (view === "pll") return FACE_COLORS[s.color];
  const isCenter = s.pos[0] === 0 && s.pos[2] === 0;
  if (view === "eoll" && !isEdge && !isCenter) return GRAY;
  if (s.color === "U") return FACE_COLORS.U;
  return onTop ? GRAY : "none";
}

function lastLayerSvg(setup: string, view: CaseView, label: string, auf: number, cornersOnly: boolean): string {
  const map = stickerMap(caseState(`${setup} ${AUFS[auf]}`));
  const cell = 20;
  const gap = 2;
  const strip = 7;
  const off = strip + gap * 2;
  const size = off * 2 + cell * 3 + gap * 2;
  const parts: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, fill: string) =>
    fill === "none"
      ? ""
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${fill}" stroke="${STROKE}" stroke-width="1"/>`;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const pos: Vec = [col - 1, 1, row - 1];
      const s = stickerAt(map, pos, [0, 1, 0]);
      parts.push(rect(off + col * (cell + gap), off + row * (cell + gap), cell, cell, llColor(s, view, true, cornersOnly)));
    }
  }
  for (let i = 0; i < 3; i++) {
    const back = stickerAt(map, [i - 1, 1, -1], [0, 0, -1]);
    const front = stickerAt(map, [i - 1, 1, 1], [0, 0, 1]);
    const left = stickerAt(map, [-1, 1, i - 1], [-1, 0, 0]);
    const right = stickerAt(map, [1, 1, i - 1], [1, 0, 0]);
    const along = off + i * (cell + gap);
    parts.push(rect(along, gap, cell, strip, llColor(back, view, false, cornersOnly)));
    parts.push(rect(along, size - gap - strip, cell, strip, llColor(front, view, false, cornersOnly)));
    parts.push(rect(gap, along, strip, cell, llColor(left, view, false, cornersOnly)));
    parts.push(rect(size - gap - strip, along, strip, cell, llColor(right, view, false, cornersOnly)));
  }
  if (view === "pll") {
    const center = (p: Vec): [number, number] => [
      off + (p[0] + 1) * (cell + gap) + cell / 2,
      off + (p[2] + 1) * (cell + gap) + cell / 2,
    ];
    parts.push(...pllArrows(map, center, auf, cornersOnly));
  }
  return `<svg viewBox="0 0 ${size} ${size}" class="diagram" role="img" aria-label="${label}">${ARROW_DEFS}${parts.join("")}</svg>`;
}

const ARROW_DEFS =
  '<defs><marker id="cl-arrow" viewBox="-2 -2 14 14" refX="7" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto-start-reverse">' +
  '<path d="M0 0L10 5L0 10z" fill="var(--arrow)" stroke="var(--arrow-outline)" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke"/></marker></defs>';

/** Arrows from each top-layer piece to the place it has to go (double-headed for swaps). */
function pllArrows(map: Map<string, Sticker>, center: (p: Vec) => [number, number], auf: number, cornersOnly: boolean): string[] {
  const key = (p: Vec) => p.join(",");
  const turnU = ([x, y, z]: Vec, k: number): Vec => {
    for (let i = 0; i < k; i++) [x, z] = [-z, x];
    return [x, y, z];
  };
  const pieces: Sticker[] = [];
  for (const x of [-1, 0, 1])
    for (const z of [-1, 0, 1]) if (cornersOnly ? x && z : x || z) pieces.push(stickerAt(map, [x, 1, z], [0, 1, 0]));
  // The algorithm may finish with an AUF; show the permutation relative to the AUF that moves the fewest pieces.
  // Ties are broken starting from the view's own pre-AUF so a rotated view shows the same arrows, rotated.
  let best = new Map<string, Vec>();
  for (let i = 0; i < 4; i++) {
    const target = new Map<string, Vec>();
    for (const s of pieces) {
      const dest = turnU(s.home, (i + auf) % 4);
      if (key(dest) !== key(s.pos)) target.set(key(s.pos), dest);
    }
    if (i === 0 || target.size < best.size) best = target;
  }
  const target = best;
  const out: string[] = [];
  const drawn = new Set<string>();
  for (const [fromKey, to] of target) {
    const from = fromKey.split(",").map(Number) as Vec;
    const back = target.get(key(to));
    const swap = !!back && key(back) === fromKey;
    const pairKey = [fromKey, key(to)].sort().join("|");
    if (swap && drawn.has(pairKey)) continue;
    drawn.add(pairKey);
    const [x1, y1] = center(from);
    const [x2, y2] = center(to);
    // Arrows that don't pass through the middle bow outward so they never lie on top of arrows that do.
    const [cx, cy] = center([0, 1, 0]);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    // Bowing outward would run into the piece beyond the chord (e.g. the corner between two swapped
    // edges); if another arrow starts or ends there, bow inward instead.
    const beyond = key([from[0] + to[0], 1, from[2] + to[2]] as Vec);
    const crowded = [...target].some(([f, t]) => f !== fromKey && (f === beyond || key(t) === beyond));
    const bow = Math.hypot(mx - cx, my - cy) > 4 ? (crowded ? -0.5 : 0.5) : 0;
    const qx = mx + (mx - cx) * bow;
    const qy = my + (my - cy) * bow;
    const trimTo = (px: number, py: number, tx: number, ty: number) => {
      const l = Math.hypot(tx - px, ty - py);
      return [px + ((tx - px) * 7) / l, py + ((ty - py) * 7) / l];
    };
    const a = trimTo(x1, y1, qx, qy);
    const b = trimTo(x2, y2, qx, qy);
    const f = (n: number) => n.toFixed(1);
    const d = `M${f(a[0])} ${f(a[1])}Q${f(qx)} ${f(qy)} ${f(b[0])} ${f(b[1])}`;
    out.push(
      `<path d="${d}" stroke="var(--arrow-outline)" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    );
    out.push(
      `<path d="${d}" stroke="var(--arrow)" stroke-width="2.6" stroke-linecap="round" fill="none" marker-end="url(#cl-arrow)"${
        swap ? ' marker-start="url(#cl-arrow)"' : ""
      }/>`,
    );
  }
  return out;
}

const COS30 = Math.cos(Math.PI / 6);
const project = ([x, y, z]: Vec, s: number): [number, number] => [(x - z) * COS30 * s, (-y + (x + z) * 0.5) * s];

function f2lSvg(setup: string, label: string): string {
  const cube = caseState(setup);
  const map = stickerMap(cube);
  const s = 15;
  const faces: { normal: Vec; axes: [number, number] }[] = [
    { normal: [0, 1, 0], axes: [0, 2] },
    { normal: [0, 0, 1], axes: [0, 1] },
    { normal: [1, 0, 0], axes: [2, 1] },
  ];
  const polys: string[] = [];
  for (const f of faces) {
    const n = f.normal;
    const axis = n.findIndex((v) => v !== 0);
    for (const a of [-1, 0, 1]) {
      for (const b of [-1, 0, 1]) {
        const pos: Vec = [0, 0, 0];
        pos[axis] = n[axis];
        pos[f.axes[0]] = a;
        pos[f.axes[1]] = b;
        const st = stickerAt(map, pos, n);
        const lastLayerPiece = st.home[1] === 1 && !(st.home[0] === 0 && st.home[2] === 0);
        const fill = lastLayerPiece ? GRAY : FACE_COLORS[st.color];
        const corners: Vec[] = [
          [-0.46, -0.46],
          [0.46, -0.46],
          [0.46, 0.46],
          [-0.46, 0.46],
        ].map(([da, db]) => {
          const p: Vec = [0, 0, 0];
          p[axis] = n[axis] * 1.5;
          p[f.axes[0]] = a + da;
          p[f.axes[1]] = b + db;
          return p;
        });
        const pts = corners.map((c) => project(c, s).map((v) => v.toFixed(2)).join(",")).join(" ");
        polys.push(`<polygon points="${pts}" fill="${fill}" stroke="${STROKE}" stroke-width="1.2" stroke-linejoin="round"/>`);
      }
    }
  }
  // Visible coordinates span [-1.5, 1.5]: screen x spans ±3·cos30·s, screen y spans ±3·s.
  const hx = 3 * COS30 * s + 2;
  const hy = 3 * s + 2;
  return `<svg viewBox="${-hx} ${-hy} ${2 * hx} ${2 * hy}" class="diagram" role="img" aria-label="${label}">${polys.join("")}</svg>`;
}

const cache = new Map<string, string>();

/**
 * `auf` (index into AUFS) shows a last-layer case as seen after that pre-AUF.
 * `cornersOnly` greys out edges and their arrows (4LLL OCLL/CPLL: only the step's pieces, so it fits any subcase alg).
 */
export function caseDiagram(setup: string, view: CaseView, label: string, auf = 0, cornersOnly = false): string {
  const k = `${view}|${setup}|${label}|${auf}|${cornersOnly}`;
  let svg = cache.get(k);
  if (!svg) {
    svg = view === "f2l" ? f2lSvg(setup, label) : lastLayerSvg(setup, view, label, auf, cornersOnly);
    cache.set(k, svg);
  }
  return svg;
}
