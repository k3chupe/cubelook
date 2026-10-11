import { describe, expect, it } from "vitest";
import { segmentAlg, usesSlice, isTwoGen } from "../../src/triggers";

const labels = (alg: string) => segmentAlg(alg).map((s) => s.labelKey ?? "-");

describe("trigger detection", () => {
  it("splits a T-OLL into sexy + sledge", () => {
    expect(labels("R U R' U' R' F R F'")).toEqual(["sexy", "sledge"]);
  });

  it("recognises whole sune before shorter inserts", () => {
    expect(labels("R U R' U R U2 R'")).toEqual(["sune"]);
  });

  it("treats a lone F' U' F as an insert, not a bracket", () => {
    expect(labels("F' U' F")).toEqual(["insertF"]);
  });

  it("brackets F … F' around inner triggers", () => {
    expect(labels("F R U R' U' F'")).toEqual(["bracket", "sexy", "bracket"]);
  });

  it("shows a pre-AUF as its own chip", () => {
    expect(labels("(U2) R U R'")[0]).toBe("auf");
  });

  it("flags slice moves and 2-gen algorithms", () => {
    expect(usesSlice("M2 U M U2 M' U M2")).toBe(true);
    expect(usesSlice("R U R'")).toBe(false);
    expect(isTwoGen("R U' R U R U R U' R' U' R2")).toBe(true);
  });
});

describe("sune family naming", () => {
  it("gives mirror images their own names", () => {
    expect(labels("R U2 R' U' R U' R'")).toEqual(["antisune"]);
    expect(labels("L' U' L U' L' U2 L")).toEqual(["leftSune"]);
    expect(labels("R' U' R U' R' U2 R")).toEqual(["leftSune"]);
    expect(labels("L' U2 L U L' U L")).toEqual(["leftAntisune"]);
  });
});
