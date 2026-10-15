# CubeLook — co jest do zrobienia

Backlog (2026-10-14). Decyzje z grillu — poniżej; MVP → dalej na dole.

## Decyzje (ustalone)

| Temat | Decyzja |
| --- | --- |
| Produkt | **Cheat sheet** (ściąga), nie trainer — na MVP |
| Dane | **Build-time sync** (C): sync przy buildzie → `generated.json`; runtime offline/local |
| MVP | **P1** expand/collapse → **P2** recommended + sync → **P3** learning paths (4LLL \| OLL+PLL) |
| Po MVP | % / częstość, inverse/related; ranking / finger tricks później |
| Poza MVP | Scramble, timer, targeted practice — twardo poza, dopóki MVP nie done |
| Ścieżki | Segment **4LLL \| OLL+PLL**; default **4LLL**; 2OLL+PLL później; ZBLL poza |
| Algi | **Recommended** = pierwszy ze SCDB (badge); pierwszy visit → to też **Favorite**; potem ★ = user (F1) |
| Filtry | `hideSlice` zostaje, default off; **one-handed** osobna przełączka (nie tożsame z M/S) — później |
| Preferencje | Filtry nie resetują Favorite / `order`; stan w localStorage |
| Algi LL | Wiodący `y`/`U` wchodzi do **diagramu**, nie do tekstu alga; kotwica rotacji = pierwszy alg case'a (Recommended); przycisk „Obróć widok” dalej dodaje `U`/`y` do tekstu |

## 1. UX — zwijanie / rozwijanie ← **teraz**

DoD (D1): klik toggle’uje tylko cel; scroll / element pod kursorem stabilny; e2e na główne scenariusze. Pełny refactor renderu (D2) tylko jeśli D1 nie wystarczy.

- [x] Naprawić expand/collapse: klik nie powinien rozwijać „wszystkiego naraz” ani przesuwać treści spod kursora
- [x] Zachować pozycję scrolla / elementu pod kursorem przy toggle
- [x] Sprawdzić interakcję z „Tylko ulubiony” + „+N alternatyw” (skoki layoutu)
- [x] Diagramy LL jak na kostce: OCLL pełny widok (krzyż + rogi) + pełny pierścień boczny; EOLL tylko góra (kropka/linia/L); CPLL bez zmian; kontrast szarości
- [x] Algi LL bez wiodącego `y`/`(U)` w widoku bazowym: rotacja w diagramie (kotwica = Recommended); „Obróć widok” dalej dodaje `U`/`y`

## 2. Dane algorytmów (P2)

- [x] Build-time sync ze SpeedCubeDB (skrypt → raw → `generated.json`); kolejność `algs[]`: pierwszy = najpopularniejszy = **Recommended**
- [x] Badge / oznaczenie **Recommended** na pierwszym ze SCDB
- [x] Pierwszy visit: Recommended = startowy Favorite; po ★ rządzi user (`order` w settings)
- [ ] Alternatywy niżej / za „+N” (już częściowo przez `onlyFav`)
- [x] Favorite osobno per kontekst filtra (Bez M/S on → własny wybór; off → wraca poprzedni)
- [x] `npm run verify` nie może nadpisywać `generated.json`
- [ ] *(później)* `npm run sync` — odświeżanie `scripts/raw` ze SpeedCubeDB z sieci (dziś to statyczny zrzut)

## 3. Modularność ścieżki nauki (P3)

Jedna strona, konfiguracja „co pokazujemy”, nie osobne buildy. UI: segmented control w headerze.

- [x] Segment **4LLL** \| **OLL + PLL** (preferencja w settings; default 4LLL)
- [x] Pełne OLL + PLL z raw → UI
- [ ] Potem: **2OLL + PLL**
- [ ] Później / poza: **ZBLL**, inne warianty CFOP LL

## 4. Jakość / ranking algorytmów

- [ ] Krótki opis **dlaczego** dany alg jest uznany za lepszy
- [ ] Automatyczny ranking (długość, HTM, popularność SCDB…)
- [ ] Finger tricks: notatki / linki na start

## 5. Filtry (po MVP / przy okazji P2–P3)

- [ ] Zostawić **Bez M/S** (`hideSlice`), default off
- [ ] Dodać **one-handed** (osobna przełączka; ≠ hideSlice)
- [ ] Przełączanie filtrów **nie nadpisuje** Favorite / `order` (strona pamięta wybór usera)

## 6. Export / import Favorite

- [ ] Export ulubionych (podzielić się z kolegą / backup)
- [ ] Import z powrotem
- [ ] **Stabilna tożsamość**: klucze = `caseId` + treść alga (albo kanoniczny id), **nie indeks** na liście — indeks psuje się przy zmianie kolejności / wersji danych
- [ ] Strategia migracji gdy zniknie alg lub zmieni się zestaw case’ów (ostrzeżenie / drop wpisu, nie ciche „inny drugi alg”)

## 7. Scramble + timer — poza MVP

- [ ] Scramble generator
- [ ] Timer (inspection, hold-to-start, AO5/AO12 — scope do ustalenia)
- [ ] Integracja ze ściągą, nie osobna apka

## 8. Tryb nauki (targeted scrambles) — poza MVP

- [ ] „Uczę się tych przypadków” → scramble’e pod te case’y
- [ ] Lista do nauki / opanowane pod scramble
- [ ] Po scramble: podpowiedź case’a + alg

## 9. Sortowanie po częstości

- [x] Przy każdym case LL: **% szans** w etapie (bez F2L)
- [x] Sort rosnąco / malejąco; domyślnie najczęstsze pierwsze (grupy zostają)
- [x] „Kolejny krok” pod EOLL / CPLL: pełne case’y (subcases) z jednym algiem, klik → okienko z pełnym case’em
- [x] Sortowanie nie przestawia etapów / grup; % w obrębie etapu bez skipa

## 10. Grupowanie powiązanych algów / case’ów

- [ ] Podobne, inverse, alg ×2 = inny case
- [ ] Powiązania w UI
- [ ] Opcjonalnie: uczenie parami
- [ ] „Obróć widok” sprzęga alg przez y^k (przeliterowanie) zamiast dodawać `U`/`y` → „case tyłem” bez nowych danych; ulubiony zostaje jeden per case
- [ ] Graf relacji mirror / inverse / conjugate generowany przy buildzie (zalążki: notatki `mirror-*`) → sugestie ulubionego po rotacji („lubisz X → z tej strony pewnie jego analog”)

## Proponowana kolejność

1. **P1** Fix expand/collapse (D1)
2. **P2** Recommended badge + build-time sync (C)
3. **P3** Learning paths (segment 4LLL \| OLL+PLL)
4. Sort po częstości + %
5. Grupowanie inverse / related
6. One-handed + dopięcie filtrów / export Favorite (stabilne id)
7. Ranking + finger tricks
8. *(epik później)* Scramble + timer + targeted practice

## Otwarte (nie blokują P1)

1. Finger tricks: własne treści vs linki?
2. ADR „Build-time sync” — spisać przy P2?
3. Format pliku exportu Favorite (JSON? URL hash?)
