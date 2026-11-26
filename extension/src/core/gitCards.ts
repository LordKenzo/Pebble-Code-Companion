import type { Lang } from "./i18n";
import type { GitCardId } from "./git";

/**
 * Le schede del fantasmino Git (ADR-017): testi brevi scritti per Pebble, letti senza modello.
 * Ogni comando che modifica il repository lo lancia lo sviluppatore; i distruttivi hanno prima la forma sicura.
 */
export interface GitCard {
  title: string;
  body: string;
  commands: { cmd: string; note: string }[];
  /** Un avvertimento, quando c'è un errore facile da fare. */
  warning?: string;
}

const it: Record<GitCardId, GitCard> = {
  "conflict-rebase": {
    title: "Conflitto durante un rebase",
    body: "Git sta rimettendo i tuoi commit sopra un altro ramo, uno alla volta, e si è fermato su uno che tocca le stesse righe. Risolvi i file di questo commit, poi Git passa al successivo: lo stesso file può tornare in conflitto più avanti.",
    commands: [
      { cmd: "git status", note: "quali file sono ancora in conflitto" },
      { cmd: "git add <file>", note: "segna un file come risolto" },
      { cmd: "git rebase --continue", note: "applica il commit e passa al prossimo" },
      { cmd: "git rebase --skip", note: "salta questo commit (le sue modifiche si perdono): solo se è già dentro l'altro ramo" },
    ],
    warning: "In un rebase «ours» è il ramo su cui stai rimettendo i commit e «theirs» è il tuo commit: al contrario di un merge.",
  },
  "conflict-merge": {
    title: "Conflitto durante un merge",
    body: "Stai unendo un altro ramo nel tuo e tutti e due avete cambiato le stesse righe. Si risolve tutto in una volta, file per file, poi un solo commit di merge chiude l'operazione.",
    commands: [
      { cmd: "git status", note: "quali file sono ancora in conflitto" },
      { cmd: "git add <file>", note: "segna un file come risolto" },
      { cmd: "git commit --no-edit", note: "chiude il merge con il messaggio già pronto" },
    ],
  },
  abort: {
    title: "Tornare a prima dell'operazione",
    body: "Ogni operazione a metà ha la sua via d'uscita: riporta il ramo esattamente com'era prima di iniziare, senza perdere commit. Le risoluzioni fatte finora si perdono.",
    commands: [
      { cmd: "git rebase --abort", note: "durante un rebase" },
      { cmd: "git merge --abort", note: "durante un merge" },
      { cmd: "git cherry-pick --abort", note: "durante un cherry-pick" },
    ],
  },
  "push-rejected": {
    title: "Push rifiutato",
    body: "Il ramo remoto ha commit che il tuo non ha. Se sono di altri, prima prendili. Se il ramo l'hai riscritto tu con un rebase, il remoto ha la versione vecchia e va sostituita, ma solo se nessun altro ci ha lavorato.",
    commands: [
      { cmd: "git pull --rebase", note: "prende i commit nuovi e rimette sopra i tuoi" },
      { cmd: "git branch backup/<ramo>", note: "una copia di sicurezza prima di riscrivere" },
      { cmd: "git push --force-with-lease", note: "sostituisce il remoto solo se nessuno l'ha toccato da quando l'hai scaricato" },
    ],
    warning: "Mai `git push --force`: se un collega ha pushato nel frattempo, il suo lavoro sparisce senza avviso.",
  },
  "wrong-branch": {
    title: "Commit sul ramo sbagliato",
    body: "Hai fatto il commit su main invece che sul tuo ramo, e non l'hai ancora pushato. Crei il ramo dove sei, poi riporti main indietro di un commit: il lavoro resta sul ramo nuovo.",
    commands: [
      { cmd: "git branch <ramo-nuovo>", note: "il ramo nuovo punta al tuo commit" },
      { cmd: "git reset --keep HEAD~1", note: "main torna indietro di uno; --keep si ferma se perderesti modifiche" },
      { cmd: "git switch <ramo-nuovo>", note: "continui sul ramo giusto" },
    ],
    warning: "Se il commit è già su GitHub, non riscrivere main: fai invece un `git revert`.",
  },
  "lost-commit": {
    title: "Un commit sembra perso",
    body: "Git tiene traccia per settimane di dove è stato ogni ramo, anche dopo un reset o un rebase andato male. Nel reflog trovi il commit, poi gli dai un ramo.",
    commands: [
      { cmd: "git reflog", note: "la storia di HEAD, la più recente in alto" },
      { cmd: "git branch recupero <sha>", note: "un ramo sul commit ritrovato: niente si sovrascrive" },
    ],
  },
  detached: {
    title: "HEAD staccato",
    body: "Sei su un commit, non su un ramo: puoi guardare e provare, ma i commit che fai qui non appartengono a nessun ramo e si perdono quando cambi ramo.",
    commands: [
      { cmd: "git switch -", note: "torna al ramo di prima" },
      { cmd: "git switch -c <ramo-nuovo>", note: "tiene quello che hai fatto qui su un ramo nuovo" },
    ],
  },
  "stash-conflict": {
    title: "Conflitto dopo uno stash",
    body: "Hai ripreso uno stash su codice cambiato nel frattempo. Risolvi i file come in un merge; lo stash resta nella lista finché non lo togli tu, così non perdi niente.",
    commands: [
      { cmd: "git add <file>", note: "segna un file come risolto" },
      { cmd: "git stash list", note: "lo stash è ancora lì" },
      { cmd: "git stash drop", note: "toglilo solo quando tutto torna" },
    ],
  },
  "undo-commit": {
    title: "Annullare l'ultimo commit",
    body: "Se il commit non è ancora pushato, lo togli tenendo le modifiche nei file. Se è già pushato, non riscrivere la storia: un nuovo commit ne annulla l'effetto.",
    commands: [
      { cmd: "git reset --soft HEAD~1", note: "toglie il commit, le modifiche restano pronte" },
      { cmd: "git revert HEAD", note: "per un commit già pushato: un commit che lo annulla" },
    ],
    warning: "`git reset --hard` cancella anche le modifiche non salvate: prima `git stash`.",
  },
};

