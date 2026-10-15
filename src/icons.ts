const svg = (body: string, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  chevron: svg('<path d="m9 18 6-6-6-6"/>', "icon chevron"),
  star: svg('<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/>'),
  up: svg('<path d="m18 15-6-6-6 6"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z"/>'),
  external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  printer: svg('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  fold: svg('<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>'),
  unfold: svg('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),
  db: svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>'),
  twizzle: svg(
    [3, 9.5, 16]
      .flatMap((y) => [3, 9.5, 16].map((x) => `<rect x="${x}" y="${y}" width="5" height="5" rx="1" fill="currentColor" stroke="none"/>`))
      .join(""),
  ),
};
