import { localSectionName, nextSectionNumber, sectionWord } from "../../core/sections";
import { canScaffold, taskCommands } from "../../core/commands";
import type { Ghost } from "../../core/prompt";
import type { TestSnapshot } from "../../core/adopt";
import { folderInfo } from "./projectSnapshot";
import { folderNameFromBootstrap, type FolderInfo } from "../../core/folder";
import * as vscode from "vscode";
import { estimateCost, type Price } from "../../core/cost";
import type { HelpTask } from "../../core/help";
import type { ExperienceLevel, Usage } from "../../core/model";
import { appendSection, buildPathMessage, buildPlanMessage, insertStep, nextStep, parseRoadmap, pathTitle, planToSection, PlanStep, type PlanFile } from "../../core/plan";
import type { MentorModel } from "../../core/ports";
import { WorkspaceStore } from "../store/workspaceStore";
import type { ProposalDocs } from "./proposals";
import { buildScaffoldMessage, composeScaffold, Scaffold } from "../../core/scaffold";
import { bootstrapGuide, commonUnknowns, composeBootstrap, unknownStack, type BootstrapAnswers } from "../../core/bootstrap";
import { EXAMPLE_PATH as EXAMPLES, NOTICE_TEXT, VIEW_TEXT, type Lang } from "../../core/i18n";
import { LEVELS, type ExperienceLevel as Level } from "../../core/model";
import { buildViewModel, evaluate, parsePath, updateSeenRed, withCheckbox, type PathViewModel, type Task, type TaskState, type TaskView } from "../../core/path";
import { taskEvents, testEvents } from "../../core/diary";
import type { ParsedTest } from "../../core/tap";
import type { DiaryWriter } from "../store/diaryStore";
import { SignalCollector } from "../signals/collector";

const PATH_FILE = [".pebble", "percorso.md"] as const;
const SEEN_RED_KEY = "pebble.path.seenRed";

/** Quello che serve per preparare un passo con il modello (ADR-011). */
export interface PlannerDeps {
  /** Il modello del fantasmino roadmap (#20). */
  mentor(ghost?: Ghost): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  /** Il livello per quel file, o del progetto senza percorso (roadmap #23). */
  level(path?: string | null): ExperienceLevel;
  /** Il livello scelto nell'onboarding diventa quello del progetto. */
  setLevel(level: ExperienceLevel): Promise<void>;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  proposals: ProposalDocs;
}

export interface PathSettings {
  testCommand: string;
  timeoutSeconds: number;
  verifyOnSave: boolean;
  requireRedFirst: boolean;
  /** Lingua di interfaccia, testi generati e risposte del modello (ADR-012). */
  lang: Lang;
}

/** Il sentiero d'avvio: bootstrap, piano in .pebble/, primo passo. */
interface Onboarding {
  bootstrap: boolean;
  /** C'è codice ma non bootstrap: si propone l'adozione (ADR-014). */
  hasCode: boolean;
  /** Che cosa è la cartella: un contenitore di progetti propone una cartella nuova; un dubbio la offre. */
  folder: FolderInfo["kind"];
  projects: string[];
  roadmap: boolean;
  commonUnknowns: string[];
  level: string;
}

