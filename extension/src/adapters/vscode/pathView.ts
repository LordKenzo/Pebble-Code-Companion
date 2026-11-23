import * as vscode from "vscode";
import { estimateCost, type Price } from "../../core/cost";
import type { HelpTask } from "../../core/help";
import type { ExperienceLevel, Usage } from "../../core/model";
import { buildPlanMessage, insertStep, nextStep, parseRoadmap, planToSection, PlanStep, type PlanFile } from "../../core/plan";
import type { MentorModel } from "../../core/ports";
import { WorkspaceStore } from "../store/workspaceStore";
import type { ProposalDocs } from "./proposals";
import { buildViewModel, evaluate, parsePath, updateSeenRed, withCheckbox, type PathViewModel, type Task, type TaskState, type TaskView } from "../../core/path";
import type { ParsedTest } from "../../core/tap";
import { SignalCollector } from "../signals/collector";

const PATH_FILE = [".pebble", "percorso.md"] as const;
const SEEN_RED_KEY = "pebble.path.seenRed";

/** Percorso di esempio, scritto quando il progetto non ne ha ancora uno. */
export const EXAMPLE_PATH = `# Percorso

Una sezione per passo della roadmap, un compito per riga (ADR-007).
Sotto ogni compito: fare, firma, fatto quando. Le righe che Pebble non riconosce restano dove sono.

## Passo 1 · Setup
- [ ] Installa TypeScript e i tipi di Node
  fare: \`npm install -D typescript @types/node\`
  fatto quando: file package.json
- [ ] Un primo test che passa
  fare: un test banale in test/, per verificare che il runner parta
  fatto quando: test "il runner funziona"
`;

/** Quello che serve per preparare un passo con il modello (ADR-011). */
export interface PlannerDeps {
  mentor(): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  level(): ExperienceLevel;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  proposals: ProposalDocs;
}

export interface PathSettings {
  testCommand: string;
  timeoutSeconds: number;
  verifyOnSave: boolean;
  requireRedFirst: boolean;
}

interface CheckInfo {
  at?: string;
  running: boolean;
  tests?: number;
  failed?: number;
  error?: string;
  command: string;
}

type FromWebview =
  | { type: "ready" }
  | { type: "toggle"; line: number; checked: boolean }
  | { type: "reveal"; line: number }
  | { type: "createExample" }
  | { type: "verify" }
  | { type: "settings" }
  | { type: "planNext" };

const keyOf = (t: Task) => `${t.line}:${t.title}`;

/**
 * Vista "Percorso" (ADR-001, ADR-007) con la grafica di mockup/on-demand.html, e il suo controller:
 * al salvataggio raccoglie i segnali locali (ADR-008), aggiorna le caselle e ricorda i test visti rossi (ADR-010).
 */
