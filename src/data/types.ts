import type { Goal } from "../cube";
import type { SourceId } from "./sources";

export type CaseView = "f2l" | "eoll" | "oll" | "pll";

/** All human-readable text lives in src/i18n/locales/*, keyed by the ids below. */
export interface AlgSource {
  alg: string;
  /** Key in `content.notes`. */
  note?: string;
  source?: SourceId;
}

export interface CaseSource {
  /** Also the key in `content.cases`. */
  id: string;
  /** Moves that create the case from a solved cube. Defaults to the inverse of the first alg. */
  setup?: string;
  algs: (string | AlgSource)[];
  /** Hand-written alternatives are verified strictly; scraped ones are filtered. */
  strict?: boolean;
  /** Numbered F2L case (e.g. "F2L 8") this beginner case must correspond to. */
  expect?: string;
  /** SpeedCubeDB case name (e.g. "OLL 27", "Ua") used for attribution. */
  ref?: { set: "OLL" | "PLL"; name: string };
  /** Default source for this case's own algorithms. */
  source?: SourceId;
}

export interface GroupSource {
  /** Also the key in `content.groups`. */
  id: string;
  goal: Goal;
  view: CaseView;
  cases: CaseSource[];
}

export interface TipSource {
  /** Key in `content.tips`. */
  id: string;
  algs?: string[];
}

export interface SectionSource {
  /** Also the key in `content.sections`. */
  id: string;
  defaultCollapsed?: boolean;
  basedOn: SourceId[];
  tips?: TipSource[];
  groups: GroupSource[];
}

export interface AlgOut {
  alg: string;
  note?: string;
  source: SourceId;
  sourceUrl?: string;
}

export interface CaseOut {
  id: string;
  /** Language-neutral name (e.g. "F2L 8"); translated names come from `content.cases`. */
  name: string;
  setup: string;
  algs: AlgOut[];
  /** Numbered F2L case that is the same position. */
  sameAs?: string;
}

export interface GroupOut {
  id: string;
  goal: Goal;
  view: CaseView;
  cases: CaseOut[];
}

export interface SectionOut {
  id: string;
  defaultCollapsed?: boolean;
  basedOn: SourceId[];
  tips?: TipSource[];
  groups: GroupOut[];
}
