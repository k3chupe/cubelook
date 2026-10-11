import type { SectionSource } from "./types";

// Candidates collected from cubingcheatsheet.com, speedcubedb.com and r/Cubers.
// Order = default preference; RU / no-M versions first. Algorithms that fail verification are dropped.
export const fourLLL: SectionSource = {
  id: "4lll",
  title: "4LLL – ostatnia warstwa w 4 krokach",
  description:
    "2-look OLL + 2-look PLL. Na start ustawiłem wersje bez M/M2 (tylko R, U, F, D), wersje ze środkiem zostają jako alternatywy.",
  tips: [
    {
      title: "Kolejność kroków",
      body: "1) Krzyż na górze (krawędzie) → 2) cała góra żółta (rogi) → 3) rogi na miejsca → 4) krawędzie na miejsca. Przed każdym algorytmem ustaw górę ruchem U tak jak na obrazku.",
    },
    {
      title: "Kropka = linia + L",
      body: "Zamiast osobnego algorytmu na kropkę możesz zrobić linię, a potem L – nic nowego do nauczenia.",
      algs: ["F R U R' U' F'", "f R U R' U' f'"],
    },
  ],
  groups: [
    {
      id: "eoll",
      title: "1. Krzyż na górze (EOLL)",
      goal: "eo",
      view: "eoll",
      cases: [
        {
          id: "eoll-line",
          name: "Linia",
          subtitle: "linia poziomo",
          strict: true,
          algs: ["F R U R' U' F'", "f U R U' R' f'"],
        },
        {
          id: "eoll-l",
          name: "Małe L",
          subtitle: "L z tyłu po lewej",
          strict: true,
          algs: ["f R U R' U' f'", "F U R U' R' F'", "f U R U' R' f' U F R U R' U' F'"],
        },
        {
          id: "eoll-dot",
          name: "Kropka",
          strict: true,
          algs: [
            { alg: "F R U R' U' F' f R U R' U' f'", note: "linia + L" },
            "F R U R' U' S R U R' U' f'",
            "R U2 R2 F R F' U2 R' F R F'",
            "R U2 R2' F R F' U2 R' F R F'",
          ],
        },
      ],
    },
    {
      id: "ocll",
      title: "2. Cała góra żółta (OCLL)",
      goal: "oll",
      view: "oll",
      cases: [
        {
          id: "oll-27",
          name: "Sune",
          subtitle: "OLL 27",
          strict: true,
          algs: ["R U R' U R U2 R'", "L' U2 L U L' U L", "y' R' U2 R U R' U R"],
        },
        {
          id: "oll-26",
          name: "Antysune",
          subtitle: "OLL 26",
          strict: true,
          algs: [
            { alg: "R U2 R' U' R U' R'", note: "ulubiona wersja z r/Cubers – prawa ręka jak Sune" },
            "R' U' R U' R' U2 R",
            "L' U' L U' L' U2 L",
          ],
        },
        {
          id: "oll-21",
          name: "H (dwie pary świateł)",
          subtitle: "OLL 21",
          strict: true,
          algs: [
            "R U2 R' U' R U R' U' R U' R'",
            "R U R' U R U' R' U R U2 R'",
            "R' U' R U' R' U R U' R' U2 R",
            { alg: "F R U R' U' R U R' U' R U R' U' F'", note: "F + 3× sexy + F' – łatwy do zapamiętania" },
          ],
        },
        {
          id: "oll-22",
          name: "Pi (bruno)",
          subtitle: "OLL 22",
          strict: true,
          algs: ["R U2 R2 U' R2 U' R2 U2 R", "R' U2 R2 U R2 U R2 U2 R'", "f R U R' U' f' F R U R' U' F'"],
        },
        {
          id: "oll-23",
          name: "Światła (headlights)",
          subtitle: "OLL 23",
          strict: true,
          algs: [
            "R2 D' R U2 R' D R U2 R",
            "R2 D R' U2 R D' R' U2 R'",
            { alg: "R U2 R' U' R U' R' U2 R' U2 R U R' U R", note: "antysune + lewe sune – bez D" },
          ],
        },
        {
          id: "oll-24",
          name: "T (czołg)",
          subtitle: "OLL 24",
          strict: true,
          algs: ["r U R' U' r' F R F'", "R U R D R' U' R D' R2", "y2 R' F' r U R U' r' F"],
        },
        {
          id: "oll-25",
          name: "Muszka (bowtie)",
          subtitle: "OLL 25",
          strict: true,
          algs: ["F' r U R' U' r' F R", "R' F R B' R' F' R B", "F R' F' r U R U' r'", "R U2 R D R' U2 R D' R2"],
        },
      ],
    },
    {
      id: "cpll",
      title: "3. Rogi na miejsca (CPLL)",
      goal: "cp",
      view: "pll",
      cases: [
        {
          id: "pll-a",
          name: "Światła z tyłu",
          subtitle: "A-perm (Aa)",
          strict: true,
          algs: [
            { alg: "x R' U R' D2 R U' R' D2 R2 x'", note: "faworyt z r/Cubers" },
            "R' F R' B2 R F' R' B2 R2",
            { alg: "R U R' U' R' F R2 U' R' U' R U R' F'", note: "T-perm też działa (przy okazji zamienia krawędzie)" },
            "R U R' F' R U R' U' R' F R2 U' R'",
            "x' R' D R' U2 R D' R' U2 R2 x",
          ],
        },
        {
          id: "pll-y",
          name: "Bez świateł",
          subtitle: "Y-perm (zamiana po przekątnej)",
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
      title: "4. Krawędzie na miejsca (EPLL)",
      goal: "pll",
      view: "pll",
      cases: [
        {
          id: "pll-ua",
          name: "Ua",
          subtitle: "3 krawędzie w prawo",
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
          name: "Ub",
          subtitle: "3 krawędzie w lewo",
          strict: true,
          algs: [
            "R2 U R U R' U' R' U' R' U R'",
            "R' U R' U' R' U' R' U R U R2",
            "M2 U' M U2 M' U' M2",
          ],
        },
        {
          id: "pll-h",
          name: "H",
          subtitle: "zamiana naprzeciwko ×2",
          strict: true,
          algs: ["R2 U2 R U2 R2 U2 R2 U2 R U2 R2", "M2 U M2 U2 M2 U M2", "R2 S2 R2 U R2 S2 R2"],
        },
        {
          id: "pll-z",
          name: "Z",
          subtitle: "zamiana sąsiednich ×2",
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
