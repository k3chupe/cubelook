import { describe, expect, it } from "vitest";
import data from "../../src/data/generated.json";
import type { CaseOut, SectionOut } from "../../src/data/types";

const sections = data as unknown as SectionOut[];
type Frac = [bigint, bigint];

const gcd = (a: bigint, b: bigint): bigint => (b ? gcd(b, a % b) : a);
/** Exact, reduced sum of fractions. */
function sum(fs: Frac[]): Frac {
  return fs.reduce<Frac>(
    ([n, d], [a, b]) => {
      const num = n * b + a * d;
      const den = d * b;
      const g = gcd(num, den);
      return [num / g, den / g];
    },
    [0n, 1n],
  );
}

const frac = (c: CaseOut): Frac => {
  if (!c.prob) throw new Error(`${c.id} has no prob`);
  return [BigInt(c.prob[0]), BigInt(c.prob[1])];
};
const casesOf = (sectionId: string, groupId?: string): CaseOut[] =>
  sections
    .filter((s) => s.id === sectionId)
    .flatMap((s) => s.groups.filter((g) => !groupId || g.id === groupId).flatMap((g) => g.cases));
const byId = (id: string): CaseOut => sections.flatMap((s) => s.groups.flatMap((g) => g.cases)).find((c) => c.id === id)!;

/** Probabilities of the cases of one stage: they add up to 1, the skip is not counted. */
const stages: [string, CaseOut[], Frac][] = [
  ["full OLL", casesOf("oll"), [1n, 1n]],
  ["full PLL", casesOf("pll"), [1n, 1n]],
  ["4LLL EOLL", casesOf("4lll", "eoll"), [1n, 1n]],
  ["4LLL OCLL", casesOf("4lll", "ocll"), [1n, 1n]],
  ["4LLL CPLL", casesOf("4lll", "cpll"), [1n, 1n]],
  ["4LLL EPLL", casesOf("4lll", "epll"), [1n, 1n]],
];

describe("case probability", () => {
  it("every last-layer case has a probability and no F2L case does", () => {
    for (const s of sections)
      for (const c of s.groups.flatMap((g) => g.cases)) {
        if (["4lll", "oll", "pll"].includes(s.id)) expect(c.prob, c.id).toBeDefined();
        else expect(c.prob, c.id).toBeUndefined();
      }
  });

  it.each(stages)("%s: case probabilities sum to exactly 1", (_, cs, expected) => {
    expect(sum(cs.map(frac))).toEqual(expected);
  });

  it.each(stages)("%s: every probability is a reduced fraction", (_, cs) => {
    for (const c of cs) expect(gcd(frac(c)[0], frac(c)[1]), c.id).toBe(1n);
  });

  it.each([
    ["full-oll-20", [1n, 215n]], // OLL 20
    ["full-oll-21", [2n, 215n]], // OLL 21 (H)
    ["full-oll-57", [2n, 215n]], // OLL 57
    ["full-pll-ua", [4n, 71n]], // PLL Ua
    ["full-pll-h", [1n, 71n]], // PLL H
    ["full-pll-e", [2n, 71n]], // PLL E
    ["eoll-dot", [1n, 7n]],
    ["eoll-line", [2n, 7n]], // OLL 45
    ["eoll-l", [4n, 7n]], // OLL 44
    ["oll-21", [1n, 13n]], // OCLL H
    ["oll-27", [2n, 13n]], // OCLL
    ["pll-a", [4n, 5n]], // CPLL Aa
    ["pll-y", [1n, 5n]], // CPLL Y
    ["pll-ua", [4n, 11n]], // EPLL Ua
    ["pll-h", [1n, 11n]], // EPLL H
    ["pll-z", [2n, 11n]], // EPLL Z
  ])("%s has its known probability", (id, expected) => {
    expect(frac(byId(id))).toEqual(expected);
  });
});