const en: Record<GitCardId, GitCard> = {
  "conflict-rebase": {
    title: "Conflict during a rebase",
    body: "Git is replaying your commits on top of another branch, one at a time, and stopped on one that touches the same lines. Resolve this commit's files, then Git moves to the next: the same file can conflict again later.",
    commands: [
      { cmd: "git status", note: "which files are still in conflict" },
      { cmd: "git add <file>", note: "marks a file as resolved" },
      { cmd: "git rebase --continue", note: "applies the commit and moves on" },
      { cmd: "git rebase --skip", note: "skips this commit (its changes are lost): only if it's already in the other branch" },
    ],
    warning: "In a rebase \"ours\" is the branch you're replaying onto and \"theirs\" is your commit: the opposite of a merge.",
  },
  "conflict-merge": {
    title: "Conflict during a merge",
    body: "You're merging another branch into yours and both changed the same lines. You resolve everything at once, file by file, then a single merge commit closes it.",
    commands: [
      { cmd: "git status", note: "which files are still in conflict" },
      { cmd: "git add <file>", note: "marks a file as resolved" },
      { cmd: "git commit --no-edit", note: "closes the merge with the prepared message" },
    ],
  },
  abort: {
    title: "Going back to before the operation",
    body: "Every half-done operation has a way out: it puts the branch back exactly as it was, without losing commits. The resolutions made so far are lost.",
    commands: [
      { cmd: "git rebase --abort", note: "during a rebase" },
      { cmd: "git merge --abort", note: "during a merge" },
      { cmd: "git cherry-pick --abort", note: "during a cherry-pick" },
    ],
  },
  "push-rejected": {
    title: "Push rejected",
    body: "The remote branch has commits yours doesn't. If they're someone else's, get them first. If you rewrote the branch with a rebase, the remote has the old version and needs replacing, but only if nobody else worked on it.",
    commands: [
      { cmd: "git pull --rebase", note: "gets the new commits and replays yours on top" },
      { cmd: "git branch backup/<branch>", note: "a safety copy before rewriting" },
      { cmd: "git push --force-with-lease", note: "replaces the remote only if nobody touched it since you fetched" },
    ],
    warning: "Never `git push --force`: if a colleague pushed meanwhile, their work disappears without warning.",
  },
  "wrong-branch": {
    title: "Commit on the wrong branch",
    body: "You committed on main instead of your branch, and haven't pushed yet. Create the branch where you are, then move main back one commit: the work stays on the new branch.",
    commands: [
      { cmd: "git branch <new-branch>", note: "the new branch points at your commit" },
      { cmd: "git reset --keep HEAD~1", note: "main moves back one; --keep stops if you'd lose changes" },
      { cmd: "git switch <new-branch>", note: "carry on on the right branch" },
    ],
    warning: "If the commit is already on GitHub, don't rewrite main: use `git revert` instead.",
  },
  "lost-commit": {
    title: "A commit seems lost",
    body: "Git remembers for weeks where every branch has been, even after a reset or a rebase gone wrong. Find the commit in the reflog, then give it a branch.",
    commands: [
      { cmd: "git reflog", note: "HEAD's history, newest first" },
      { cmd: "git branch recovered <sha>", note: "a branch on the found commit: nothing is overwritten" },
    ],
  },
  detached: {
    title: "Detached HEAD",
    body: "You're on a commit, not a branch: you can look and experiment, but commits made here belong to no branch and are lost when you switch.",
    commands: [
      { cmd: "git switch -", note: "back to the previous branch" },
      { cmd: "git switch -c <new-branch>", note: "keeps what you did here on a new branch" },
    ],
  },
  "stash-conflict": {
    title: "Conflict after a stash",
    body: "You applied a stash on code that changed meanwhile. Resolve the files as in a merge; the stash stays in the list until you drop it, so nothing is lost.",
    commands: [
      { cmd: "git add <file>", note: "marks a file as resolved" },
      { cmd: "git stash list", note: "the stash is still there" },
      { cmd: "git stash drop", note: "drop it only when everything works" },
    ],
  },
  "undo-commit": {
    title: "Undoing the last commit",
    body: "If the commit isn't pushed yet, remove it and keep the changes in the files. If it's pushed, don't rewrite history: a new commit undoes its effect.",
    commands: [
      { cmd: "git reset --soft HEAD~1", note: "removes the commit, the changes stay staged" },
      { cmd: "git revert HEAD", note: "for a pushed commit: a commit that undoes it" },
    ],
    warning: "`git reset --hard` also deletes unsaved changes: `git stash` first.",
  },
};

export const GIT_CARDS: Record<Lang, Record<GitCardId, GitCard>> = { it, en };
