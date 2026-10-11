import type { Messages } from "./types";
import { pl } from "./locales/pl";
import { en } from "./locales/en";
import { fr } from "./locales/fr";

export type { Messages } from "./types";

/** Adding a language: create `locales/xx.ts` exporting `Messages`, then register it here. */
export const LOCALES = { pl, en, fr } satisfies Record<string, Messages>;

export type Locale = keyof typeof LOCALES;

export const FALLBACK_LOCALE: Locale = "en";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && v in LOCALES;
}

/** Picks the first supported language from the browser preferences. */
export function detectLocale(preferred: readonly string[] = navigator.languages ?? [navigator.language]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return FALLBACK_LOCALE;
}

let current: Locale = FALLBACK_LOCALE;

export function setLocale(l: Locale) {
  current = l;
  document.documentElement.lang = l;
}

export function locale(): Locale {
  return current;
}

export function t(): Messages {
  return LOCALES[current];
}

/** Content lookup with fallback to English, then to the provided default. */
export function content<K extends keyof Messages["content"]>(
  kind: K,
  id: string,
): Messages["content"][K][string] | undefined {
  const own = (LOCALES[current].content[kind] as Record<string, unknown>)[id];
  const fb = (LOCALES[FALLBACK_LOCALE].content[kind] as Record<string, unknown>)[id];
  return (own ?? fb) as Messages["content"][K][string] | undefined;
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** `{n}` in the chosen form is replaced by the number. */
export function plural(n: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(current).select(n);
  return (forms[rule] ?? forms.other).replace("{n}", String(n));
}
