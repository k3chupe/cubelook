import { describe, expect, it } from "vitest";
import { applyAlg, caseState, findPreAuf, invertAlg, isSolved, solvedCube } from "../../src/cube";

const repeat = (alg: string, n: number) => Array(n).fill(alg).join(" ");

describe("cube simulator", () => {
  it("sexy move has order 6", () => {
    expect(isSolved(applyAlg(solvedCube(), repeat("R U R' U'", 6)))).toBe(true);
    expect(isSolved(applyAlg(solvedCube(), repeat("R U R' U'", 3)))).toBe(false);
  });

  it("T-perm is a PLL of order 2", () => {
    const t = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(isSolved(applyAlg(solvedCube(), t))).toBe(false);
    expect(isSolved(applyAlg(solvedCube(), repeat(t, 2)))).toBe(true);
  });

  it.each(["M R' r", "E U' u", "S F f'", "x M L R'", "y E D U'", "z S' B F'", "d D' E'"])(
    "slice / wide / rotation identity: %s",
    (alg) => expect(isSolved(applyAlg(solvedCube(), alg))).toBe(true),
  );

  it("inverts algorithms", () => {
    expect(invertAlg("R U2 R' F'")).toBe("F R U2 R'");
    expect(isSolved(applyAlg(solvedCube(), `R U R' F2 ${invertAlg("R U R' F2")}`))).toBe(true);
  });

  it("finds the pre-AUF for a rotated last-layer case", () => {
    const ua = caseState(invertAlg("M2 U M U2 M' U M2"));
    expect(findPreAuf(ua, "R U' R U R U R U' R' U' R2", "pll")).not.toBeNull();
  });
});
