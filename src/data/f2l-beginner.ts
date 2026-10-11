import type { SectionSource } from "./types";

// Based on ParadoxCubing, "F2L For Beginners | Easy CFOP Tutorial" (youtube.com/watch?v=Hx9ZbPdX8zM).
// Convention: white cross on the bottom, yellow on top, target slot is always front-right (FR).
export const f2lBeginner: SectionSource = {
  id: "f2l-beginner",
  title: "F2L dla początkujących – 5 przypadków",
  description:
    "Intuicyjne F2L wg ParadoxCubing: każdą parę sprowadzasz do jednego z 5 podstawowych przypadków (róg i krawędź w górnej warstwie, nie stykają się). Slot docelowy zawsze z przodu po prawej, róg nad slotem.",
  tips: [
    {
      title: "Krok 1: róg w slocie → wyciągnij go na górę",
      body: "Jeśli róg siedzi na dole w slocie, ustaw go z przodu po prawej i wyciągnij.",
      algs: ["R U R'"],
    },
    {
      title: "Krok 2: krawędź w środkowej warstwie → wyciągnij ją",
      body: "Ustaw slot z krawędzią z przodu po prawej i wybierz wersję, po której krawędź NIE dotyka rogu.",
      algs: ["R U R'", "R U' R'"],
    },
    {
      title: "Krok 3: róg i krawędź się stykają → trik z chowaniem",
      body: "Wariant 1 (róg UFR, krawędź UF): schowaj róg R', przesuń krawędź w lewo/do tyłu, wyjmij róg R. Wariant 2 (róg UFR, krawędź UR): najpierw U', potem schowaj R, przesuń krawędź, R'.",
      algs: ["R' U R", "R' U2 R", "U' R U' R'", "U' R U2 R'"],
    },
    {
      title: "Złota zasada chowania",
      body: "Slot, który podnosisz chowając róg, musi być jeszcze NIEułożony. R' podnosi slot z tyłu po prawej, R podnosi slot z przodu po prawej. Przy ostatniej parze obróć kostkę tak, żeby wolny slot był z tyłu po prawej.",
    },
    {
      title: "Myśl do przodu",
      body: "Zrób U przed R U R', żeby róg wyszedł już oddzielony od krawędzi – pominiesz krok 3.",
      algs: ["U R U R'"],
    },
  ],
  groups: [
    {
      id: "beg-basic",
      title: "5 podstawowych przypadków",
      description: "Róg nad slotem (UFR). „Dopasowane” = górne naklejki rogu i krawędzi mają ten sam kolor.",
      goal: "f2l",
      view: "f2l",
      cases: [
        {
          id: "beg-1a",
          name: "1. Dopasowane",
          subtitle: "biały w prawo, krawędź z tyłu",
          expect: "F2L 8",
          strict: true,
          algs: [
            { alg: "R' U2 R U' F' U F", note: "schowaj róg R', krawędź na przód, wyjmij R, wstaw w lewo" },
            "R' U2 R y U' L' U L",
          ],
        },
        {
          id: "beg-1b",
          name: "1. Dopasowane",
          subtitle: "biały w prawo, krawędź z lewej",
          expect: "F2L 6",
          strict: true,
          algs: ["R' U' R U' F' U F", "R' U' R y U' L' U L"],
        },
        {
          id: "beg-2",
          name: "2. Niedopasowane",
          subtitle: "biały w prawo, krawędź z tyłu",
          expect: "F2L 4",
          strict: true,
          algs: [{ alg: "R U R'", note: "najprostszy – 3 ruchy" }],
        },
        {
          id: "beg-3a",
          name: "3. Biały na górze",
          subtitle: "krawędź z tyłu",
          expect: "F2L 19",
          strict: true,
          algs: [{ alg: "U R U2 R' U R U' R'", note: "krawędź nad jej centrum, zrób parę, wstaw" }],
        },
        {
          id: "beg-3b",
          name: "3. Biały na górze",
          subtitle: "krawędź z lewej",
          expect: "F2L 20",
          strict: true,
          algs: ["U' F' U2 F U' F' U F", "y U' L' U2 L U' L' U L"],
        },
        {
          id: "beg-3c",
          name: "3. Biały na górze",
          subtitle: "krawędź z lewej (druga strona)",
          expect: "F2L 21",
          strict: true,
          algs: ["U2 R U R' U R U' R'", "R U' R' U2 R U R'"],
        },
        {
          id: "beg-3d",
          name: "3. Biały na górze",
          subtitle: "krawędź z tyłu (druga strona)",
          expect: "F2L 22",
          strict: true,
          algs: ["U2 F' U' F U' F' U F", "y U2 L' U' L U' L' U L"],
        },
        {
          id: "beg-4a",
          name: "4. Lustrzane dopasowane",
          subtitle: "biały do przodu, krawędź z lewej",
          expect: "F2L 7",
          strict: true,
          algs: [{ alg: "U' R U2 R' U2 R U' R'", note: "U', schowaj R, krawędź do tyłu, R', U2, wstaw" }],
        },
        {
          id: "beg-4b",
          name: "4. Lustrzane dopasowane",
          subtitle: "biały do przodu, krawędź z tyłu",
          expect: "F2L 5",
          strict: true,
          algs: ["U' R U R' U2 R U' R'"],
        },
        {
          id: "beg-5",
          name: "5. Lustrzane niedopasowane",
          subtitle: "biały do przodu, krawędź z lewej",
          expect: "F2L 3",
          strict: true,
          algs: [{ alg: "F' U' F", note: "lustro przypadku 2" }, "y L' U' L"],
        },
      ],
    },
    {
      id: "beg-pairs",
      title: "Gotowa para – wstawianie",
      description: "Te ruchy kończą przypadki 1, 3 i 4.",
      goal: "f2l",
      view: "f2l",
      cases: [
        { id: "beg-ins-r", name: "Para z prawej", subtitle: "wstawka prawą ręką", expect: "F2L 1", strict: true, algs: ["U R U' R'"] },
        {
          id: "beg-ins-l",
          name: "Para z przodu",
          subtitle: "wstawka lewą stroną",
          expect: "F2L 2",
          strict: true,
          algs: ["U' F' U F", "y U' L' U L"],
        },
      ],
    },
  ],
};
