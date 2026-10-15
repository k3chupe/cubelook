const KEY = "cubelook:v1";

export interface Settings {
  /** Per case: user's preferred order of algorithms (first = favourite). */
  order: Record<string, string[]>;
  /** Per case: same as `order`, but used while the slice filter (hideSlice) is on. */
  orderNoSlice: Record<string, string[]>;
  collapsed: Record<string, boolean>;
  learned: Record<string, boolean>;
  /** Per case: show all alternatives even when "only favourite" is on. */
  expanded: Record<string, boolean>;
  /** Per last-layer case: pre-AUF the case is viewed after (index into AUFS: 1 = U, 2 = U2, 3 = U'); absent = 0. */
  auf: Record<string, 1 | 2 | 3>;
  /** Per 4LLL case: the chosen subcase (full case id) whose algs the card shows; absent = the default subcase. */
  chosen: Record<string, string>;
  /** Per case: the open panel shows the full cases list instead of the alternatives. */
  panelFull: Record<string, boolean>;
  onlyFav: boolean;
  hideSlice: boolean;
  hideLearned: boolean;
  compact: boolean;
  theme: "system" | "light" | "dark";
  /** Which last-layer stages to show: 4LLL, or full OLL + PLL. F2L is always shown. */
  path: "4lll" | "full";
  /** Display order of groups and cases: SpeedCubeDB groups, or by case frequency (prob) desc/asc. */
  sort: "groups" | "freqDesc" | "freqAsc";
  /** null = follow the browser language. */
  locale: string | null;
}

const defaults: Settings = {
  order: {},
  orderNoSlice: {},
  collapsed: {},
  learned: {},
  expanded: {},
  auf: {},
  chosen: {},
  panelFull: {},
  onlyFav: true,
  hideSlice: false,
  hideLearned: false,
  compact: false,
  theme: "system",
  path: "4lll",
  sort: "freqDesc",
  locale: null,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(defaults), ...JSON.parse(raw) }; // clone: stored settings missing a key must not share defaults' objects
  } catch {
    /* storage unavailable or corrupted – fall back to defaults */
  }
  return structuredClone(defaults);
}

export const settings: Settings = load();

const listeners = new Set<() => void>();

export function onChange(fn: () => void) {
  listeners.add(fn);
}

export function update(mut: (s: Settings) => void) {
  mut(settings);
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* private mode – keep in memory only */
  }
  listeners.forEach((fn) => fn());
}

export function resetSettings() {
  update((s) => Object.assign(s, structuredClone(defaults)));
}

/** Returns algorithms in the user's order; new algorithms (not yet ordered) keep their default position at the end. */
export function orderedAlgs<T extends { alg: string }>(caseId: string, algs: T[], hideSlice = false): T[] {
  const order = (hideSlice && settings.orderNoSlice[caseId]) || settings.order[caseId];
  if (!order) return algs;
  const rank = (a: T) => {
    const i = order.indexOf(a.alg);
    return i === -1 ? order.length + algs.indexOf(a) : i;
  };
  return [...algs].sort((a, b) => rank(a) - rank(b));
}

/** Full cases list of a 4LLL case (given in data order): `pinned` first, then not learned, then learned; each part by `sort` on `p`. */
export function orderSubcases<T extends { id: string; p: number }>(
  items: T[],
  pinned: string | undefined,
  learned: Record<string, boolean>,
  sort: Settings["sort"],
): T[] {
  const dir = sort === "freqDesc" ? -1 : sort === "freqAsc" ? 1 : 0;
  const rank = (x: T) => (x.id === pinned ? 0 : learned[x.id] ? 2 : 1);
  return [...items].sort((a, b) => rank(a) - rank(b) || (a.p - b.p) * dir);
}
