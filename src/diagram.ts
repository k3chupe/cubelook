import { caseState, stickerMap, stickerAt, type Face, type Sticker, type Vec } from "./cube";
import type { CaseView } from "./data/types";

export const FACE_COLORS: Record<Face, string> = {
  U: "#fde047",
  D: "#f8fafc",
  F: "#22c55e",
  B: "#3b82f6",
  R: "#f97316",
  L: "#ef4444",
};
const GRAY = "#4b5563";
const STROKE = "#0b0d12";

function llColor(s: Sticker, view: CaseView, onTop: boolean): string {
  if (view === "pll") return FACE_COLORS[s.color];
  const isEdge = Math.abs(s.pos[0]) + Math.abs(s.pos[2]) === 1;
  const isCenter = s.pos[0] === 0 && s.pos[2] === 0;
  if (view === "eoll" && !isEdge && !isCenter) return GRAY;
  if (s.color === "U") return FACE_COLORS.U;
  return onTop ? GRAY : "none";
}

function lastLayerSvg(setup: string, view: CaseView): string {
  const map = stickerMap(caseState(setup));
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
      parts.push(rect(off + col * (cell + gap), off + row * (cell + gap), cell, cell, llColor(s, view, true)));
    }
  }
  for (let i = 0; i < 3; i++) {
    const back = stickerAt(map, [i - 1, 1, -1], [0, 0, -1]);
    const front = stickerAt(map, [i - 1, 1, 1], [0, 0, 1]);
    const left = stickerAt(map, [-1, 1, i - 1], [-1, 0, 0]);
    const right = stickerAt(map, [1, 1, i - 1], [1, 0, 0]);
    const along = off + i * (cell + gap);
    parts.push(rect(along, gap, cell, strip, llColor(back, view, false)));
    parts.push(rect(along, size - gap - strip, cell, strip, llColor(front, view, false)));
    parts.push(rect(gap, along, strip, cell, llColor(left, view, false)));
    parts.push(rect(size - gap - strip, along, strip, cell, llColor(right, view, false)));
  }
  return `<svg viewBox="0 0 ${size} ${size}" class="diagram" role="img" aria-label="Układ ostatniej warstwy">${parts.join("")}</svg>`;
}

const COS30 = Math.cos(Math.PI / 6);
const project = ([x, y, z]: Vec, s: number): [number, number] => [(x - z) * COS30 * s, (-y + (x + z) * 0.5) * s];

function f2lSvg(setup: string): string {
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
  return `<svg viewBox="${-hx} ${-hy} ${2 * hx} ${2 * hy}" class="diagram" role="img" aria-label="Układ F2L">${polys.join("")}</svg>`;
}

const cache = new Map<string, string>();

export function caseDiagram(setup: string, view: CaseView): string {
  const k = `${view}|${setup}`;
  let svg = cache.get(k);
  if (!svg) {
    svg = view === "f2l" ? f2lSvg(setup) : lastLayerSvg(setup, view);
    cache.set(k, svg);
  }
  return svg;
}
