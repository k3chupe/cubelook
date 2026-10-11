import type { SectionSource } from "./types";

// Based on ParadoxCubing, "F2L For Beginners | Easy CFOP Tutorial" (youtube.com/watch?v=Hx9ZbPdX8zM).
// Convention: white cross on the bottom, yellow on top, target slot is always front-right (FR).
export const f2lBeginner: SectionSource = {
  id: "f2l-beginner",
  basedOn: ["paradox"],
  tips: [
    { id: "beg-step1", algs: ["R U R'"] },
    { id: "beg-step2", algs: ["R U R'", "R U' R'"] },
    { id: "beg-step3", algs: ["R' U R", "R' U2 R", "U' R U' R'", "U' R U2 R'"] },
    { id: "beg-golden" },
    { id: "beg-ahead", algs: ["U R U R'"] },
  ],
  groups: [
    {
      id: "beg-basic",
      goal: "f2l",
      view: "f2l",
      cases: [
        {
          id: "beg-1a",
          expect: "F2L 8",
          strict: true,
          source: "paradox",
          algs: [{ alg: "R' U2 R U' F' U F", note: "beg-1a" }, "R' U2 R y U' L' U L"],
        },
        { id: "beg-1b", expect: "F2L 6", strict: true, source: "paradox", algs: ["R' U' R U' F' U F", "R' U' R y U' L' U L"] },
        { id: "beg-2", expect: "F2L 4", strict: true, source: "paradox", algs: [{ alg: "R U R'", note: "beg-2" }] },
        {
          id: "beg-3a",
          expect: "F2L 19",
          strict: true,
          source: "paradox",
          algs: [{ alg: "U R U2 R' U R U' R'", note: "beg-3a" }],
        },
        { id: "beg-3b", expect: "F2L 20", strict: true, source: "paradox", algs: ["U' F' U2 F U' F' U F", "y U' L' U2 L U' L' U L"] },
        { id: "beg-3c", expect: "F2L 21", strict: true, source: "paradox", algs: ["U2 R U R' U R U' R'", "R U' R' U2 R U R'"] },
        { id: "beg-3d", expect: "F2L 22", strict: true, source: "paradox", algs: ["U2 F' U' F U' F' U F", "y U2 L' U' L U' L' U L"] },
        {
          id: "beg-4a",
          expect: "F2L 7",
          strict: true,
          source: "paradox",
          algs: [{ alg: "U' R U2 R' U2 R U' R'", note: "beg-4a" }],
        },
        { id: "beg-4b", expect: "F2L 5", strict: true, source: "paradox", algs: ["U' R U R' U2 R U' R'"] },
        {
          id: "beg-5",
          expect: "F2L 3",
          strict: true,
          source: "paradox",
          algs: [{ alg: "F' U' F", note: "beg-5" }, "y L' U' L"],
        },
      ],
    },
    {
      id: "beg-pairs",
      goal: "f2l",
      view: "f2l",
      cases: [
        { id: "beg-ins-r", expect: "F2L 1", strict: true, source: "paradox", algs: ["U R U' R'"] },
        { id: "beg-ins-l", expect: "F2L 2", strict: true, source: "paradox", algs: ["U' F' U F", "y U' L' U L"] },
      ],
    },
  ],
};
