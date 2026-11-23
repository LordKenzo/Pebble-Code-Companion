import { NOTICE_TEXT, type Lang } from "./i18n";

/**
 * Quale comando lancia i test di un progetto (ADR-008). Se lo sviluppatore non ha impostato
 * pebble.path.testCommand, Pebble lo sceglie dal package.json: deve produrre output TAP.
 */
export const DEFAULT_TEST_COMMAND = "node --test --test-reporter=tap";

export type RunnerChoice =
  | { kind: "command"; command: string; runner: string }
  | { kind: "missing"; hint: string };

export function detectTestCommand(packageJson: string | null, lang: Lang = "it"): RunnerChoice {
  const N = NOTICE_TEXT[lang];
  if (packageJson === null) return { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" };
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> };
  try {
    pkg = JSON.parse(packageJson);
  } catch {
    return { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" };
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  // Vitest ha un reporter TAP "piatto": un test per riga, con il nome completo "file > describe > test".
  if (deps.vitest) return { kind: "command", command: "npx vitest run --reporter=tap-flat", runner: "Vitest" };
  if (deps.jest) return { kind: "missing", hint: N.jest };
  const script = pkg.scripts?.test ?? "";
  if (/\bnode\b.*--test\b/.test(script) || !Object.keys(deps).some((d) => /react|vite|svelte|vue|next/.test(d))) {
    return { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" };
  }
  return { kind: "missing", hint: N.noRunner };
}

/** Le dipendenze dichiarate nel package.json, per la condizione "dipendenza". */
export function packageDependencies(packageJson: string | null): string[] | undefined {
  if (packageJson === null) return undefined;
  try {
    const pkg = JSON.parse(packageJson) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  } catch {
    return undefined;
  }
}
