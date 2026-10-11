export type SourceId = "paradox" | "speedcubedb" | "cubingcheatsheet" | "reddit" | "community";

export interface SourceInfo {
  id: SourceId;
  /** Short label shown next to algorithms. */
  short: string;
  name: string;
  author: string;
  url?: string;
  license?: string;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  paradox: {
    id: "paradox",
    short: "ParadoxCubing",
    name: "F2L For Beginners | Easy CFOP Tutorial (YouTube)",
    author: "ParadoxCubing",
    url: "https://www.youtube.com/watch?v=Hx9ZbPdX8zM",
  },
  speedcubedb: {
    id: "speedcubedb",
    short: "SpeedCubeDB",
    name: "SpeedCubeDB – 3x3 F2L, OLL, PLL",
    author: "speedcubedb.com",
    url: "https://speedcubedb.com/a/3x3/F2L",
  },
  cubingcheatsheet: {
    id: "cubingcheatsheet",
    short: "Cubing Cheat Sheet",
    name: "Dan's Cubing Cheat [Sheet] – 4 Look Last Layer",
    author: "Dan (cubingcheatsheet.com)",
    url: "https://cubingcheatsheet.com/algs3x_4lll.html",
  },
  reddit: {
    id: "reddit",
    short: "r/Cubers",
    name: "“Two Look OLL and PLL PDF that I made” – r/Cubers",
    author: "u/NewAppWhoDis69 and commenters",
    url: "https://www.reddit.com/r/Cubers/comments/boukt3/",
  },
  community: {
    id: "community",
    short: "community",
    name: "Well-known community algorithms",
    author: "speedcubing community",
  },
};

export interface ToolCredit {
  name: string;
  author: string;
  url: string;
  license: string;
  key: string;
}

/** Libraries and guidelines used to build the app (not algorithm sources). */
export const TOOLS: ToolCredit[] = [
  { key: "cubingjs", name: "cubing.js (twisty-player)", author: "Lucas Garron & js.cubing.net team", url: "https://js.cubing.net/cubing/", license: "MPL-2.0 OR GPL-3.0-or-later" },
  { key: "algcubingnet", name: "alg.cubing.net & Twizzle", author: "Lucas Garron", url: "https://alg.cubing.net", license: "—" },
  { key: "fira", name: "Fira Sans & Fira Code", author: "Mozilla / Nikita Prokopov", url: "https://github.com/mozilla/Fira", license: "OFL-1.1" },
  { key: "uiux", name: "UI/UX Pro Max skill", author: "nextlevelbuilder", url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill", license: "MIT" },
  { key: "webguidelines", name: "Web Interface Guidelines (agent-skills)", author: "Vercel", url: "https://github.com/vercel-labs/agent-skills", license: "—" },
  { key: "accesslint", name: "AccessLint skills", author: "AccessLint", url: "https://github.com/AccessLint/skills", license: "—" },
  { key: "frontenddesign", name: "frontend-design skill", author: "Anthropic", url: "https://github.com/anthropics/skills", license: "—" },
];

const SCDB_BASE = "https://speedcubedb.com/a/3x3";

/** Deep link to a SpeedCubeDB case page, e.g. ("F2L", "F2L 8") or ("PLL", "Ua"). */
export function speedcubedbCaseUrl(set: "F2L" | "OLL" | "PLL", name: string): string {
  return `${SCDB_BASE}/${set}/${name.replace(/ /g, "_")}`;
}
