import { invertAlg } from "./cube";
import type { CaseView } from "./data/types";

/** Yellow on top, green in front (cubing.js default is white on top). */
export const ORIENTATION = "z2";

const plain = (alg: string) => alg.replace(/[()]/g, "").replace(/\s+/g, " ").trim();

const STICKERING: Record<CaseView, string> = {
  f2l: "F2L",
  eoll: "EOLL",
  oll: "OLL",
  pll: "PLL",
};

export function stickeringFor(view: CaseView): string {
  return STICKERING[view];
}

/** alg.cubing.net encodes spaces as "_" and primes as "-". */
const acnEncode = (alg: string) => encodeURIComponent(alg.replace(/ /g, "_").replace(/'/g, "-")).replace(/%5F/g, "_");

export function algCubingNetUrl(alg: string, title: string): string {
  const a = plain(alg);
  const setup = `${ORIENTATION} ${invertAlg(a)}`;
  return (
    "https://alg.cubing.net/?" +
    `setup=${acnEncode(setup)}&alg=${acnEncode(a)}&title=${encodeURIComponent(title)}`
  );
}

export function twizzleUrl(alg: string, view: CaseView, title: string): string {
  const params = new URLSearchParams({
    alg: plain(alg),
    "setup-alg": ORIENTATION,
    "setup-anchor": "end",
    stickering: STICKERING[view],
    title,
  });
  return `https://alpha.twizzle.net/edit/?${params.toString()}`;
}
