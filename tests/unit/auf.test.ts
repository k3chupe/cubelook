import { describe, expect, it } from "vitest";
import { applyAlg, AUFS, caseState, GOAL_CHECK, withPreAuf } from "../../src/cube";
import data from "../../src/data/generated.json";
import type { SectionOut } from "../../src/data/types";

const groups = (data as unknown as SectionOut[])
  .filter((s) => ["4lll", "oll", "pll"].includes(s.id))
  .flatMap((s) => s.groups);

describe("rotated last-layer view (pre-AUF)", () => {
  it("every displayed alg solves the displayed case for every view", () => {
    let checked = 0;
    for (const g of groups)
      for (const c of g.cases)
        for (const a of c.algs)
          for (let k = 0; k < 4; k++) {
            const shown = withPreAuf(a.alg, k);
            expect(GOAL_CHECK[g.goal](applyAlg(caseState(`${c.setup} ${AUFS[k]}`), shown)), `${c.id} k=${k}: ${shown}`).toBe(true);
            checked++;
          }
    expect(checked).toBeGreaterThan(400);
  });

  it("drops a leading AUF when viewed from the matching side and merges it otherwise", () => {
    const withU = groups.flatMap((g) => g.cases.flatMap((c) => c.algs)).find((a) => a.alg.startsWith("(U) "))!;
    expect(withPreAuf(withU.alg, 1)).toBe(withU.alg.slice(4));
    expect(withPreAuf(withU.alg, 2)).toBe(`(U') ${withU.alg.slice(4)}`);
    expect(withPreAuf("U R U R'", 1)).toBe("R U R'");
    expect(withPreAuf("U2 R U R'", 1)).toBe("(U) R U R'");
    expect(withPreAuf("(U R U' R')", 1)).toBe("(U') (U R U' R')");
  });

  it("merges the view into a leading y instead of prefixing U", () => {
    const ua = groups.flatMap((g) => g.cases).find((c) => c.id === "full-pll-ua")!;
    const y2 = ua.algs.find((a) => a.alg.startsWith("y2 "))!.alg;
    expect(withPreAuf(y2, 2)).toBe(y2.slice(3));
    expect(withPreAuf("y R U R'", 3)).toBe("y2 R U R'");
    expect(withPreAuf("y' R U R'", 1)).toBe("y2 R U R'");
    expect(withPreAuf("(U2) y2 M2", 2)).toBe("y2 M2");
  });

  it("combines a leading block of AUFs and y rotations into one net turn, also in view 0", () => {
    const ua = groups.flatMap((g) => g.cases).find((c) => c.id === "pll-ua")!;
    const block = ua.algs.find((a) => a.alg.startsWith("(U2) y2 "))!.alg;
    expect(withPreAuf(block, 0)).toBe(block.slice("(U2) y2 ".length));
    expect(withPreAuf("U y R U R'", 0)).toBe("y2 R U R'");
    expect(withPreAuf("y (U) R U R'", 1)).toBe("y R U R'");
    expect(withPreAuf("(U) R U R'", 0)).toBe("(U) R U R'");
    expect(withPreAuf("R U R'", 0)).toBe("R U R'");
  });
});
