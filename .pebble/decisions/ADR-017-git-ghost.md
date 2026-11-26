## ADR-017: The Git ghost, a master of merge and rebase conflicts
Status: accepted (2026-11-26, mockup approved; roadmap #21)
Context: the developer wants a fourth ghost that knows Git and GitHub inside out, above all for merge and rebase conflicts, where people get lost. The answers must cost few tokens (ADR-016): most of what a stuck developer needs is the repo's state and the next commands, which can be read without a model.
Decision:
- **State first, without the model.** Pebble reads the repo itself:
  - `.git/rebase-merge`, `rebase-apply`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`;
  - the conflicted files from `git diff --name-only --diff-filter=U`, with their conflict blocks;
  - branch, ahead/behind and detached HEAD from `git status --porcelain=v2 --branch`.
  It says where you are (e.g. "rebase 2 of 3, stopped on «Arrotonda il carico per difetto»"), lists the files with a line on what clashed, and gives the next commands and the way out (`git rebase --abort`, `git merge --abort`). Zero tokens.
- **Ours and theirs by name.** In a rebase "ours" is the branch you're rebasing onto and "theirs" is your commit. Pebble always says *main* (or the branch's name) and *your commit*, and explains the swap once.
- **Local playbook cards.** Short texts written for Pebble and shipped with the extension, picked by the detected state, read without a model:
  - conflict in a merge or a rebase; a rebase to undo;
  - push rejected (non-fast-forward), `--force-with-lease` instead of `--force`;
  - a commit on the wrong branch; a lost commit (reflog); detached HEAD;
  - a conflict after a stash; undoing the last commit.
  No text copied from Pro Git or other books: we link them.
- **The model only for one conflict block.** *Explain this conflict* sends that block, a few lines around it and the two commit messages, nothing else (~2,500 tokens). It answers with what each side wanted, what breaks when only one is kept, and a proposed union. The union enters the file only when approved (ADR-016). In training only the explanation is given, not the union.
- **Pebble never runs a command that changes the repo.** It runs only read-only commands (status, log, diff, rev-parse). Everything else is shown to copy. For destructive commands it shows the safer form first:
  - a backup branch before risky operations;
  - `--force-with-lease`, never `--force`;
  - `git stash` before `reset --hard`;
  - `clean -nd` before `clean -fd`.
  It warns before rewriting a branch that has other people's commits.
- **Where it lives.** A panel beside the code, like ⌥P, opened from a status bar item that appears only when there's something to do (e.g. "REBASE 2/3 · 2 conflicts") and from **Pebble: Git**. A lilac ghost, the colour of the banner.
- **Its own model** (ADR-016, #20): `pebble.ghost.git.*`, recommended a mid model for the conflict explanations; the rest costs nothing.
- **GitHub Actions in a second phase**: the failed job's log via `gh run view --log-failed` when `gh` is there, and `actionlint` when installed.
Alternatives ruled out:
- **A model call for every Git question.** It is expensive, and wrong more often than reading the state.
- **Running `git` commands for the developer.** Fast, but one mistaken `reset` loses work, and nobody learns.
- **Shipping a book as knowledge base.** Its licence doesn't allow it, and it's too long to send.
Consequences: a `core/git` module that turns `git` output into a state and picks the cards, with tests on real outputs (rebase, merge, detached HEAD, nothing to do). A new mode, MODE: GIT_CONFLICT, with evals on a rebase conflict (both sides kept), a merge conflict at entry level, and training. The playbook cards are written in Italian and English. The diary records the conflicts resolved, with the help used.

Update 2026-11-26, after the first real trial: the Git panel is a section of Pebble's sidebar, like the ⌥P help (ADR-015), not an editor column. It becomes visible when there's something to do and opens from the status bar item or **Pebble: Git**. The same trial added two safeguards: a "union" equal to one side is shown as keeping that side, with a warning; and files resolved but not saved are flagged, with a *Save* button.
