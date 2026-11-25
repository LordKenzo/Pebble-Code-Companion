import { type Lang } from "./i18n";

/**
 * Le sezioni di percorso.md e del diario: passi della roadmap e sentieri brevi per una funzionalità o un bug (ADR-014).
 * "Passo 1", "Funzionalità 1" e "Bug 1" sono sezioni diverse: la chiave è tipo + numero.
 */
export type SectionKind = "step" | "feature" | "bug";

const WORDS: Record<Lang, Record<SectionKind, string>> = {
  it: { step: "Passo", feature: "Funzionalità", bug: "Bug" },
  en: { step: "Step", feature: "Feature", bug: "Bug" },
};
const KIND_OF: Record<string, SectionKind> = { passo: "step", step: "step", funzionalità: "feature", funzionalita: "feature", feature: "feature", bug: "bug" };
const HEADING = /^(?:#{2,3}\s+)?(passo|step|funzionalit[àa]|feature|bug)\s+(\d+)\b\s*(?:·\s*(.*))?$/i;

export interface Section {
  kind: SectionKind;
  n: number;
  title: string;
}

/** "Bug 2 · Il totale è sbagliato" → { kind: "bug", n: 2, title: "Il totale è sbagliato" }, in tutte e due le lingue. */
export function parseSection(heading: string | null | undefined): Section | null {
  const m = HEADING.exec((heading ?? "").trim());
  if (!m) return null;
  return { kind: KIND_OF[m[1]!.toLowerCase()]!, n: Number(m[2]), title: (m[3] ?? "").trim() };
}

export const sectionKey = (s: { kind: SectionKind; n: number }) => `${s.kind}:${s.n}`;
export const sectionWord = (kind: SectionKind, lang: Lang = "it") => WORDS[lang][kind];
export const sectionHeading = (s: Section, lang: Lang = "it") => `## ${sectionWord(s.kind, lang)} ${s.n} · ${s.title}`;

/** Il nome di una sezione nella lingua scelta: "Step 2 · …" → "Passo 2 · …", "Feature 1 · …" → "Funzionalità 1 · …". */
export function localSectionName(name: string, lang: Lang = "it"): string {
  const s = parseSection(name);
  if (!s) return name;
  return `${sectionWord(s.kind, lang)} ${s.n}${s.title ? ` · ${s.title}` : ""}`;
}

/** Il prossimo numero libero per un tipo di sentiero: "Bug 3" se ci sono già Bug 1 e Bug 2. */
export function nextSectionNumber(pathMarkdown: string | null, kind: SectionKind): number {
  let max = 0;
  for (const line of (pathMarkdown ?? "").split(/\r?\n/)) {
    const s = /^#{2,3}\s/.test(line) ? parseSection(line) : null;
    if (s && s.kind === kind) max = Math.max(max, s.n);
  }
  return max + 1;
}
