import { execFile } from "node:child_process";
import * as vscode from "vscode";
import { buildState, parseConflicts, parseStatusV2, type GitMarkers, type GitOp, type GitState } from "../../core/git";

/**
 * Legge lo stato del repository per il fantasmino Git (ADR-017). Solo comandi che leggono, e solo nelle
 * cartelle attendibili: `core.fsmonitor` e gli hook configurati nel repo non partono.
 */
export type GitRead =
  | { ok: true; state: GitState; gitDir: vscode.Uri; dirty: string[] }
  | { ok: false; reason: "untrusted" | "noRepo" | "noGit"; op?: GitOp | null };

const SAFE = ["-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", "--no-optional-locks"];

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", [...SAFE, ...args], { cwd, timeout: 5000, maxBuffer: 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function readText(uri: vscode.Uri): Promise<string | null> {
  try {
    return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)).trim();
  } catch {
    return null;
  }
}

/** Il nome leggibile di un commit ("main"), o lo sha corto se non ha un ramo. */
async function refName(cwd: string, sha: string | null): Promise<string | null> {
  if (!sha) return null;
  try {
    const name = (await git(cwd, ["name-rev", "--name-only", "--refs=refs/heads/*", "--no-undefined", sha])).trim();
    return name.replace(/[~^]\d*$/, "") || sha.slice(0, 7);
  } catch {
    return sha.slice(0, 7);
  }
}

async function subject(cwd: string, ref: string): Promise<string | null> {
  try {
    return (await git(cwd, ["log", "-1", "--format=%s", ref])).trim() || null;
  } catch {
    return null;
  }
}

/** Senza fiducia niente git: solo un'occhiata ai file dentro .git, che non esegue nulla, per accendere l'indicatore. */
async function opFromFiles(root: vscode.Uri): Promise<GitOp | null> {
  const g = vscode.Uri.joinPath(root, ".git");
  if ((await readText(vscode.Uri.joinPath(g, "rebase-merge", "msgnum"))) !== null || (await readText(vscode.Uri.joinPath(g, "rebase-apply", "next"))) !== null) return "rebase";
  if ((await readText(vscode.Uri.joinPath(g, "MERGE_HEAD"))) !== null) return "merge";
  if ((await readText(vscode.Uri.joinPath(g, "CHERRY_PICK_HEAD"))) !== null) return "cherry-pick";
  if ((await readText(vscode.Uri.joinPath(g, "REVERT_HEAD"))) !== null) return "revert";
  return null;
}

export async function readGitState(root: vscode.Uri): Promise<GitRead> {
  if (!vscode.workspace.isTrusted) return { ok: false, reason: "untrusted", op: await opFromFiles(root) };
  const cwd = root.fsPath;
  let gitDirPath: string;
  try {
    gitDirPath = (await git(cwd, ["rev-parse", "--absolute-git-dir"])).trim();
  } catch (err) {
    return { ok: false, reason: (err as NodeJS.ErrnoException).code === "ENOENT" ? "noGit" : "noRepo" };
  }
  const gitDir = vscode.Uri.file(gitDirPath);
  const status = parseStatusV2(await git(cwd, ["status", "--porcelain=v2", "--branch"]));

  const markers: GitMarkers = {};
  const rebaseDir = vscode.Uri.joinPath(gitDir, "rebase-merge");
  const rebaseApply = vscode.Uri.joinPath(gitDir, "rebase-apply");
  const msgnum = (await readText(vscode.Uri.joinPath(rebaseDir, "msgnum"))) ?? (await readText(vscode.Uri.joinPath(rebaseApply, "next")));
  if (msgnum !== null) {
    const dir = (await readText(vscode.Uri.joinPath(rebaseDir, "msgnum"))) !== null ? rebaseDir : rebaseApply;
    const end = await readText(vscode.Uri.joinPath(dir, dir === rebaseDir ? "end" : "last"));
    const onto = await readText(vscode.Uri.joinPath(dir, "onto"));
    const hasRebaseHead = (await readText(vscode.Uri.joinPath(gitDir, "REBASE_HEAD"))) !== null;
    markers.rebase = {
      msgnum: Number(msgnum) || 0,
      end: Number(end) || 0,
      headName: await readText(vscode.Uri.joinPath(dir, "head-name")),
      onto: await refName(cwd, onto),
      stoppedSubject: hasRebaseHead ? await subject(cwd, "REBASE_HEAD") : null,
    };
  } else if ((await readText(vscode.Uri.joinPath(gitDir, "MERGE_HEAD"))) !== null) {
    markers.merge = { from: await refName(cwd, (await readText(vscode.Uri.joinPath(gitDir, "MERGE_HEAD")))?.split("\n")[0] ?? null) };
  } else if ((await readText(vscode.Uri.joinPath(gitDir, "CHERRY_PICK_HEAD"))) !== null) {
    markers.cherryPick = { subject: await subject(cwd, "CHERRY_PICK_HEAD") };
  } else if ((await readText(vscode.Uri.joinPath(gitDir, "REVERT_HEAD"))) !== null) {
    markers.revert = { subject: await subject(cwd, "REVERT_HEAD") };
  }

  // I blocchi si contano sul testo che l'utente vede: il documento aperto se c'è, altrimenti il file.
  // Un file risolto nell'editor ma non salvato ha ancora i marcatori sul disco: git add li registrerebbe.
  const blocks: Record<string, number> = {};
  const dirty: string[] = [];
  for (const path of status.conflicts) {
    const uri = vscode.Uri.joinPath(root, ...path.split("/"));
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    const text = open?.getText() ?? (await readText(uri)) ?? "";
    blocks[path] = parseConflicts(text).length;
    if (open?.isDirty) dirty.push(path);
  }
  return { ok: true, state: buildState(status, markers, blocks), gitDir, dirty };
}
