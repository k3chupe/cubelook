import type { SectionSource, TipSource } from "./types";

/** SpeedCubeDB subgroup name → group id (titles in `content.groups`). */
export const f2lGroupIds: Record<string, string> = {
  "Free Pairs": "f2l-free-pairs",
  "Disconnected Pairs": "f2l-disconnected-pairs",
  "Connected Pairs": "f2l-connected-pairs",
  "Corner In Slot": "f2l-corner-in-slot",
  "Edge In Slot": "f2l-edge-in-slot",
  "Pieces In Slot": "f2l-pieces-in-slot",
};

export const f2lGroupOrder = Object.keys(f2lGroupIds);

export const f2lIntermediateTips: TipSource[] = [
  { id: "int-no-rotation", algs: ["U' F' U F", "y U' L' U L"] },
  { id: "int-back-slots", algs: ["R' U' R", "R' U R", "L U L'", "L U' L'"] },
  { id: "int-sledge", algs: ["R' F R F'", "F R' F' R"] },
  { id: "int-keyhole", algs: ["d R' U' R d'", "R U' R' d R' U' R"] },
  { id: "int-easy-first" },
  { id: "int-lookahead" },
];

export const f2lIntermediateBase: Omit<SectionSource, "groups"> = {
  id: "f2l-intermediate",
  defaultCollapsed: true,
  basedOn: ["speedcubedb"],
  tips: f2lIntermediateTips,
};
