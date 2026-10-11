import type { SectionSource } from "./types";

// Candidates collected from cubingcheatsheet.com, speedcubedb.com and r/Cubers.
// Order = default preference; RU / no-M versions first. Sources are attributed automatically
// (see scripts/build-data.ts); algorithms that fail verification are dropped.
export const fourLLL: SectionSource = {
  id: "4lll",
  basedOn: ["cubingcheatsheet", "speedcubedb", "reddit"],
  tips: [{ id: "lll-order" }, { id: "lll-dot", algs: ["F R U R' U' F'", "f R U R' U' f'"] }],
  groups: [
    {
      id: "eoll",
      goal: "eo",
      view: "eoll",
      cases: [
        { id: "eoll-line", ref: { set: "OLL", name: "OLL 45" }, strict: true, algs: ["F R U R' U' F'", "f U R U' R' f'"] },
        {
          id: "eoll-l",
          ref: { set: "OLL", name: "OLL 44" },
          strict: true,
          algs: ["f R U R' U' f'", "F U R U' R' F'", "f U R U' R' f' U F R U R' U' F'"],
        },
        {
          id: "eoll-dot",
          ref: { set: "OLL", name: "OLL 2" },
          strict: true,
          algs: [
            { alg: "F R U R' U' F' f R U R' U' f'", note: "line-plus-l" },
            "F R U R' U' S R U R' U' f'",
            "R U2 R2 F R F' U2 R' F R F'",
          ],
        },
      ],
    },
    {
      id: "ocll",
      goal: "oll",
      view: "oll",
      cases: [
        {
          id: "oll-27",
          ref: { set: "OLL", name: "OLL 27" },
          strict: true,
          algs: [
            "R U R' U R U2 R'",
            { alg: "L' U2 L U L' U L", note: "mirror-antisune" },
            { alg: "y' R' U2 R U R' U R", note: "mirror-antisune-back" },
          ],
        },
        {
          id: "oll-26",
          ref: { set: "OLL", name: "OLL 26" },
          strict: true,
          algs: [
            { alg: "R U2 R' U' R U' R'", note: "antisune-ru" },
            { alg: "R' U' R U' R' U2 R", note: "mirror-sune-back" },
            { alg: "L' U' L U' L' U2 L", note: "mirror-sune" },
          ],
        },
        {
          id: "oll-21",
          ref: { set: "OLL", name: "OLL 21" },
          strict: true,
          algs: [
            "R U2 R' U' R U R' U' R U' R'",
            "R U R' U R U' R' U R U2 R'",
            "R' U' R U' R' U R U' R' U2 R",
            { alg: "F R U R' U' R U R' U' R U R' U' F'", note: "triple-sexy" },
          ],
        },
        {
          id: "oll-22",
          ref: { set: "OLL", name: "OLL 22" },
          strict: true,
          algs: ["R U2 R2 U' R2 U' R2 U2 R", "R' U2 R2 U R2 U R2 U2 R'", "f R U R' U' f' F R U R' U' F'"],
        },
        {
          id: "oll-23",
          ref: { set: "OLL", name: "OLL 23" },
          strict: true,
          algs: [
            "R2 D' R U2 R' D R U2 R",
            "R2 D R' U2 R D' R' U2 R'",
            { alg: "R U2 R' U' R U' R' U2 R' U2 R U R' U R", note: "no-d" },
          ],
        },
        {
          id: "oll-24",
          ref: { set: "OLL", name: "OLL 24" },
          strict: true,
          algs: ["r U R' U' r' F R F'", "R U R D R' U' R D' R2", "y2 R' F' r U R U' r' F"],
        },
        {
          id: "oll-25",
          ref: { set: "OLL", name: "OLL 25" },
          strict: true,
          algs: ["F' r U R' U' r' F R", "R' F R B' R' F' R B", "F R' F' r U R U' r'", "R U2 R D R' U2 R D' R2"],
        },
      ],
    },
    {
      id: "cpll",
      goal: "cp",
      view: "pll",
      cases: [
        {
          id: "pll-a",
          ref: { set: "PLL", name: "Aa" },
          strict: true,
          algs: [
            { alg: "x R' U R' D2 R U' R' D2 R2 x'", note: "reddit-fav" },
            "R' F R' B2 R F' R' B2 R2",
            { alg: "R U R' U' R' F R2 U' R' U' R U R' F'", note: "t-perm" },
            "R U R' F' R U R' U' R' F R2 U' R'",
            "x' R' D R' U2 R D' R' U2 R2 x",
          ],
        },
        {
          id: "pll-y",
          ref: { set: "PLL", name: "Y" },
          strict: true,
          algs: [
            "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            "F R' F R2 U' R' U' R U R' F' R U R' U' F'",
            "R2 U' R2 U' R2 U F U F' R2 F U' F'",
          ],
        },
      ],
    },
    {
      id: "epll",
      goal: "pll",
      view: "pll",
      cases: [
        {
          id: "pll-ua",
          ref: { set: "PLL", name: "Ua" },
          strict: true,
          algs: [
            "R U' R U R U R U' R' U' R2",
            "R2 U' R' U' R U R U R U' R",
            "R U R' U R' U' R2 U' R' U R' U R",
            "M2 U M U2 M' U M2",
            "R2 U' S' U2 S U' R2",
          ],
        },
        {
          id: "pll-ub",
          ref: { set: "PLL", name: "Ub" },
          strict: true,
          algs: ["R2 U R U R' U' R' U' R' U R'", "R' U R' U' R' U' R' U R U R2", "M2 U' M U2 M' U' M2"],
        },
        {
          id: "pll-h",
          ref: { set: "PLL", name: "H" },
          strict: true,
          algs: ["R2 U2 R U2 R2 U2 R2 U2 R U2 R2", "M2 U M2 U2 M2 U M2", "R2 S2 R2 U R2 S2 R2"],
        },
        {
          id: "pll-z",
          ref: { set: "PLL", name: "Z" },
          strict: true,
          algs: [
            "R' U' R U' R U R U' R' U R U R2 U' R'",
            "R U R' U R' U' R' U R U' R' U' R2 U R",
            "M' U M2 U M2 U M' U2 M2",
            "M2 U M2 U M' U2 M2 U2 M'",
          ],
        },
      ],
    },
  ],
};