interface CheckInfo {
  /** Nomi dei test trovati nell'ultima esecuzione: servono a spiegare un "test non trovato". */
  names?: string[];
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
  | { type: "planNext" }
  | { type: "scaffold"; path: string; line: number }
  | { type: "bootstrapWizard"; answers: BootstrapAnswers; level: string | null; unknownStack?: boolean }
  | { type: "bootstrapTemplate" }
  | { type: "openBootstrap" }
  | { type: "init" }
  | { type: "adopt" }
  | { type: "newFolder" }
  | { type: "openProject" }
  | { type: "useHere" }
  | { type: "newPath"; kind: "feature" | "bug" }
  | { type: "openMap" }
  | { type: "reviewStep"; n: number }
  | { type: "copy"; text: string }
  | { type: "offer"; how: OfferAction }
  | { type: "runCommand"; cmd: string };

type OfferAction = "accept" | "edit" | "discard" | "diff";

/**
 * Una proposta del modello in attesa di risposta (passo, sentiero o scheletro). Resta nel pannello finché lo sviluppatore
 * non sceglie: chiudere la notifica non la perde, e non si paga di nuovo la chiamata per riaverla.
 */
interface Offer {
  label: string;
  text: string;
  acceptLabel: string;
  diff: () => Promise<void>;
  accept: () => Promise<void>;
  edit: () => Promise<void>;
}

const keyOf = (t: Task) => `${t.line}:${t.title}`;

/**
 * Vista "Percorso" (ADR-001, ADR-007) con la grafica di mockup/on-demand.html, e il suo controller:
 * al salvataggio raccoglie i segnali locali (ADR-008), aggiorna le caselle e ricorda i test visti rossi (ADR-010).
 */
export class PathView implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly id = "pebble.path";