export class PathView implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly id = "pebble.path";

  private view: vscode.WebviewView | undefined;
  private model: (PathViewModel & { hasFile: boolean; check: CheckInfo; next: { n: number; title: string } | null; planning: boolean; roadmapSteps: number | null }) | null = null;
  private roadmap: string | null = null;
  private planning = false;
  private text: string | null = null;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly collector: SignalCollector | undefined;
  private states = new Map<string, TaskState>();
  private running = false;
  private pending: boolean | null = null; // verifica in coda mentre ne gira un'altra; true = con i test
  private timer: ReturnType<typeof setTimeout> | undefined;
  private queuedRunTests = false;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly memento: vscode.Memento,
    private readonly settings: () => PathSettings,
    private readonly planner?: PlannerDeps,
  ) {
    if (root) {
      this.collector = new SignalCollector(root, () => this.settings());
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, PATH_FILE.join("/")));
      this.disposables.push(
        watcher,
        watcher.onDidChange(() => void this.refresh()),
        watcher.onDidCreate(() => void this.refresh()),
        watcher.onDidDelete(() => void this.refresh()),
        // Le modifiche non ancora salvate contano: la vista segue quello che vedi nell'editor.
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (this.isPathFile(e.document.uri)) this.load(e.document.getText());
        }),
        // Al salvataggio di un file del progetto: verifica con i test (non per percorso.md, che scriviamo noi).
        vscode.workspace.onDidSaveTextDocument((doc) => {
          if (!this.settings().verifyOnSave || this.isPathFile(doc.uri) || !this.inProject(doc.uri)) return;
          this.schedule(true, 900);
        }),
        // Gli errori dell'editor cambiano spesso: rivaluta senza rilanciare i test.
        vscode.languages.onDidChangeDiagnostics(() => {
          if (this.text !== null) this.schedule(false, 600);
        }),
      );
    }
    void this.refresh().then(() => {
      if (this.text !== null) this.schedule(true, 1500);
    });
  }

  get uri(): vscode.Uri | undefined {
    return this.root && vscode.Uri.joinPath(this.root, ...PATH_FILE);
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    const media = vscode.Uri.joinPath(this.extensionUri, "media");
    view.webview.options = { enableScripts: true, localResourceRoots: [media] };
    view.webview.html = html(
      view.webview.cspSource,
      view.webview.asWebviewUri(vscode.Uri.joinPath(media, "path.css")),
      view.webview.asWebviewUri(vscode.Uri.joinPath(media, "path.js")),
    );
    view.webview.onDidReceiveMessage((m: FromWebview) => {
      if (m.type === "ready") this.post();
      else if (m.type === "toggle") void this.toggle(m.line, m.checked);
      else if (m.type === "reveal") void this.reveal(m.line);
      else if (m.type === "createExample") void this.createExample();
      else if (m.type === "verify") void this.verify(true);
      else if (m.type === "settings") void vscode.commands.executeCommand("workbench.action.openSettings", "pebble.path");
      else if (m.type === "planNext") void this.planNext();
    });
    view.onDidChangeVisibility(() => {
      if (view.visible) this.post();
    });
    view.onDidDispose(() => (this.view = undefined));
    this.decorate();
  }

  async refresh(): Promise<void> {
    const uri = this.uri;
    if (!uri) return this.load(null);
    this.roadmap = this.root ? await readText(vscode.Uri.joinPath(this.root, ".pebble", "roadmap.md")) : null;
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (open) return this.load(open.getText());
    try {
      this.load(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)));
    } catch {
      this.load(null);
    }
  }

  private load(text: string | null): void {
    this.text = text;
    const tasks = text === null ? [] : parsePath(text).tasks;
    const states = tasks.map((t) => this.states.get(keyOf(t)) ?? ({ status: "unknown", reason: "" } as TaskState));
    const next = this.roadmap && this.planner ? nextStep(parseRoadmap(this.roadmap), text) : null;
    this.model = {
      ...buildViewModel(tasks, states),
      hasFile: text !== null,
      check: this.checkInfo(),
      next: next && { n: next.n, title: next.title },
      planning: this.planning,
      roadmapSteps: this.roadmap ? parseRoadmap(this.roadmap).length || null : null,
    };
    void vscode.commands.executeCommand("setContext", "pebble.hasPath", text !== null);
    this.decorate();
    this.post();
  }

  private checkInfo(): CheckInfo {
    const run = this.collector?.last;
    const info: CheckInfo = { running: this.running, command: this.settings().testCommand };
    if (run) {
      info.at = run.at.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      info.tests = run.tests.length;
      info.failed = run.tests.filter((t) => !t.ok).length;
      if (run.error) info.error = run.error;
    }
    return info;
  }

  private post(): void {
    if (this.model) void this.view?.webview.postMessage({ type: "model", model: this.model });
  }

  /** Titolo e badge della vista: "3 di 9", e quanti compiti restano. */
  private decorate(): void {
    if (!this.view || !this.model) return;
    const { done, total } = this.model;
    this.view.description = total ? `${done} di ${total}` : undefined;
    this.view.badge = total && done < total ? { value: total - done, tooltip: `${total - done} compiti da fare` } : undefined;
  }

  // ---------- verifica con i segnali ----------

  private schedule(runTests: boolean, delayMs: number): void {
    this.queuedRunTests ||= runTests;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const withTests = this.queuedRunTests;
      this.queuedRunTests = false;
      void this.verify(withTests);
    }, delayMs);
  }

  /** Raccoglie i segnali, valuta i compiti e aggiorna le caselle. Mai due verifiche in parallelo. */
  async verify(runTests: boolean): Promise<void> {
    if (!this.collector || this.text === null) return;
    if (this.running) {
      this.pending = (this.pending ?? false) || runTests;
      return;
    }
    this.running = true;
    if (runTests) this.load(this.text); // mostra "sto lanciando i test"
    try {
      const tasks = parsePath(this.text).tasks;
      const signals = await this.collector.collect(tasks, runTests);
      let seenRed = this.memento.get<string[]>(SEEN_RED_KEY, []);
      const run = this.collector.last;
      if (runTests && run && !run.error) {
        seenRed = updateSeenRed(seenRed, run.tests);
        await this.memento.update(SEEN_RED_KEY, seenRed);
      }
      const states = evaluate(tasks, { ...signals, seenRed }, { requireRedFirst: this.settings().requireRedFirst });
      this.states = new Map(tasks.map((t, i) => [keyOf(t), states[i]!]));
      await this.applyCheckboxes();
    } finally {
      this.running = false;
      await this.refresh();
      if (this.pending !== null) {
        const next = this.pending;
        this.pending = null;
        void this.verify(next);
      }
    }
  }

  /** Scrive nel file solo le caselle che cambiano, una riga per compito (ADR-007). */
  private async applyCheckboxes(): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const doc = await vscode.workspace.openTextDocument(uri);
    const edit = new vscode.WorkspaceEdit();
    for (const task of parsePath(doc.getText()).tasks) {
      const state = this.states.get(keyOf(task));
      if (!state || state.status === "unknown") continue;
      const want = state.status === "done";
      if (want === task.checked) continue;
      const updated = withCheckbox(doc.lineAt(task.line).text, want);
      if (updated !== null) edit.replace(uri, doc.lineAt(task.line).range, updated);
    }
    if (!edit.size) return;
    const wasDirty = doc.isDirty;
    await vscode.workspace.applyEdit(edit);
    if (!wasDirty) await doc.save();
  }

  private isPathFile(uri: vscode.Uri): boolean {
    return uri.toString() === this.uri?.toString();
  }

  private inProject(uri: vscode.Uri): boolean {
    return !!this.root && uri.scheme === "file" && uri.fsPath.startsWith(this.root.fsPath) && !/[\\/](node_modules|\.git|out|dist)[\\/]/.test(uri.fsPath);
  }

  /**
   * Contesto per il fumetto (ADR-009): il compito del passo corrente che cita il file aperto,
   * altrimenti il compito attivo; più gli ultimi risultati dei test, se sono partiti.
   */
  helpContext(filePath: string): { task?: HelpTask; tests?: ParsedTest[] } {
    const run = this.collector?.last;
    const tests = run && !run.error ? run.tests : undefined;
    const step = this.model?.steps[this.model.currentStep];
    const open = step?.tasks.filter((t) => !t.checked) ?? [];
    const mentions = (t: TaskView) => [t.title, t.todo ?? "", ...t.when.map((w) => w.text)].some((s) => s.includes(filePath));
    const t = open.find(mentions) ?? open.find((x) => x.current) ?? open[0];
    const task = t && { title: t.title, todo: t.todo, signature: t.signature, when: t.when.map((w) => w.text) };
    return { ...(task && { task }), ...(tests && { tests }) };
  }

  // ---------- il prossimo passo (ADR-011) ----------

  /** Scompone il prossimo passo della roadmap dal codice com'è adesso e lo propone come diff. */
  async planNext(): Promise<void> {
    const uri = this.uri;
    if (!this.root || !uri || !this.planner || this.planning) return;
    const planner = this.planner;
    this.planning = true;
    this.load(this.text);
    try {
      const ctx = await new WorkspaceStore(this.root).load();
      const step = nextStep(parseRoadmap(ctx.roadmap ?? ""), this.text);
      if (!step) {
        void vscode.window.showInformationMessage(
          ctx.roadmap ? "Pebble: chiudi prima i compiti del passo corrente, poi preparo il prossimo." : "Pebble: manca .pebble/roadmap.md. Lancia «Pebble: Leggi il bootstrap e proponi il piano».",
        );
        return;
      }
      const files = await planFiles(this.root);
      const message = buildPlanMessage(ctx, step, this.text, files, planner.level());
      const mentor = await planner.mentor();
      const { data, usage } = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Pebble prepara il passo ${step.n} · ${step.title}…` },
        async () => mentor.generate(await planner.systemPrompt(), message, PlanStep, "plan_step"),
      );
      await planner.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, planner.priceFor(mentor)) });

      const { markdown, dropped } = planToSection(data, step);
      const proposed = insertStep(this.text, markdown, step.n);
      if (proposed === null) {
        void vscode.window.showWarningMessage(`Pebble: il passo ${step.n} ha già compiti fatti, non lo riscrivo.`);
        return;
      }
      const key = `percorso-${Date.now()}`;
      const left = this.text === null ? planner.proposals.put(`${key}/percorso-vuoto.md`, "") : uri;
      const right = planner.proposals.put(`${key}/percorso-proposto.md`, proposed);
      await vscode.commands.executeCommand("vscode.diff", left, right, `Percorso: attuale ↔ passo ${step.n} proposto da Pebble`);
      const extra = [data.reading, data.question ? `Domanda: ${data.question}` : "", dropped.length ? `(${dropped.length} condizioni scartate perché scritte male)` : ""]
        .filter(Boolean)
        .join(" ");
      const choice = await vscode.window.showInformationMessage(
        `Pebble propone ${data.tasks.length} compiti per il passo ${step.n} · ${step.title}. ${extra}`,
        "Accetta",
        "Scarta",
      );
      if (choice === "Accetta") {
        await this.writePath(proposed);
        void vscode.window.showInformationMessage(`Pebble: passo ${step.n} aggiunto al percorso.`);
        this.schedule(true, 300);
      }
    } catch (err) {
      void vscode.window.showErrorMessage(`Pebble non è riuscito a preparare il passo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.planning = false;
      await this.refresh();
    }
  }

  /** Riscrive percorso.md intero (solo dopo che lo sviluppatore ha accettato la proposta). */
  private async writePath(content: string): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (open) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, new vscode.Range(0, 0, open.lineCount, 0), content);
      await vscode.workspace.applyEdit(edit);
      await open.save();
    } else {
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
    }
  }

  // ---------- azioni ----------

  /** Apre percorso.md sulla riga del compito. */
  async reveal(line: number): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const editor = await vscode.window.showTextDocument(uri, { preview: true });
    const pos = new vscode.Position(Math.min(line, editor.document.lineCount - 1), 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  /** Crea .pebble/percorso.md di esempio se non c'è, poi lo apre. */
  async createExample(): Promise<void> {
    const uri = this.uri;
    if (!uri) {
      void vscode.window.showWarningMessage("Pebble: apri prima la cartella di un progetto.");
      return;
    }
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(EXAMPLE_PATH));
    }
    await vscode.window.showTextDocument(uri, { preview: true });
    await this.refresh();
    this.schedule(true, 300);
  }

  /** Spuntare a mano: cambia solo la riga del compito. Se i segnali dicono altro, alla prossima verifica vincono loro. */
  private async toggle(line: number, checked: boolean): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const doc = await vscode.workspace.openTextDocument(uri);
    const updated = line < doc.lineCount ? withCheckbox(doc.lineAt(line).text, checked) : null;
    if (updated === null) {
      void vscode.window.showWarningMessage("Pebble: il percorso è cambiato mentre lo spuntavi. Ho ricaricato la vista, riprova.");
      return this.refresh();
    }
    const wasDirty = doc.isDirty;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, doc.lineAt(line).range, updated);
    await vscode.workspace.applyEdit(edit);
    if (!wasDirty) await doc.save();
    await this.refresh();
  }

  dispose(): void {
    clearTimeout(this.timer);
    for (const d of this.disposables) d.dispose();
  }
}

