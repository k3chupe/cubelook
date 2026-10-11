# Kostka Rubika – ściąga F2L + 4LLL

Lokalna strona-ściąga do nauki układania kostki Rubika metodą CFOP:

- **F2L dla początkujących** – 5 podstawowych przypadków z filmu
  [ParadoxCubing „F2L For Beginners”](https://www.youtube.com/watch?v=Hx9ZbPdX8zM) plus trik z chowaniem i złota zasada.
- **F2L średniozaawansowane** – wszystkie 41 przypadków (numeracja jak na
  [speedcubedb.com](https://speedcubedb.com/a/3x3/F2L)), po kilka algorytmów na przypadek, plus triki.
- **4LLL** – 2-look OLL + 2-look PLL; domyślnie wersje bez ruchów środka (M/M2), reszta jako alternatywy
  (preferencje m.in. z [r/Cubers](https://www.reddit.com/r/Cubers/comments/boukt3/)).

Funkcje:

- Kolorowe „klocki” triggerów z nazwą nad nimi (sexy, sledge, sune, wstawka, nawias F…).
- ★ wybór ulubionego algorytmu, strzałki do zmiany kolejności, tryb „Tylko ulubiony” – jeden algorytm na przypadek.
- Każda sekcja, grupa i lista wskazówek jest zwijana; ✓ oznacza przypadek jako opanowany (można go ukryć).
- Link do wirtualnej kostki ([alg.cubing.net](https://alg.cubing.net) i [Twizzle](https://alpha.twizzle.net/edit/))
  i animacja 3D bezpośrednio na stronie (cubing.js).
- Wszystko zapisuje się w przeglądarce (localStorage). Ctrl+P → „Zapisz jako PDF” drukuje ściągę.
- Każdy algorytm jest automatycznie sprawdzany symulatorem kostki (`npm run verify`).

Trzymanie kostki: żółty na górze, zielony z przodu, biały krzyż na dole; slot F2L zawsze przód-prawo.

## Jak mieć projekt u siebie (Windows)

1. Zainstaluj [Node.js LTS](https://nodejs.org) i [Git](https://git-scm.com/download/win).
2. W PowerShell:

   ```powershell
   cd C:\Users\piotr\Documents\projekty
   git clone <adres-repozytorium> kostka-rubika
   cd kostka-rubika
   npm install
   npm run dev
   ```

3. Otwórz <http://localhost:4317>.

### Jeden plik HTML (bez serwera)

```powershell
npm run build
```

Powstaje `dist\index.html` – jeden plik, który otworzysz dwuklikiem albo skopiujesz gdziekolwiek.
Obrazki przypadków i linki działają offline; animacja 3D na stronie potrzebuje przeglądarki, która pozwala
uruchamiać moduły z pliku (w razie problemu użyj linków „kostka” / „Twizzle” albo `npm run preview`).

## Skrypty

| Komenda | Co robi |
| --- | --- |
| `npm run dev` | serwer deweloperski na porcie 4317 |
| `npm run data` | buduje `src/data/generated.json` z danych źródłowych |
| `npm run verify` | jak `data`, ale kończy się błędem, gdy któryś ręcznie wpisany algorytm nie rozwiązuje przypadku |
| `npm run build` | weryfikacja + build do `dist/index.html` |
| `npm run preview` | podgląd buildu na porcie 4318 |

## Struktura

- `src/data/f2l-beginner.ts`, `src/data/f2l-intermediate.ts`, `src/data/4lll.ts` – dane i opisy (tu dopisujesz własne algorytmy).
- `scripts/raw/*.json` – algorytmy pobrane ze speedcubedb.com.
- `scripts/build-data.ts` – weryfikuje algorytmy i generuje `src/data/generated.json`.
- `src/cube.ts` – mały symulator kostki (naklejki 3D), używany do obrazków i weryfikacji.
- `src/triggers.ts` – rozpoznawanie i kolory triggerów.
- `src/diagram.ts` – obrazki SVG przypadków.
- `src/main.ts`, `src/player.ts`, `src/store.ts`, `src/style.css` – interfejs.

### Dodanie własnego algorytmu

Dopisz go do listy `algs` danego przypadku w `src/data/*.ts` i uruchom `npm run verify`.
Jeśli algorytm wymaga obrócenia góry przed startem, skrypt sam doda je jako „AUF”.
