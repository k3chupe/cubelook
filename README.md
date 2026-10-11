# CubeLook

Ściąga do kostki Rubika (CFOP), która działa w całości na Twoim komputerze:

- **F2L dla początkujących** – 5 podstawowych przypadków z filmu
  [ParadoxCubing „F2L For Beginners”](https://www.youtube.com/watch?v=Hx9ZbPdX8zM), trik z chowaniem i złota zasada.
- **F2L średniozaawansowane** – wszystkie 41 przypadków (numeracja [SpeedCubeDB](https://speedcubedb.com/a/3x3/F2L)),
  po kilka algorytmów na przypadek, plus triki.
- **4LLL** – 2-look OLL + 2-look PLL; domyślnie wersje bez ruchów środka (M/M2), reszta jako alternatywy.

Funkcje:

- Kolorowe „klocki” triggerów z nazwą nad nimi (sexy, sledge, sune, wstawka, nawias F…).
- ★ ulubiony algorytm, strzałki do zmiany kolejności, „Tylko ulubiony” – jeden algorytm na przypadek.
- Zwijane sekcje, grupy i wskazówki; ✓ oznacza przypadek jako opanowany.
- Animacja 3D na stronie (cubing.js) oraz linki do [Twizzle](https://alpha.twizzle.net/edit/) i [alg.cubing.net](https://alg.cubing.net).
- Języki: polski, angielski, francuski (wykrywane z przeglądarki). Motyw jasny / ciemny / systemowy. Tryb kompaktowy.
- Pełna szerokość ekranu, działa na telefonie. Ctrl+P → „Zapisz jako PDF” drukuje ściągę.
- **Źródła** przy każdym algorytmie, pod tytułem każdej sekcji i w sekcji „Źródła i podziękowania”.
- Każdy algorytm jest sprawdzany symulatorem kostki (`npm run verify`).

Trzymanie kostki: żółty na górze, zielony z przodu, biały krzyż na dole; slot F2L zawsze przód-prawo.

## Uruchomienie (Windows)

1. Zainstaluj [Node.js LTS](https://nodejs.org) i [Git](https://git-scm.com/download/win).
2. W PowerShell:

   ```powershell
   cd C:\Users\piotr\Documents\projekty
   git clone <adres-repozytorium> cubelook
   cd cubelook
   npm install
   npm run dev
   ```

3. Otwórz <http://localhost:4317>. Przydatne parametry: `?lang=en`, `?theme=light`, `?density=compact`.

### Jeden plik HTML (bez serwera, offline)

```powershell
npm run build
```

Powstaje `dist\index.html` (ok. 1,9 MB) – jeden plik z fontami, obrazkami i animacją 3D. Otwierasz go dwuklikiem;
strona nie łączy się z internetem, dopóki sam nie klikniesz linku do Twizzle / alg.cubing.net.

## Skrypty

| Komenda | Co robi |
| --- | --- |
| `npm run dev` | serwer deweloperski na porcie 4317 |
| `npm run data` | buduje `src/data/generated.json` z danych źródłowych |
| `npm run verify` | jak `data`, ale z błędem, gdy któryś ręcznie wpisany algorytm nie rozwiązuje przypadku |
| `npm run build` | weryfikacja + build do `dist/index.html` |
| `npm run preview` | podgląd buildu na porcie 4318 |
| `npm test` | testy jednostkowe (vitest): symulator, triggery, kompletność tłumaczeń, źródła |
| `npm run e2e` | testy Playwright w przeglądarce (zwijanie, ulubione, język, motyw, filtry) |
| `npm run a11y` | skan dostępności AccessLint (przy uruchomionym `npm run dev`) |

## Struktura

- `src/data/*.ts` – przypadki i algorytmy (bez tekstów), `src/data/sources.ts` – rejestr źródeł i bibliotek.
- `src/i18n/locales/{pl,en,fr}.ts` – wszystkie teksty interfejsu i treści.
- `scripts/raw/*.json` – algorytmy pobrane z SpeedCubeDB; `scripts/build-data.ts` – weryfikacja, przypisanie źródeł,
  generowanie `src/data/generated.json`.
- `src/cube.ts` – symulator kostki (obrazki i weryfikacja), `src/triggers.ts` – triggery, `src/diagram.ts` – SVG.
- `src/main.ts`, `src/player.ts`, `src/store.ts`, `src/style.css` – interfejs.

### Nowy język

1. Skopiuj `src/i18n/locales/en.ts` jako np. `de.ts`, zmień nazwę eksportu na `de` i przetłumacz teksty.
2. Dopisz go w `src/i18n/index.ts` do `LOCALES`.
3. `npm test` sprawdzi, czy nie brakuje żadnego klucza.

### Własny algorytm

Dopisz go do listy `algs` danego przypadku w `src/data/*.ts` i uruchom `npm run verify`.
Jeśli algorytm wymaga obrócenia góry przed startem, skrypt sam doda „AUF”. Źródło przypisze się automatycznie
(albo podaj `{ alg, source: "reddit" }`).

## Publikacja (kiedyś, gdy zechcesz)

Nic nie jest publikowane automatycznie – w repozytorium nie ma żadnych workflow wdrożeniowych.
Strona to statyczny plik `dist/index.html`, więc wystarczy dowolny darmowy hosting statyczny:

- **Vercel / Netlify**: nowy projekt z repozytorium, komenda budowania `npm run build`, katalog `dist`.
- **GitHub Pages**: wrzuć zawartość `dist/` na gałąź `gh-pages` albo użyj akcji „Deploy static content”.
- Domena: nazwa `cubelook` miała wolne domeny .com / .app / .dev (stan z października 2026, warto sprawdzić ponownie).

## Źródła

Szczegóły (co dokładnie skąd, liczba algorytmów, licencje bibliotek) są w aplikacji, w sekcji „Źródła i podziękowania”.
Algorytmy: SpeedCubeDB, Dan's Cubing Cheat Sheet, r/Cubers, ParadoxCubing. Animacja: cubing.js (MPL-2.0 / GPL-3.0).
Fonty: Fira Sans / Fira Code (OFL-1.1).