async function readText(uri: vscode.Uri): Promise<string | null> {
  const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
  if (open) return open.getText();
  try {
    return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    return null;
  }
}

const PLAN_EXCLUDE = "{**/node_modules/**,**/.git/**,**/out/**,**/dist/**,**/build/**,**/.pebble/**,**/coverage/**,**/*.vsix,**/package-lock.json,**/yarn.lock,**/pnpm-lock.yaml}";
const MAX_FILE = 8_000;
const MAX_TOTAL = 40_000;

/** Elenco dei file del progetto, con il contenuto di quelli piccoli e rilevanti (manifest, sorgenti, test). */
async function planFiles(root: vscode.Uri): Promise<PlanFile[]> {
  const uris = await vscode.workspace.findFiles(new vscode.RelativePattern(root, "**/*"), PLAN_EXCLUDE, 300);
  const rel = uris.map((u) => ({ uri: u, path: vscode.workspace.asRelativePath(u, false) })).sort((a, b) => a.path.localeCompare(b.path));
  const relevant = (p: string) => /^(package\.json|tsconfig[\w.]*\.json|pyproject\.toml)$/.test(p) || /^(src|test|tests|lib|app)\/.+\.(ts|tsx|js|mjs|py|go|rs|java|kt|swift)$/.test(p);
  let total = 0;
  const out: PlanFile[] = [];
  for (const f of rel) {
    if (relevant(f.path) && total < MAX_TOTAL) {
      const text = await readText(f.uri);
      if (text !== null && text.length <= MAX_FILE) {
        total += text.length;
        out.push({ path: f.path, content: text });
        continue;
      }
    }
    out.push({ path: f.path });
  }
  return out;
}

function html(cspSource: string, css: vscode.Uri, js: vscode.Uri): string {
  const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
</head><body><div id="root" aria-live="polite"></div>
<script nonce="${nonce}" src="${js}"></script>
</body></html>`;
}
