import type { CaseView } from "./data/types";
import { icons } from "./icons";
import { algCubingNetUrl, ORIENTATION, stickeringFor, twizzleUrl } from "./links";

interface PlayerRequest {
  alg: string;
  view: CaseView;
  title: string;
  algHtml: string;
}

let dialog: HTMLDialogElement | null = null;

function ensureDialog(): HTMLDialogElement {
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "player";
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || (e.target as HTMLElement).closest("[data-close]")) dialog!.close();
  });
  dialog.addEventListener("close", () => {
    dialog!.querySelector(".player-stage")!.innerHTML = "";
  });
  document.body.appendChild(dialog);
  return dialog;
}

export async function openPlayer(req: PlayerRequest) {
  const d = ensureDialog();
  const plain = req.alg.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
  d.innerHTML = `
    <div class="player-card">
      <div class="player-head">
        <h3>${req.title}</h3>
        <button class="icon-btn" data-close title="Zamknij">${icons.close}</button>
      </div>
      <div class="player-stage"><div class="player-loading">Ładowanie kostki 3D…</div></div>
      <div class="alg big">${req.algHtml}</div>
      <div class="player-links">
        <a class="link-btn" href="${algCubingNetUrl(req.alg, req.title)}" target="_blank" rel="noopener">alg.cubing.net ${icons.external}</a>
        <a class="link-btn alt" href="${twizzleUrl(req.alg, req.view, req.title)}" target="_blank" rel="noopener">Twizzle ${icons.external}</a>
      </div>
    </div>`;
  d.showModal();

  const stage = d.querySelector<HTMLDivElement>(".player-stage")!;
  try {
    const { TwistyPlayer } = await import("cubing/twisty");
    const player = new TwistyPlayer({
      puzzle: "3x3x3",
      alg: plain,
      experimentalSetupAlg: ORIENTATION,
      experimentalSetupAnchor: "end",
      experimentalStickering: stickeringFor(req.view),
      background: "none",
      controlPanel: "bottom-row",
      hintFacelets: "floating",
    });
    stage.innerHTML = "";
    stage.appendChild(player);
    setTimeout(() => player.play(), 400);
  } catch (err) {
    console.error(err);
    stage.innerHTML = `<div class="player-error">Nie udało się wczytać animacji (brak internetu albo przeglądarka blokuje skrypty z pliku). Użyj linków poniżej.</div>`;
  }
}
