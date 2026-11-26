/**
 * Il fantasmino Git (ADR-017): lo stato del repository letto senza modello, i blocchi di conflitto,
 * la loro risoluzione e i prossimi comandi. Logica pura: l'adapter passa l'output di git e i file di .git.
 */

export type GitOp = "rebase" | "merge" | "cherry-pick" | "revert";

/** Quello che dice `git status --porcelain=v2 --branch`. */
export interface StatusInfo {
  branch: string | null;
  detached: boolean;
  upstream: string | null;
  ahead: number;
  behind: number;
  /** File con conflitti non risolti (righe "u …"). */
  conflicts: string[];
}

export function parseStatusV2(text: string): StatusInfo {
  const out: StatusInfo = { branch: null, detached: false, upstream: null, ahead: 0, behind: 0, conflicts: [] };
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("# branch.head ")) {
      const head = line.slice(14).trim();
      if (head === "(detached)") out.detached = true;
      else out.branch = head;
    } else if (line.startsWith("# branch.upstream ")) {
      out.upstream = line.slice(18).trim();
    } else if (line.startsWith("# branch.ab ")) {
      const m = /\+(\d+) -(\d+)/.exec(line);
      if (m) {
        out.ahead = Number(m[1]);
        out.behind = Number(m[2]);
      }
    } else if (line.startsWith("u ")) {
      // u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>: il percorso è dal decimo campo in poi
      const path = line.split(" ").slice(10).join(" ");
      if (path) out.conflicts.push(path);
    }
  }
  return out;
}

/** Quello che l'adapter trova dentro .git: l'operazione in corso e i suoi dettagli. */
export interface GitMarkers {
  rebase?: { msgnum: number; end: number; headName: string | null; onto: string | null; stoppedSubject: string | null };
  merge?: { from: string | null };
  cherryPick?: { subject: string | null };
  revert?: { subject: string | null };
}

export interface GitState extends StatusInfo {
  op: GitOp | null;
  /** Rebase: il commit a cui Git si è fermato (n di total). */
  step: { n: number; total: number } | null;
  /** Il messaggio del commit che Git sta applicando (rebase, cherry-pick, revert). */
  applying: string | null;
  /** Rebase: il ramo che stai riscrivendo e quello su cui lo rimetti. */
  rewriting: string | null;
  onto: string | null;
  /** Merge: il ramo che sta entrando. */
  incoming: string | null;
  /** Blocchi di conflitto per file, nell'ordine di git status. */
  files: { path: string; blocks: number }[];
}

const shortRef = (ref: string | null | undefined) => (ref ? ref.replace(/^refs\/heads\//, "") : null);

export function buildState(status: StatusInfo, markers: GitMarkers, blocks: Record<string, number> = {}): GitState {
  const op: GitOp | null = markers.rebase ? "rebase" : markers.merge ? "merge" : markers.cherryPick ? "cherry-pick" : markers.revert ? "revert" : null;
  return {
    ...status,
    op,
    step: markers.rebase ? { n: markers.rebase.msgnum, total: markers.rebase.end } : null,
    applying: markers.rebase?.stoppedSubject ?? markers.cherryPick?.subject ?? markers.revert?.subject ?? null,
    rewriting: shortRef(markers.rebase?.headName),
    onto: markers.rebase?.onto ?? null,
    incoming: markers.merge?.from ?? null,
    files: status.conflicts.map((path) => ({ path, blocks: blocks[path] ?? 0 })),
  };
}

/** C'è qualcosa da mostrare nella barra di stato: un'operazione a metà o conflitti. */
export const needsAttention = (s: GitState) => s.op !== null || s.conflicts.length > 0;

// ---------- blocchi di conflitto ----------

export interface ConflictBlock {
  index: number;
  /** Righe contate da 1: il marcatore di apertura, il separatore e quello di chiusura. */
  start: number;
  separator: number;
  end: number;
  oursLabel: string;
  theirsLabel: string;
  ours: string[];
  theirs: string[];
  /** Con conflictstyle diff3/zdiff3: la versione di partenza. */
  base: string[] | null;
}

export function parseConflicts(content: string): ConflictBlock[] {
  const lines = content.split("\n");
  const blocks: ConflictBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i]!.startsWith("<<<<<<<")) {
      i++;
      continue;
    }
    const start = i;
    const oursLabel = lines[i]!.slice(7).trim();
    const ours: string[] = [];
    let base: string[] | null = null;
    i++;
    while (i < lines.length && !lines[i]!.startsWith("|||||||") && !lines[i]!.startsWith("=======")) ours.push(lines[i++]!);
    if (i < lines.length && lines[i]!.startsWith("|||||||")) {
      base = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("=======")) base.push(lines[i++]!);
    }
    if (i >= lines.length) break;
    const separator = i;
    const theirs: string[] = [];
    i++;
    while (i < lines.length && !lines[i]!.startsWith(">>>>>>>")) theirs.push(lines[i++]!);
    if (i >= lines.length) break;
    blocks.push({ index: blocks.length, start: start + 1, separator: separator + 1, end: i + 1, oursLabel, theirsLabel: lines[i]!.slice(7).trim(), ours, theirs, base });
    i++;
  }
  return blocks;
}

