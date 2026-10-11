import type { Goal } from "../cube";

export type CaseView = "f2l" | "eoll" | "oll" | "pll";

export interface AlgSource {
  alg: string;
  /** Short hint shown under the algorithm. */
  note?: string;
}

export interface CaseSource {
  id: string;
  name: string;
  subtitle?: string;
  /** Moves that create the case from a solved cube. Defaults to the inverse of the first alg. */
  setup?: string;
  algs: (string | AlgSource)[];
  /** Hand-written alternatives are verified strictly; scraped ones are filtered. */
  strict?: boolean;
  /** Numbered F2L case (e.g. "F2L 8") this beginner case must correspond to. */
  expect?: string;
}

export interface GroupSource {
  id: string;
  title: string;
  description?: string;
  goal: Goal;
  view: CaseView;
  cases: CaseSource[];
}

export interface Tip {
  title: string;
  body: string;
  algs?: string[];
}

export interface SectionSource {
  id: string;
  title: string;
  description: string;
  defaultCollapsed?: boolean;
  tips?: Tip[];
  groups: GroupSource[];
}

export interface AlgOut {
  alg: string;
  note?: string;
}

export interface CaseOut {
  id: string;
  name: string;
  subtitle?: string;
  setup: string;
  algs: AlgOut[];
  /** Other cases (e.g. numbered F2L cases) that are the same position. */
  sameAs?: string;
}

export interface GroupOut {
  id: string;
  title: string;
  description?: string;
  goal: Goal;
  view: CaseView;
  cases: CaseOut[];
}

export interface SectionOut {
  id: string;
  title: string;
  description: string;
  defaultCollapsed?: boolean;
  tips?: Tip[];
  groups: GroupOut[];
}
