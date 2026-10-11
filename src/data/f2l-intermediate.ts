import type { SectionSource, Tip } from "./types";

export const f2lGroupTitles: Record<string, { title: string; description: string }> = {
  "Free Pairs": { title: "Proste wstawki", description: "Para gotowa lub rozdzielona tylko jednym ruchem." },
  "Connected Pairs": { title: "Połączone pary", description: "Róg i krawędź na górze, stykają się, ale źle." },
  "Disconnected Pairs": { title: "Rozłączone pary", description: "Róg i krawędź na górze, osobno." },
  "Corner In Slot": { title: "Róg w slocie", description: "Krawędź na górze, róg na dole w slocie." },
  "Edge In Slot": { title: "Krawędź w slocie", description: "Róg na górze, krawędź w środkowej warstwie." },
  "Pieces In Slot": { title: "Oba elementy w slocie", description: "Róg i krawędź siedzą w slocie, ale źle." },
};

export const f2lGroupOrder = [
  "Free Pairs",
  "Disconnected Pairs",
  "Connected Pairs",
  "Corner In Slot",
  "Edge In Slot",
  "Pieces In Slot",
];

export const f2lIntermediateTips: Tip[] = [
  {
    title: "Ruch U zamiast obrotu kostki",
    body: "Zamiast y / y' ustaw parę ruchem U i wstaw ją ruchem F lub lewą stroną bez obracania – szybciej i nie gubisz elementów z oczu.",
    algs: ["U' F' U F", "y U' L' U L"],
  },
  {
    title: "Wstawki do tylnych slotów",
    body: "Tylne sloty możesz robić bez obrotu: tył-prawo R' … R, tył-lewo L … L'.",
    algs: ["R' U' R", "R' U R", "L U L'", "L U' L'"],
  },
  {
    title: "Sledgehammer jako wstawka",
    body: "Gdy para stoi „odwrotnie” w górze, R' F R F' (sledgehammer) wstawia ją bez ruchu U.",
    algs: ["R' F R F'", "F R' F' R"],
  },
  {
    title: "Wykorzystaj pusty slot (keyhole)",
    body: "Jeśli sąsiedni slot jest pusty, rozdzielaj pary przez niego, a nie przez slot docelowy. Przykład: krawędź dobrze, róg na górze – wstaw róg przez „dziurkę od klucza”.",
    algs: ["d R' U' R d'", "R U' R' d R' U' R"],
  },
  {
    title: "Najpierw szukaj par, które są już prawie gotowe",
    body: "Rób najpierw pary z przypadków 3-4 ruchowych, a trudne zostaw na koniec – często same się „naprawią”.",
  },
  {
    title: "Lookahead",
    body: "Kręć wolniej i równo. Podczas wstawiania jednej pary szukaj wzrokiem rogu i krawędzi następnej.",
  },
];

export const f2lIntermediateBase: Omit<SectionSource, "groups"> = {
  id: "f2l-intermediate",
  title: "F2L średniozaawansowane – 41 przypadków",
  description:
    "Wszystkie przypadki F2L dla slotu przód-prawo (numeracja jak na speedcubedb.com). Po kilka algorytmów na przypadek – wersje z M/S są na końcu.",
  defaultCollapsed: true,
  tips: f2lIntermediateTips,
};
