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

/** Sum of the case probabilities per stage; the remainder is the skip (already solved). */
const stages: [string, CaseOut[], Frac][] = [
  ["full OLL", casesOf("oll"), [215n, 216n]],
  ["full PLL", casesOf("pll"), [71n, 72n]],
  ["4LLL EOLL", casesOf("4lll", "eoll"), [7n, 8n]],
  ["4LLL OCLL", casesOf("4lll", "ocll"), [26n, 27n]],
  ["4LLL CPLL", casesOf("4lll", "cpll"), [5n, 6n]],
  ["4LLL EPLL", casesOf("4lll", "epll"), [11n, 12n]],
];

describe("case probability", () => {
  it("every last-layer case has a probability and no F2L case does", () => {
    for (const s of sections)
      for (const c of s.groups.flatMap((g) => g.cases)) {
        if (["4lll", "oll", "pll"].includes(s.id)) expect(c.prob, c.id).toBeDefined();
        else expect(c.prob, c.id).toBeUndefined();
      }
  });

  it.each(stages)("%s: case probabilities sum to the expected fraction", (_, cs, expected) => {
    expect(sum(cs.map(frac))).toEqual(expected);
  });

  it.each(stages)("%s: every probability is a reduced fraction", (_, cs) => {
    for (const c of cs) expect(gcd(frac(c)[0], frac(c)[1]), c.id).toBe(1n);
  });

  it.each([
    ["full-oll-20", [1n, 216n]], // OLL 20
    ["full-oll-21", [1n, 108n]], // OLL 21 (H)
    ["full-oll-57", [1n, 108n]], // OLL 57
    ["full-pll-ua", [1n, 18n]], // PLL Ua
    ["full-pll-h", [1n, 72n]], // PLL H
    ["full-pll-e", [1n, 36n]], // PLL E
  ])("%s has its known probability", (id, expected) => {
    expect(frac(byId(id))).toEqual(expected);
  });
});
