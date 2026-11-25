import { execFile } from "node:child_process";
import * as vscode from "vscode";
import type { AdoptFile, AdoptSnapshot, TestSnapshot } from "../../core/adopt";

const EXCLUDE = "{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**,**/.venv/**,**/venv/**,**/__pycache__/**,**/.pebble/**,**/coverage/**,**/*.vsix}";
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|rb|php|cs|vue|svelte)$/;
/** File che dicono come è fatto il progetto: manifest e configurazione. */
const CONFIG = /^(package\.json|tsconfig[\w.]*\.json|pyproject\.toml|requirements[\w-]*\.txt|setup\.cfg|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|(vite|vitest|jest|webpack|rollup|eslint|babel)\.config\.[cm]?[jt]s|\.eslintrc(\.\w+)?)$/;
const MAX_FILE = 12_000;
const MAX_TOTAL = 60_000;
const MAX_LIST = 400;

/** C'è codice nel progetto? Serve per proporre l'adozione invece del bootstrap. */
export async function hasProjectCode(root: vscode.Uri): Promise<boolean> {
  const found = await vscode.workspace.findFiles(new vscode.RelativePattern(root, "**/*"), EXCLUDE, 40);
  return found.some((u) => SOURCE.test(u.path));
}

/**
 * La fotografia per MODE: ADOPT: l'albero dei file, manifest e configurazione per intero,
 * un campione di sorgenti e test entro un budget, il README, la storia git e i test all'arrivo.
 */
export async function takeSnapshot(root: vscode.Uri, tests: () => Promise<TestSnapshot | null>): Promise<AdoptSnapshot> {
  const uris = await vscode.workspace.findFiles(new vscode.RelativePattern(root, "**/*"), EXCLUDE, MAX_LIST);
  const rel = uris.map((u) => ({ uri: u, path: vscode.workspace.asRelativePath(u, false) })).sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path));
  const isTest = (p: string) => /(^|\/)(tests?|__tests__)\/|\.(test|spec)\.|(^|\/)test_[^/]+\.py$/.test(p);
  // Prima la configurazione, poi un po' di sorgenti e un po' di test, i più vicini alla radice.
  const ranked = [...rel.filter((f) => CONFIG.test(f.path)), ...rel.filter((f) => SOURCE.test(f.path) && !isTest(f.path)).slice(0, 12), ...rel.filter((f) => isTest(f.path)).slice(0, 6)];
  const chosen = new Set<string>();
  const contents = new Map<string, string>();
  let total = 0;
  for (const f of ranked) {
    if (chosen.has(f.path) || total >= MAX_TOTAL) continue;
    const text = await read(f.uri);
    if (text === null || text.length > MAX_FILE) continue;
    chosen.add(f.path);
    contents.set(f.path, text);
    total += text.length;
  }
  const files: AdoptFile[] = rel.map((f) => (contents.has(f.path) ? { path: f.path, content: contents.get(f.path)! } : { path: f.path }));
  const readmeUri = rel.find((f) => /^readme(\.\w+)?$/i.test(f.path))?.uri;
  const readme = readmeUri ? (await read(readmeUri))?.slice(0, 4000) ?? null : null;
  return { files, readme, git: await gitSummary(root), tests: await tests() };
}

async function read(uri: vscode.Uri): Promise<string | null> {
  try {
    return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    return null;
  }
}

const git = (root: vscode.Uri, args: string[]) =>
  new Promise<string | null>((resolve) => {
    execFile("git", args, { cwd: root.fsPath, timeout: 5000 }, (err, out) => resolve(err ? null : out.trim()));
  });

/** "42 commit · ultimo il 2026-11-18" e gli ultimi messaggi. Solo in una cartella attendibile. */
async function gitSummary(root: vscode.Uri): Promise<string | null> {
  if (!vscode.workspace.isTrusted) return null;
  const [count, last, log] = await Promise.all([git(root, ["rev-list", "--count", "HEAD"]), git(root, ["log", "-1", "--format=%cs"]), git(root, ["log", "-8", "--format=- %s"])]);
  if (!count) return null;
  return [`${count} commit · ${last ?? ""}`.trim(), log ?? ""].filter(Boolean).join("\n");
}
