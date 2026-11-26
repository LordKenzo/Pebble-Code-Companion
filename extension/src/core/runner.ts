import { NOTICE_TEXT, type Lang } from "./i18n";

/**
 * Quale comando lancia i test di un progetto (ADR-008). Se lo sviluppatore non ha impostato
 * pebble.path.testCommand, Pebble lo sceglie dal manifest: TAP per Node, l'output del runner per gli altri stack.
 */
export const DEFAULT_TEST_COMMAND = "node --test --test-reporter=tap";

export type RunnerChoice =
  | { kind: "command"; command: string; runner: string }
  | { kind: "missing"; hint: string };

/** I manifest degli altri stack trovati nella radice del progetto (solo i nomi). */
export const OTHER_MANIFESTS = ["Package.swift", "go.mod", "Cargo.toml", "pyproject.toml", "setup.py", "requirements.txt", "pytest.ini"] as const;

/**
 * Senza package.json, il comando dei test dello stack: swift test, go test, cargo test, pytest.
 * L'output non è TAP: lo legge parseTestOutput.
 */
export function detectOtherStack(found: readonly string[], windows = false): RunnerChoice | null {
  const has = (f: string) => found.includes(f);
  if (has("Package.swift")) return { kind: "command", command: "swift test", runner: "Swift" };
  if (has("go.mod")) return { kind: "command", command: "go test -v ./...", runner: "Go" };
  if (has("Cargo.toml")) return { kind: "command", command: "cargo test", runner: "Cargo" };
  if (["pyproject.toml", "setup.py", "requirements.txt", "pytest.ini"].some(has)) {
    return { kind: "command", command: `${windows ? "python" : "python3"} -m pytest -v`, runner: "pytest" };
  }
  return null;
}

export function detectTestCommand(packageJson: string | null, lang: Lang = "it", otherManifests: readonly string[] = [], windows = false): RunnerChoice {
  const N = NOTICE_TEXT[lang];
  if (packageJson === null) return detectOtherStack(otherManifests, windows) ?? { kind: "command", command: DEFAULT_TEST_COMMAND, runner: "node:test" };
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
/** Gli script di package.json; un manifest che manca o non si legge vuol dire "non so". */
export function packageScripts(packageJson: string | null): Record<string, string> | undefined {
  if (packageJson === null) return undefined;
  try {
    return (JSON.parse(packageJson) as { scripts?: Record<string, string> }).scripts ?? {};
  } catch {
    return undefined;
  }
}

export function packageDependencies(packageJson: string | null): string[] | undefined {
  if (packageJson === null) return undefined;
  try {
    const pkg = JSON.parse(packageJson) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  } catch {
    return undefined;
  }
}
