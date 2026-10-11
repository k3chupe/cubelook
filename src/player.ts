import type { CaseView } from "./data/types";
import { t } from "./i18n";
import { icons } from "./icons";
import { algCubingNetUrl, ORIENTATION, stickeringFor, twizzleUrl } from "./links";

interface PlayerRequest {
  alg: string;
  view: CaseView;
  title: string;
  algHtml: string;
}

let dialog: HTMLDialogElement | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function ensureDialog(): HTMLDialogElement {
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "player";
  dialog.setAttribute("aria-labelledby", "player-title");
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || (e.target as HTMLElement).closest("[data-close]")) dialog!.close();
  });
  dialog.addEventListener("close", () => {
    dialog!.querySelector(".player-stage")?.replaceChildren();
  });
  document.body.appendChild(dialog);
  return dialog;
}

export async function openPlayer(req: PlayerRequest) {
  const m = t();
  const d = ensureDialog();
  const plain = req.alg.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
  d.innerHTML = `
    <div class="player-card">
      <div class="player-head">
        <h3 id="player-title">${esc(req.title)}</h3>
        <button class="icon-btn" data-close aria-label="${esc(m.ui.close)}" title="${esc(m.ui.close)}">${icons.close}</button>
      </div>
      <div class="player-stage"><div class="player-loading" role="status">${esc(m.ui.loading3d)}</div></div>
      <div class="alg big" translate="no">${req.algHtml}</div>
      <div class="player-links">
        <a class="link-btn" href="${twizzleUrl(req.alg, req.view, req.title)}" target="_blank" rel="noopener">Twizzle ${icons.external}</a>
        <a class="link-btn alt" href="${algCubingNetUrl(req.alg, req.title)}" target="_blank" rel="noopener">alg.cubing.net ${icons.external}</a>
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
    stage.replaceChildren(player);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(() => player.play(), 400);
  } catch (err) {
    console.error(err);
    stage.innerHTML = `<div class="player-error" role="alert">${esc(m.ui.error3d)}</div>`;
  }
}
