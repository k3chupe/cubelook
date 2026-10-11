const KEY = "kostka-rubika:v1";

export interface Settings {
  /** Per case: user's preferred order of algorithms (first = favourite). */
  order: Record<string, string[]>;
  collapsed: Record<string, boolean>;
  learned: Record<string, boolean>;
  /** Per case: show all alternatives even when "only favourite" is on. */
  expanded: Record<string, boolean>;
  onlyFav: boolean;
  hideSlice: boolean;
  hideLearned: boolean;
}

const defaults: Settings = {
  order: {},
  collapsed: {},
  learned: {},
  expanded: {},
  onlyFav: true,
  hideSlice: false,
  hideLearned: false,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
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
export function orderedAlgs<T extends { alg: string }>(caseId: string, algs: T[]): T[] {
  const order = settings.order[caseId];
  if (!order) return algs;
  const rank = (a: T) => {
    const i = order.indexOf(a.alg);
    return i === -1 ? order.length + algs.indexOf(a) : i;
  };
  return [...algs].sort((a, b) => rank(a) - rank(b));
}
