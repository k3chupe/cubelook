import { describe, expect, it } from "vitest";
import { LOCALES, FALLBACK_LOCALE } from "../../src/i18n";
import data from "../../src/data/generated.json";
import type { SectionOut } from "../../src/data/types";
import { SOURCES, TOOLS } from "../../src/data/sources";

const sections = data as unknown as SectionOut[];

/** Flattens nested keys: { a: { b: 1 } } → ["a.b"]. Plural forms are compared as a whole. */
function keys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return [prefix];
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.some(([k]) => k === "other")) return [prefix];
  return entries.flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("translations", () => {
  const reference = new Set(keys(LOCALES.pl));
  it.each(Object.keys(LOCALES))("%s has exactly the same keys as pl", (code) => {
    const own = new Set(keys(LOCALES[code as keyof typeof LOCALES]));
    expect([...reference].filter((k) => !own.has(k))).toEqual([]);
    expect([...own].filter((k) => !reference.has(k))).toEqual([]);
  });

  it("every section, group, tip and note id has text in every language", () => {
    for (const [code, m] of Object.entries(LOCALES)) {
      for (const s of sections) {
        expect(m.content.sections[s.id], `${code} section ${s.id}`).toBeTruthy();
        for (const tip of s.tips ?? []) expect(m.content.tips[tip.id], `${code} tip ${tip.id}`).toBeTruthy();
        for (const g of s.groups) {
          expect(m.content.groups[g.id], `${code} group ${g.id}`).toBeTruthy();
          for (const c of g.cases)
            for (const a of c.algs) if (a.note) expect(m.content.notes[a.note], `${code} note ${a.note}`).toBeTruthy();
        }
      }
      for (const id of Object.keys(SOURCES)) expect(m.content.sources[id], `${code} source ${id}`).toBeTruthy();
      for (const tool of TOOLS) expect(m.content.sources[`tool-${tool.key}`], `${code} tool ${tool.key}`).toBeTruthy();
    }
  });

  it("falls back to an existing locale", () => {
    expect(LOCALES[FALLBACK_LOCALE]).toBeDefined();
  });
});

describe("generated data", () => {
  const algs = sections.flatMap((s) => s.groups.flatMap((g) => g.cases.flatMap((c) => c.algs)));

  it("every algorithm has a known source", () => {
    for (const a of algs) expect(SOURCES[a.source], a.alg).toBeDefined();
  });

  it("covers all 41 numbered F2L cases", () => {
    const f2l = sections.find((s) => s.id === "f2l-intermediate")!;
    expect(f2l.groups.flatMap((g) => g.cases)).toHaveLength(41);
  });

  it("each case has at most one recommended alg, at index 0", () => {
    for (const c of sections.flatMap((s) => s.groups.flatMap((g) => g.cases))) {
      const recommended = c.algs.filter((a) => a.recommended).length;
      expect(recommended, c.id).toBeLessThanOrEqual(1);
      if (recommended) expect(c.algs[0].recommended, c.id).toBe(true);
    }
  });

  it("every f2l-intermediate case has a recommended alg", () => {
    const f2l = sections.find((s) => s.id === "f2l-intermediate")!;
    for (const c of f2l.groups.flatMap((g) => g.cases)) expect(c.algs[0]?.recommended, c.id).toBe(true);
  });
});
