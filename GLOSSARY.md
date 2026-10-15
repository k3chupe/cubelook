# CubeLook

Offline CFOP cheat sheet: cases, algorithms, and learning-path visibility — not a practice timer.

## Product

**Cheat sheet**:
A single-page reference of CFOP cases and algorithms the solver looks up while learning or solving.
_Avoid_: Trainer, practice app, timer app

**Build-time sync**:
Turning a committed snapshot of external algorithm data (e.g. SpeedCubeDB) into the app's data during the build, then shipping the result in the app bundle. Refreshing the snapshot itself from the network is a separate, manual step (not yet built).
_Avoid_: Thin client, runtime API, live fetch

## Content

**Section**:
A top-level block of the cheat sheet (e.g. beginner F2L, intermediate F2L, 4LLL).
_Avoid_: Page, chapter, mode

**Group**:
A named cluster of cases inside a section that share a goal (e.g. EOLL, OCLL).
_Avoid_: Category (overloaded), folder

**Case**:
One recognizable cube situation the solver must recognize and solve (e.g. F2L 8, Ua).
_Avoid_: Position (ambiguous), pattern (unless EO/OLL diagram sense)

**Algorithm** (alg):
A move sequence offered as a solution for a case.
_Avoid_: Solution (unless contrasting with setup), formula

**Favorite**:
The algorithm the user prefers for a case, shown at the top so it is easy to see. On first visit (no personal choice yet) it is the case's **Recommended** algorithm. Remembered separately per filter context: a Favorite chosen while the slice filter is on applies only with the filter on; turning the filter off brings back the earlier Favorite.
_Avoid_: Main alg, default (ambiguous)

**Recommended**:
SpeedCubeDB's recommendation for a case: the first algorithm in its list. Always carries the Recommended tag, even when the user picks a different Favorite. Not a user choice.
_Avoid_: Best (without saying by whom), Favorite (the user's choice, which may differ)

**Case probability**:
How likely a case is to come up at its stage on a random solve, shown as a fraction and percent (e.g. 1/54 · 1.9%). Last-layer cases only.
_Avoid_: Frequency (only for the sort order), chance of skip (not shown)

**Probability**:
The chance that a case comes up at its stage of the solve, on a random cube (e.g. OLL 45 is 1/54). Shown for last-layer cases only.
_Avoid_: Frequency (could mean how often the user practises), popularity (that is about algorithms, not cases)

**Learned**:
A case the user marked as already known.
_Avoid_: Mastered, completed, done

**Learning path**:
Which CFOP last-layer stages the cheat sheet shows. MVP: **4LLL** or **full OLL+PLL** (one preference, not separate builds).
_Avoid_: Method (broader than CFOP subsets), preset, curriculum, 2OLL+PLL (post-MVP), ZBLL (out of scope for now)

**Slice filter** („Bez M/S”):
Hides algorithms that use M/S/E moves. Independent of Favorite.
_Avoid_: One-handed (different constraint)

**One-handed filter**:
Shows algorithms suited to one-handed solving. Not the same as the slice filter: an alg can be OH-friendly and still use (or avoid) slices differently than two-handed preference.
_Avoid_: hideSlice, Bez M/S
