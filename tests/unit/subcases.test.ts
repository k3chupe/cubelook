import { describe, expect, it } from "vitest";
import data from "../../src/data/generated.json";
import type { CaseOut, SectionOut } from "../../src/data/types";
import { applyAlg, caseState, GOAL_CHECK } from "../../src/cube";
import { orderSubcases } from "../../src/store";

const sections = data as unknown as SectionOut[];
const all = sections.flatMap((s) => s.groups.flatMap((g) => g.cases));
const byId = (id: string): CaseOut => all.find((c) => c.id === id)!;
const withSubcases = sections.find((s) => s.id === "4lll")!.groups.flatMap((g) => g.cases).filter((c) => c.subcases);

/** Whether `alg` fully solves the full case (OLL or PLL) after some pre-AUF and y rotation. */
function solves(alg: string, full: CaseOut): boolean {
  const goal = full.id.startsWith("full-oll-") ? "oll" : "pll";
  const bare = alg.replace(/^\(.*?\)\s*/, "");
  return ["", "U", "U2", "U'"].some((u) =>
    ["", "y", "y2", "y'"].some((y) => GOAL_CHECK[goal](applyAlg(caseState(full.setup), `${u} ${y} ${bare}`))),
  );
}

describe("default subcase", () => {
  it("no headlights defaults to Y, headlights to Aa", () => {
    expect(byId("pll-y").defaultSubcase).toBe("full-pll-y");
    expect(byId("pll-a").defaultSubcase).toBe("full-pll-aa");
  });

  it.each(withSubcases.map((c) => [c.id, c] as const))("%s: default is a real subcase its recommended alg solves", (_, c) => {
    const rec = (c.algs.find((a) => a.recommended) ?? c.algs[0]).alg;
    const first = c.subcases!.find((id) => solves(rec, byId(id)));
    expect(c.defaultSubcase).toBe(first);
    if (c.defaultSubcase) expect(c.subcases).toContain(c.defaultSubcase);
  });
});

describe("orderSubcases", () => {
  const items = [
    { id: "a", p: 1 },
    { id: "b", p: 3 },
    { id: "c", p: 2 },
    { id: "d", p: 4 },
  ];
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

  it("sorts by share or keeps data order", () => {
    expect(ids(orderSubcases(items, undefined, {}, "freqDesc"))).toEqual(["d", "b", "c", "a"]);
    expect(ids(orderSubcases(items, undefined, {}, "freqAsc"))).toEqual(["a", "c", "b", "d"]);
    expect(ids(orderSubcases(items, undefined, {}, "groups"))).toEqual(["a", "b", "c", "d"]);
  });

  it("pins the chosen subcase, then not learned, then learned", () => {
    const learned = { d: true, b: true, a: true };
    expect(ids(orderSubcases(items, "a", learned, "freqDesc"))).toEqual(["a", "c", "d", "b"]);
    expect(ids(orderSubcases(items, "c", learned, "groups"))).toEqual(["c", "a", "b", "d"]);
  });

  it("does not change its input", () => {
    orderSubcases(items, "d", {}, "freqDesc");
    expect(ids(items)).toEqual(["a", "b", "c", "d"]);
  });
});