  private view: vscode.WebviewView | undefined;
  private model: (PathViewModel & {
    t: (typeof VIEW_TEXT)[Lang]; hasFile: boolean; check: CheckInfo; next: { n: number; title: string } | null; planning: boolean; roadmapSteps: number | null; onboarding: Onboarding;
    offer: { label: string; text: string; accept: string; edit: string; discard: string } | null }) | null = null;
  private offer: Offer | null = null;
  private hasBootstrap = false;
  /** C'è già codice nel progetto: l'avvio guidato propone di adottarlo (ADR-014). */
  private hasCode = false;
  private folder: FolderInfo = { kind: "empty", projects: [] };
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
    private readonly diary?: DiaryWriter,
  ) {
    if (root) {
      this.collector = new SignalCollector(root, () => this.settings());
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, PATH_FILE.join("/")));
      this.disposables.push(
        watcher,
        watcher.onDidChange(() => void this.refresh()),
        watcher.onDidCreate(() => void this.refresh()),
        watcher.onDidDelete(() => void this.refresh()),
        ...(() => {
          // Le tappe del sentiero d'avvio cambiano quando nascono bootstrap.md e la roadmap.
          const w = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, "{bootstrap.md,init.md,.pebble/roadmap.md}"));
          return [w, w.onDidCreate(() => void this.refresh()), w.onDidChange(() => void this.refresh()), w.onDidDelete(() => void this.refresh())];
        })(),
        // Le modifiche non ancora salvate contano: la vista segue quello che vedi nell'editor.
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (this.isPathFile(e.document.uri)) this.load(e.document.getText());
        }),
        // Al salvataggio di un file del progetto: verifica con i test (non per percorso.md, che scriviamo noi).
        vscode.workspace.onDidSaveTextDocument((doc) => {
          if (!this.settings().verifyOnSave || this.isPathFile(doc.uri) || !this.inProject(doc.uri)) return;
          this.schedule(true, 900);
        }),
        // Appena la cartella diventa attendibile, i test si possono lanciare.
        vscode.workspace.onDidGrantWorkspaceTrust(() => this.schedule(true, 300)),
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
      else if (m.type === "scaffold") void this.scaffold(m.path, m.line);
      else if (m.type === "bootstrapWizard") {
        const lang = this.settings().lang;
        const answers = m.unknownStack ? { ...m.answers, unknowns: [...m.answers.unknowns, unknownStack(lang)] } : m.answers;
        void this.writeBootstrap(composeBootstrap(answers, lang), m.level);
      } else if (m.type === "bootstrapTemplate") void this.writeBootstrap(bootstrapGuide(this.settings().lang), null, true);
      else if (m.type === "openBootstrap" && this.root) void vscode.window.showTextDocument(vscode.Uri.joinPath(this.root, "bootstrap.md"));
      else if (m.type === "init") void vscode.commands.executeCommand("pebble.init");
      else if (m.type === "adopt") void vscode.commands.executeCommand("pebble.adopt");
      else if (m.type === "newFolder") void this.createProjectFolder();
      else if (m.type === "openProject") void this.openProject();
      else if (m.type === "useHere") void this.memento.update("pebble.folder.useHere", true).then(() => this.refresh());
      else if (m.type === "newPath") void this.newPath(m.kind);
      else if (m.type === "openMap") void vscode.commands.executeCommand("pebble.map.open");
      else if (m.type === "offer") void this.answerOffer(m.how);
      else if (m.type === "runCommand") void this.runCommand(m.cmd);
      else if (m.type === "copy") {
        void vscode.env.clipboard.writeText(m.text);
        void vscode.window.setStatusBarMessage(VIEW_TEXT[this.settings().lang].testNamesCopied, 2500);
      }
      else if (m.type === "reviewStep") void vscode.commands.executeCommand("pebble.map.reviewStep", m.n);
    });
    view.onDidChangeVisibility(() => {
      if (view.visible) this.post();
    });
    view.onDidDispose(() => (this.view = undefined));
    this.decorate();
  }

  /**
   * Il progetto nuovo in una cartella sua: Pebble la crea, ci sposta bootstrap.md se c'è e la apre.
   * Da lì la cartella aperta è di nuovo la radice del progetto, come si aspettano i compiti.
   */
  private async createProjectFolder(): Promise<void> {
    if (!this.root) return;
    const T = VIEW_TEXT[this.settings().lang];
    const bootstrapUri = vscode.Uri.joinPath(this.root, "bootstrap.md");
    const bootstrap = await readText(bootstrapUri);
    const name = (await vscode.window.showInputBox({
      prompt: T.newFolderPrompt,
      value: folderNameFromBootstrap(bootstrap),
      validateInput: (v) => (/^[\w.-]+$/.test(v.trim()) ? null : T.newFolderInvalid),
    }))?.trim();
    if (!name) return;
    const dir = vscode.Uri.joinPath(this.root, name);
    try {
      if ((await vscode.workspace.fs.readDirectory(dir)).length) {
        void vscode.window.showWarningMessage(T.newFolderExists.replace("{name}", name));
        return;
      }
    } catch {
      // non esiste: la creiamo
    }
    await vscode.workspace.fs.createDirectory(dir);
    if (bootstrap !== null) await vscode.workspace.fs.rename(bootstrapUri, vscode.Uri.joinPath(dir, "bootstrap.md"));
    await vscode.commands.executeCommand("vscode.openFolder", dir, { forceNewWindow: false });
  }

  /** In un contenitore di progetti: apre quello scelto. */
  private async openProject(): Promise<void> {
    if (!this.root || !this.folder.projects.length) return;
    const pick = await vscode.window.showQuickPick(this.folder.projects, { placeHolder: VIEW_TEXT[this.settings().lang].pickProject });
    if (pick) await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.joinPath(this.root, pick), { forceNewWindow: false });
  }

  async refresh(): Promise<void> {
    const uri = this.uri;
    if (!uri) return this.load(null);
    this.roadmap = this.root ? await readText(vscode.Uri.joinPath(this.root, ".pebble", "roadmap.md")) : null;
    this.hasBootstrap = false;
    for (const name of ["bootstrap.md", "init.md"]) {
      if (this.root && (await readText(vscode.Uri.joinPath(this.root, name)))?.trim()) this.hasBootstrap = true;
    }
    this.folder = !this.hasBootstrap && this.root ? await folderInfo(this.root) : { kind: "empty", projects: [] };
    // "Usa comunque questa cartella" vale per questa cartella: il contenitore torna una cartella qualsiasi.
    if (this.folder.kind === "container" && this.memento.get<boolean>("pebble.folder.useHere")) this.folder = { kind: "other", projects: [] };
    this.hasCode = this.folder.kind === "project";
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
      ...buildViewModel(tasks, states, this.settings().lang, this.collector?.last && !this.collector.last.error ? this.collector.last.tests : null),
      t: VIEW_TEXT[this.settings().lang],
      hasFile: text !== null,
      check: this.checkInfo(),
      next: next && { n: next.n, title: next.title },
      planning: this.planning,
      roadmapSteps: this.roadmap ? parseRoadmap(this.roadmap).length || null : null,
      offer: this.offer && (() => {
        const N = NOTICE_TEXT[this.settings().lang];
        return { label: this.offer.label, text: this.offer.text, accept: this.offer.acceptLabel, edit: N.reviewEdit, discard: N.discard };
      })(),
      onboarding: {
        bootstrap: this.hasBootstrap,
        hasCode: this.hasCode,
        folder: this.folder.kind,
        projects: this.folder.projects,
        roadmap: !!this.roadmap?.trim(),
        commonUnknowns: commonUnknowns(this.settings().lang),
        level: this.planner?.level() ?? vscode.workspace.getConfiguration("pebble").get<string>("experienceLevel", "mid"),
      },
    };
    void vscode.commands.executeCommand("setContext", "pebble.hasPath", text !== null);
    this.decorate();
    this.post();
  }

  private checkInfo(): CheckInfo {
    const run = this.collector?.last;
    const info: CheckInfo = { running: this.running, command: this.collector?.lastCommand ?? this.settings().testCommand };
    if (run) {
      info.at = run.at.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      info.tests = run.tests.length;
      info.failed = run.tests.filter((t) => !t.ok).length;
      info.names = run.tests.map((t) => t.name).slice(0, 8);
      if (run.error) info.error = run.error;
    }
    return info;
  }

  private post(): void {
    const view = this.view;
    if (!this.model || !view) return;
    // Il fantasmino Roadmap, pesca come nel banner (media/ghost-*-roadmap.svg): il Percorso è casa sua.
    const ghost = (mood: string) => view.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", `ghost-${mood}-roadmap.svg`)).toString();
    const ghosts = { neutral: ghost("neutral"), happy: ghost("happy"), worried: ghost("worried") };
    void view.webview.postMessage({ type: "model", model: { ...this.model, ghosts } });
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
  /** I test all'adozione (ADR-014): quanti verdi e quali rossi all'arrivo. Null se non si possono lanciare. */
  async testSnapshot(): Promise<TestSnapshot | null> {
    if (!this.collector) return null;
    const run = await this.collector.runOnce();
    if (run.error || !run.tests.length) return null;
    return { total: run.tests.length, passed: run.tests.filter((t) => t.ok).length, red: run.tests.filter((t) => !t.ok).map((t) => t.name) };
  }

  /** Gli ultimi risultati dei test, per capire cosa è cambiato tra una verifica e l'altra (diario). */
  private lastTests: ParsedTest[] | undefined;

  /** Intestazione del passo corrente, per gli eventi del diario che non ne indicano uno. */
  currentStepHeading(): string | null {
    const step = this.model?.steps[this.model.currentStep];
    if (!step || this.text === null) return null;
    return parsePath(this.text).tasks.find((t) => t.step && localSectionName(t.step, this.settings().lang) === step.name)?.step ?? null;
  }

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
      const states = evaluate(tasks, { ...signals, seenRed }, { requireRedFirst: this.settings().requireRedFirst, lang: this.settings().lang });
      this.states = new Map(tasks.map((t, i) => [keyOf(t), states[i]!]));
      // Diario (ADR-013): test diventati rossi o verdi, caselle che cambiano, passo chiuso.
      if (runTests && run && !run.error) {
        for (const e of testEvents(tasks, this.lastTests, run.tests, seenRed)) this.diary?.append(e.event, e.step);
        this.lastTests = run.tests;
      }
      for (const e of taskEvents(tasks, states)) this.diary?.append(e.event, e.step);
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
    if (this.offer) return this.remindOffer();
    const planner = this.planner;
    const lang = this.settings().lang;
    const N = NOTICE_TEXT[lang];
    this.planning = true;
    this.load(this.text);
    try {
      const ctx = await new WorkspaceStore(this.root).load();
      const step = nextStep(parseRoadmap(ctx.roadmap ?? ""), this.text);
      if (!step) {
        void vscode.window.showInformationMessage(ctx.roadmap ? N.closeStepFirst : N.noRoadmap);
        return;
      }
      const files = await planFiles(this.root);
      const message = buildPlanMessage(ctx, step, this.text, files, planner.level(), lang);
      const mentor = await planner.mentor("roadmap");
      const { data, usage } = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: N.preparingStep(step.n, step.title) },
        async () => mentor.generate(await planner.systemPrompt(), message, PlanStep, "plan_step"),
      );
      await planner.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, planner.priceFor(mentor)) });

      const { markdown, dropped } = planToSection(data, step, lang);
      const proposed = insertStep(this.text, markdown, step.n, lang);
      if (proposed === null) {
        void vscode.window.showWarningMessage(N.stepHasDone(step.n));
        return;
      }
      const extra = [data.reading, data.question ? N.question(data.question) : "", dropped.length ? N.droppedConditions(dropped.length) : ""]
        .filter(Boolean)
        .join(" ");
      // Al momento della risposta si riparte dal percorso di allora: nel frattempo lo sviluppatore può averlo cambiato.
      const fresh = () => insertStep(this.text, markdown, step.n, lang);
      this.present({
        label: `${sectionWord("step", lang)} ${step.n} · ${step.title}`,
        text: N.stepProposal(data.tasks.length, step.n, step.title, extra),
        acceptLabel: N.accept,
        diff: () => this.showProposalDiff(fresh() ?? proposed, N.diffStepTitle(step.n)),
        accept: async () => {
          const now = fresh();
          if (now === null) return void vscode.window.showWarningMessage(N.stepHasDone(step.n));
          await this.writePath(now);
          this.diary?.append({ kind: "stepPlanned", tasks: data.tasks.length }, { n: step.n, title: step.title });
          void vscode.window.showInformationMessage(N.stepAdded(step.n));
          this.schedule(true, 300);
        },
        edit: () => reviewInEditor(uri, fresh() ?? proposed, N.reviewInEditor(N.stepInEditor)),
      });
    } catch (err) {
      void vscode.window.showErrorMessage(N.stepFailed(err instanceof Error ? err.message : String(err)));
    } finally {
      this.planning = false;
      await this.refresh();
    }
  }

  // ---------- sentieri brevi per una funzionalità o un bug (ADR-014) ----------

  /** Chiede una frase, prepara un sentiero di 2-6 compiti dal codice com'è adesso e lo propone come diff. */
  async newPath(kind: "feature" | "bug"): Promise<void> {
    const uri = this.uri ?? (this.root && vscode.Uri.joinPath(this.root, ...PATH_FILE));
    if (!this.root || !uri || !this.planner || this.planning) return;
    if (this.offer) return this.remindOffer();
    const planner = this.planner;
    const lang = this.settings().lang;
    const N = NOTICE_TEXT[lang];
    const description = await vscode.window.showInputBox({
      prompt: kind === "bug" ? N.newBugPrompt : N.newFeaturePrompt,
      placeHolder: kind === "bug" ? N.newBugPlaceholder : N.newFeaturePlaceholder,
      ignoreFocusOut: true,
    });
    if (!description?.trim()) return;
    const n = nextSectionNumber(this.text, kind);
    const title = pathTitle(description);
    const label = `${sectionWord(kind, lang)} ${n} · ${title}`;
    this.planning = true;
    this.load(this.text);
    try {
      const ctx = await new WorkspaceStore(this.root).load();
      const message = buildPathMessage(ctx, kind, description, this.text, await planFiles(this.root), planner.level(), lang);
      const mentor = await planner.mentor("roadmap");
      const { data, usage } = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: N.preparingPath(label) },
        async () => mentor.generate(await planner.systemPrompt(), message, PlanStep, "plan_path"),
      );
      await planner.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, planner.priceFor(mentor)) });
      const { markdown, dropped } = planToSection(data, { n, title, text: description }, lang, kind);
      const extra = [data.reading, data.question ? N.question(data.question) : "", dropped.length ? N.droppedConditions(dropped.length) : ""].filter(Boolean).join(" ");
      const fresh = () => appendSection(this.text, markdown, lang);
      this.present({
        label,
        text: N.pathProposal(data.tasks.length, label, extra),
        acceptLabel: N.accept,
        diff: () => this.showProposalDiff(fresh(), N.diffPathTitle(label)),
        accept: async () => {
          const now = fresh();
          if (this.text === null) {
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, ".."));
            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(now));
            await this.refresh();
          } else await this.writePath(now);
          this.diary?.append({ kind: "stepPlanned", tasks: data.tasks.length }, { n, title, kind });
          void vscode.window.showInformationMessage(N.pathAdded(label));
          this.schedule(true, 300);
        },
        edit: () => reviewInEditor(uri, fresh(), N.reviewInEditor(N.stepInEditor)),
      });
    } catch (err) {
      void vscode.window.showErrorMessage(N.pathFailed(err instanceof Error ? err.message : String(err)));
    } finally {
      this.planning = false;
      await this.refresh();
    }
  }

  // ---------- il sentiero d'avvio ----------

  /** Scrive bootstrap.md (dalla procedura guidata o la traccia) e lo apre. Non sovrascrive senza chiedere. */
  private async writeBootstrap(content: string, level: string | null, guide = false): Promise<void> {
    const N = NOTICE_TEXT[this.settings().lang];
    if (!this.root) {
      void vscode.window.showWarningMessage(N.openFolderFirst);
      return;
    }
    const uri = vscode.Uri.joinPath(this.root, "bootstrap.md");
    const existing = await readText(uri);
    if (existing?.trim()) {
      if (guide) return void vscode.window.showTextDocument(uri);
      const ok = await vscode.window.showWarningMessage(N.bootstrapExists, { modal: true }, N.replace);
      if (ok !== N.replace) return;
    }
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
    if (level && (LEVELS as readonly string[]).includes(level)) {
      if (this.planner) await this.planner.setLevel(level as Level);
      else await vscode.workspace.getConfiguration("pebble").update("experienceLevel", level as Level, vscode.ConfigurationTarget.Global);
    }
    await vscode.window.showTextDocument(uri, { preview: false });
    void vscode.window.showInformationMessage(guide ? N.bootstrapGuideWritten : N.bootstrapWritten);
    await this.refresh();
  }

  // ---------- prepara il file (ADR-003) ----------

  /** Scheletro di un file nuovo: le parti dal modello, il testo composto da Pebble, un diff da accettare. */
  async scaffold(path?: string, taskLine?: number): Promise<void> {
    if (!this.root || !this.planner) return;
    if (this.offer) return this.remindOffer();
    const planner = this.planner;
    const lang = this.settings().lang;
    const N = NOTICE_TEXT[lang];
    const step = this.model?.steps[this.model.currentStep];
    const fromTask = step?.tasks.find((t) => t.line === taskLine) ?? step?.tasks.find((t) => t.current);
    const target = path ?? (await vscode.window.showInputBox({ prompt: N.whichFile, value: fromTask?.files[0] ?? "src/" }));
    if (!target?.trim()) return;
    const rel = target.trim().replace(/^\.?\//, "");
    // Uno scheletro è TypeScript/JavaScript: un manifest vuoto spunterebbe "file package.json" senza che ci sia niente.
    if (!canScaffold(rel)) return void vscode.window.showInformationMessage(N.notScaffoldable(rel));
    const uri = vscode.Uri.joinPath(this.root, ...rel.split("/"));
    const existing = await readText(uri);
    if (existing?.trim()) {
      void vscode.window.showInformationMessage(N.fileHasCode(rel));
      return;
    }
    try {
      const ctx = await new WorkspaceStore(this.root).load();
      const task = fromTask && { title: fromTask.title, todo: fromTask.todo, signature: fromTask.signature, when: fromTask.when.map((w) => w.text) };
      const signatures = (step?.tasks ?? []).map((t) => t.signature).filter((x): x is string => !!x);
      const message = buildScaffoldMessage(ctx, rel, task, await planFiles(this.root), planner.level(rel), signatures, lang);
      const mentor = await planner.mentor("roadmap");
      const { data, usage } = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: N.preparingFile(rel) },
        async () => mentor.generate(await planner.systemPrompt(), message, Scaffold, "scaffold"),
      );
      await planner.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, planner.priceFor(mentor)) });
      const { text, dropped } = composeScaffold(data, rel, lang);
      if (!text.trim()) return void vscode.window.showInformationMessage(N.emptyScaffold(rel));
      const note = dropped.length ? N.droppedParts(dropped.length) : "";
      const key = `scheletro-${Date.now()}`;
      this.present({
        label: rel,
        text: N.fileProposal(rel, note),
        acceptLabel: N.createFile,
        diff: async () => {
          const left = planner.proposals.put(`${key}/vuoto`, "");
          const right = planner.proposals.put(`${key}/${rel}`, text);
          await vscode.commands.executeCommand("vscode.diff", left, right, N.diffFileTitle(rel));
        },
        accept: async () => {
          // Nel frattempo il file può essere nato: non si sovrascrive il codice di nessuno.
          if ((await readText(uri))?.trim()) return void vscode.window.showInformationMessage(N.fileHasCode(rel));
          await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, ".."));
          await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(text));
          this.diary?.append({ kind: "scaffold", path: rel });
          await vscode.window.showTextDocument(uri);
          this.schedule(true, 500);
        },
        edit: () => reviewInEditor(uri, text, N.reviewInEditor(N.skeletonInEditor)),
      });
    } catch (err) {
      void vscode.window.showErrorMessage(N.fileFailed(err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Mostra la proposta: il diff, la notifica con i tre pulsanti e la scheda nel pannello Percorso.
   * Non aspetta la notifica: se la chiudi, la proposta resta nel pannello finché non scegli.
   */
  private present(offer: Offer): void {
    this.offer = offer;
    this.load(this.text);
    void offer.diff();
    const N = NOTICE_TEXT[this.settings().lang];
    void vscode.window.showInformationMessage(offer.text, offer.acceptLabel, N.reviewEdit, N.discard).then((choice) => {
      // Chiusa senza scegliere, o già decisa dal pannello: la notifica non fa più niente.
      if (choice === undefined || this.offer !== offer) return;
      void this.answerOffer(choice === offer.acceptLabel ? "accept" : choice === N.reviewEdit ? "edit" : "discard");
    });
  }

  /**
   * "Esegui nel terminale": lancia un comando citato in un compito, nella cartella del progetto, in un terminale visibile.
   * Solo comandi che stanno davvero nel percorso (la pagina potrebbe mandare altro) e solo in una cartella attendibile.
   */
  private async runCommand(cmd: string): Promise<void> {
    if (!this.root) return;
    const N = NOTICE_TEXT[this.settings().lang];
    const known = parsePath(this.text ?? "").tasks.some((t) => taskCommands(t.todo).includes(cmd));
    if (!known) return;
    if (!vscode.workspace.isTrusted) return void vscode.window.showWarningMessage(N.runRestricted);
    const name = "Pebble";
    const terminal = vscode.window.terminals.find((t) => t.name === name && t.exitStatus === undefined) ?? vscode.window.createTerminal({ name, cwd: this.root });
    terminal.show(true);
    // Con la shell integration si sa quando il comando finisce (npm install può metterci un minuto): lì si ricontrolla.
    const si = terminal.shellIntegration ?? (await shellIntegrationOf(terminal, 3000));
    if (!si) {
      terminal.sendText(cmd, true);
      this.schedule(false, 4000);
      return;
    }
    const execution = si.executeCommand(cmd);
    const sub = vscode.window.onDidEndTerminalShellExecution((e) => {
      if (e.execution !== execution) return;
      sub.dispose();
      this.schedule(false, 300);
    });
    this.disposables.push(sub);
  }

  /** Una proposta aspetta già: la si rimostra invece di pagare un'altra chiamata. */
  private async remindOffer(): Promise<void> {
    void vscode.window.showInformationMessage(NOTICE_TEXT[this.settings().lang].offerPending);
    await vscode.commands.executeCommand(`${PathView.id}.focus`);
    await this.offer?.diff();
  }

  private async answerOffer(how: OfferAction): Promise<void> {
    const offer = this.offer;
    if (!offer) return;
    if (how === "diff") return offer.diff();
    this.offer = null;
    this.load(this.text);
    try {
      if (how === "accept") await offer.accept();
      else if (how === "edit") await offer.edit();
    } catch (err) {
      void vscode.window.showErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }

  /** Il diff tra il percorso di adesso e quello proposto. */
  private async showProposalDiff(proposed: string, title: string): Promise<void> {
    const uri = this.uri;
    if (!uri || !this.planner) return;
    const key = `percorso-${Date.now()}`;
    const left = this.text === null ? this.planner.proposals.put(`${key}/percorso-vuoto.md`, "") : uri;
    const right = this.planner.proposals.put(`${key}/percorso-proposto.md`, proposed);
    await vscode.commands.executeCommand("vscode.diff", left, right, title);
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
      void vscode.window.showWarningMessage(NOTICE_TEXT[this.settings().lang].openFolderFirst);
      return;
    }
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(EXAMPLES[this.settings().lang]));
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
      void vscode.window.showWarningMessage(NOTICE_TEXT[this.settings().lang].pathChanged);
      return this.refresh();
    }
    const all = parsePath(doc.getText()).tasks;
    const task = all.find((t) => t.line === line);
    if (task && task.checked !== checked) {
      this.diary?.append(checked ? { kind: "taskDone", title: task.title } : { kind: "taskReopened", title: task.title }, task.step);
      const sameStep = all.filter((t) => t.step === task.step);
      if (checked && sameStep.every((t) => t.line === line || t.checked)) {
        this.diary?.append({ kind: "stepClosed", done: sameStep.length, total: sameStep.length }, task.step);
      }
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

/**
 * "Revisiona e modifica": la proposta entra nell'editor come modifica non salvata.
 * Salvare la conferma, annullare o chiudere senza salvare la scarta. Per un file nuovo si apre
 * un documento senza titolo già associato al percorso giusto: salvandolo, il file nasce lì.
 */
async function reviewInEditor(uri: vscode.Uri, content: string, what: string): Promise<void> {
  let exists = true;
  try {
    await vscode.workspace.fs.stat(uri);
  } catch {
    exists = false;
  }
  const target = exists ? uri : uri.with({ scheme: "untitled" });
  const doc = await vscode.workspace.openTextDocument(target);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(target, new vscode.Range(0, 0, doc.lineCount, 0), content);
  await vscode.workspace.applyEdit(edit);
  await vscode.window.showTextDocument(doc, { preview: false });
  void vscode.window.showInformationMessage(what);
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
</head><body><div id="root" aria-live="polite"></div>
<script nonce="${nonce}" src="${js}"></script>
</body></html>`;
}

/** La shell integration di un terminale appena aperto arriva dopo un attimo; se non arriva, null. */
function shellIntegrationOf(terminal: vscode.Terminal, timeoutMs: number): Promise<vscode.TerminalShellIntegration | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.dispose();
      resolve(null);
    }, timeoutMs);
    const sub = vscode.window.onDidChangeTerminalShellIntegration((e) => {
      if (e.terminal !== terminal) return;
      clearTimeout(timer);
      sub.dispose();
      resolve(e.shellIntegration);
    });
  });
}
