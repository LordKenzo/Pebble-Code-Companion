/**
 * I comandi da terminale citati in un compito ("esegui `npm init -y`"), per il pulsante "Esegui nel terminale",
 * e quali file "Prepara il file" sa davvero preparare. Logica pura.
 */

/**
 * Strumenti che creano o configurano un progetto: init, installazioni, build, test. Niente comandi che cancellano
 * o spostano file (rm, mv), niente `cd` o `mkdir`: la cartella del progetto è già quella aperta.
 */
const TOOL = /^(npm|npx|pnpm|yarn|bun|deno|node|tsc|swift|xcode-select|cargo|rustup|go|mvn|\.\/mvnw|gradle|\.\/gradlew|dotnet|pip3?|python3?|poetry|uv|pipenv|git init|composer|bundle|gem|rails|django-admin|flutter|dart|mix|cmake|make)\b/;
const UNSAFE = /[;&|<>`$]|\brm\b|\bmv\b|\bsudo\b|\bcurl\b|\bwget\b|--force\b/;

export function taskCommands(todo: string | null | undefined): string[] {
  const found: string[] = [];
  for (const m of (todo ?? "").matchAll(/`([^`\n]+)`|'([^'\n]{3,})'/g)) {
    const cmd = (m[1] ?? m[2]!).trim();
    if (TOOL.test(cmd) && !UNSAFE.test(cmd) && /\s/.test(cmd) && !found.includes(cmd)) found.push(cmd);
  }
  return found.slice(0, 3);
}

/**
 * "Prepara il file" compone uno scheletro TypeScript/JavaScript (firme, pseudocodice, test d'esempio).
 * Manifest e configurazioni (package.json, Package.swift, pom.xml…) li crea un comando, non uno scheletro.
 */
export function canScaffold(path: string): boolean {
  return /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(path) && !/(^|\/)[^/]*\.config\.[cm]?[jt]s$/.test(path);
}