export type Resolution = "ours" | "theirs" | "both" | { union: string };

/** Sostituisce un blocco con la scelta fatta; null se il blocco non c'è più (il file è cambiato). */
export function resolveBlock(content: string, index: number, resolution: Resolution): string | null {
  const block = parseConflicts(content)[index];
  if (!block) return null;
  const lines = content.split("\n");
  const chosen =
    resolution === "ours" ? block.ours
    : resolution === "theirs" ? block.theirs
    : resolution === "both" ? [...block.ours, ...block.theirs]
    : resolution.union.replace(/\n$/, "").split("\n");
  lines.splice(block.start - 1, block.end - block.start + 1, ...chosen);
  return lines.join("\n");
}

// ---------- i due lati, chiamati per nome ----------

/**
 * In un rebase "ours" (HEAD) è il ramo su cui rimetti i commit e "theirs" è il tuo commit: al contrario
 * di quello che ci si aspetta. Pebble li chiama sempre per nome.
 */
export function sideNames(s: GitState): { ours: string; theirs: string; swapped: boolean } {
  if (s.op === "rebase") return { ours: s.onto ?? "HEAD", theirs: s.applying ?? s.rewriting ?? "", swapped: true };
  if (s.op === "merge") return { ours: s.branch ?? "HEAD", theirs: s.incoming ?? "", swapped: false };
  return { ours: s.branch ?? "HEAD", theirs: s.applying ?? "", swapped: false };
}

// ---------- prossimi passi e schede ----------

export interface GitStep {
  /** Chiave del testo nel catalogo (GIT_TEXT.steps). */
  key: "resolve" | "add" | "continue" | "abort" | "commitMerge" | "push" | "pull" | "backToBranch";
  cmd?: string;
}

const CONTINUE: Record<GitOp, string> = {
  rebase: "git rebase --continue",
  merge: "git commit --no-edit",
  "cherry-pick": "git cherry-pick --continue",
  revert: "git revert --continue",
};
const ABORT: Record<GitOp, string> = {
  rebase: "git rebase --abort",
  merge: "git merge --abort",
  "cherry-pick": "git cherry-pick --abort",
  revert: "git revert --abort",
};

/** I comandi nell'ordine, che lo sviluppatore lancia da sé: Pebble non modifica il repository (ADR-017). */
export function nextSteps(s: GitState): GitStep[] {
  const quote = (p: string) => (/^[\w./@+-]+$/.test(p) ? p : `"${p.replace(/"/g, '\\"')}"`);
  if (s.op) {
    const steps: GitStep[] = [];
    if (s.conflicts.length) {
      steps.push({ key: "resolve" });
      steps.push({ key: "add", cmd: `git add ${s.conflicts.map(quote).join(" ")}` });
    }
    steps.push({ key: s.op === "merge" ? "commitMerge" : "continue", cmd: CONTINUE[s.op] });
    steps.push({ key: "abort", cmd: ABORT[s.op] });
    return steps;
  }
  if (s.detached) return [{ key: "backToBranch", cmd: "git switch -" }];
  if (s.ahead > 0 && s.behind > 0) return [{ key: "pull", cmd: "git pull --rebase" }, { key: "push", cmd: "git push" }];
  if (s.ahead > 0) return [{ key: "push", cmd: "git push" }];
  return [];
}

export const GIT_CARD_IDS = [
  "conflict-rebase", "conflict-merge", "abort", "push-rejected", "wrong-branch", "lost-commit", "detached", "stash-conflict", "undo-commit",
] as const;
export type GitCardId = (typeof GIT_CARD_IDS)[number];

/** Le schede che servono adesso, dallo stato; le altre restano da sfogliare. */
export function pickCards(s: GitState): GitCardId[] {
  if (s.op === "rebase") return s.conflicts.length ? ["conflict-rebase", "abort", "push-rejected"] : ["abort", "push-rejected"];
  if (s.op === "merge") return ["conflict-merge", "abort"];
  if (s.op) return ["abort"];
  if (s.conflicts.length) return ["stash-conflict"];
  if (s.detached) return ["detached", "lost-commit"];
  if (s.ahead > 0 && s.behind > 0) return ["push-rejected"];
  return [];
}
