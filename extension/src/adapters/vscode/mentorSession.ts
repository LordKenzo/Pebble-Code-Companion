import { AdoptPlan, adoptPlanToFiles, adoptPlanToMarkdown, buildAdoptMessage, type AdoptSnapshot } from "../../core/adopt";
import type { Ghost } from "../../core/prompt";
import type { DiaryEvent } from "../../core/diary";
import { bootstrapGuide } from "../../core/bootstrap";
import { CHAT_TEXT, type Lang } from "../../core/i18n";
import { editorProblems } from "./problems";
import * as vscode from "vscode";
import { estimateCost, formatUsd, type Price } from "../../core/cost";
import {
  buildInitMessage,
  buildTextMessage,
  decisionFile,
  InitPlan,
  initPlanToFiles,
  initPlanToMarkdown,
  TextAnswer,
  type TextMode,
  type Turn,
} from "../../core/modes";
import type { ExperienceLevel, ProjectContext, ReviewResult, Usage } from "../../core/model";
import { stripLongCode } from "../../core/policy";
import type { MentorModel } from "../../core/ports";
import { reviewFile } from "../../core/reviewFile";
import { ProviderError } from "../llm/errors";
import { WorkspaceStore } from "../store/workspaceStore";
import type { ChatAction, ChatView } from "./chatView";
import { toDiagnostics } from "./diagnostics";
import { escapeHtml, renderMarkdown } from "./markdown";
import { ProposalDocs } from "./proposals";

interface PendingChange {
  root: vscode.Uri;
  id: string;
  path: string;
  content: string;
  isNew: boolean;
  reason: string;
}

export interface SessionDeps {
  /** Annota nel diario del passo (ADR-013). */
  note?(event: DiaryEvent): void;
  /** Il modello del fantasmino che risponde (#20): Roadmap per piani e prossimo passo, Mentor per il resto. */
  mentor(ghost?: Ghost): Promise<MentorModel>;
  /** Il livello per quel file, o del progetto senza percorso (roadmap #23). */
  level(path?: string | null): ExperienceLevel;
  systemPrompt(): Promise<string>;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  setting<T>(key: string, fallback: T): T;
  workspaceState: vscode.Memento;
  /** Lingua della conversazione e delle risposte (ADR-012). */
  lang(): Lang;
  /** La fotografia del progetto per l'adozione (ADR-014): file, README, storia, test. */
  snapshot?(): Promise<AdoptSnapshot | null>;
  /** C'è già codice nel progetto? */
  hasCode?(): Promise<boolean>;
}

/** Domande di approfondimento proposte sotto ogni risposta. */
const followUps = (lang: Lang) => {
  const C = CHAT_TEXT[lang];
  return {
    "follow:deep": { label: C.followDeep, question: C.followDeepQ },
    "follow:example": { label: C.followExample, question: C.followExampleQ },
  } as Record<string, { label: string; question: string }>;
};
const FOLLOW_IDS = ["follow:deep", "follow:example"];
const followUpActions = (lang: Lang): ChatAction[] => Object.entries(followUps(lang)).map(([id, f]) => ({ id, label: f.label }));

const labels = (lang: Lang): Record<TextMode, string> => {
  const C = CHAT_TEXT[lang];
  return { CHAT: C.labelChat, NEXT: C.labelNext, TESTS: C.labelTests, NEW_FILE: C.labelNewFile };
};

/** Orchestrazione della conversazione con il mentor nel pannello laterale. */
export class MentorSession {
  private get C() {
    return CHAT_TEXT[this.deps.lang()];
  }

  private history: Turn[] = [];
  private lastAdoption: { plan: AdoptPlan; snapshot: AdoptSnapshot } | undefined;
  private lastPlan: InitPlan | undefined;
  private busy = false;
  private started = new Set<string>();
  /** L'ultima richiesta al modello, per il pulsante "Riprova" dopo un errore. */
  private lastRequest: (() => Promise<void>) | undefined;
  /** Modifiche alle decisioni proposte e non ancora applicate, per chiave del pulsante. */
  private pending = new Map<string, PendingChange>();
  private pendingSeq = 0;

  constructor(
    private view: ChatView,
    private diagnostics: vscode.DiagnosticCollection,
    private deps: SessionDeps,
    private proposals: ProposalDocs,
  ) {}

  // ---------- radice del progetto ----------

  private root(): vscode.Uri | undefined {
    const active = vscode.window.activeTextEditor?.document.uri;
    const folder = (active && vscode.workspace.getWorkspaceFolder(active)) ?? vscode.workspace.workspaceFolders?.[0];
    return folder?.uri;
  }

  private store(): WorkspaceStore | undefined {
    const r = this.root();
    return r ? new WorkspaceStore(r) : undefined;
  }

  private openFile(): { path: string; content: string; doc: vscode.TextDocument } | undefined {
    const doc = vscode.window.activeTextEditor?.document;
    if (!doc || doc.uri.scheme !== "file") return undefined;
    return { path: vscode.workspace.asRelativePath(doc.uri, false), content: doc.getText(), doc };
  }

  // ---------- avvio ----------

  /** Chiamato quando il pannello è pronto: accoglie e, se serve, legge il bootstrap da solo. */
  async start(): Promise<void> {
    const root = this.root();
    if (!root || this.started.has(root.toString())) return;
    this.started.add(root.toString());
    const store = new WorkspaceStore(root);
    const ctx = await store.load();
    const hasPebble = await store.hasPebble();

    if (!ctx.bootstrap) {
      // Codice già presente e niente .pebble/: si propone di adottare il progetto (ADR-014).
      if (!hasPebble && (await this.deps.hasCode?.())) {
        this.view.push({
          kind: "pebble",
          label: this.C.labelWelcome,
          html: renderMarkdown(this.C.foundCode),
          actions: [
            { id: "adopt", label: this.C.adoptProject, primary: true },
            { id: "create-bootstrap", label: this.C.createBootstrap },
          ],
        });
        return;
      }
      this.view.push({
        kind: "pebble",
        label: this.C.labelWelcome,
        html: renderMarkdown(this.C.needBootstrap),
        actions: [{ id: "create-bootstrap", label: this.C.createBootstrap, primary: true }],
      });
      return;
    }

    if (!hasPebble) {
      const doneKey = `pebble.autoInit:${root.toString()}`;
      if (this.deps.setting("autoStart", true) && !this.deps.workspaceState.get(doneKey)) {
        await this.deps.workspaceState.update(doneKey, true);
        this.view.push({ kind: "pebble", label: this.C.labelWelcome, html: renderMarkdown(this.C.foundBootstrap) });
        await this.init();
      } else {
        this.view.push({
          kind: "pebble",
          label: this.C.labelWelcome,
          html: renderMarkdown(this.C.bootstrapNoDecisions),
          actions: [{ id: "init", label: this.C.readBootstrap, primary: true }],
        });
      }
      return;
    }

    const n = ctx.decisions.length;
    this.view.push({
      kind: "pebble",
      label: this.C.labelWelcomeBack,
      html: renderMarkdown(this.C.welcomeBack(n)),
      actions: [
        { id: "next", label: this.C.whatNext, primary: true },
        { id: "review", label: this.C.reviewOpen },
      ],
    });
  }

  // ---------- input dell'utente ----------

  async send(text: string): Promise<void> {
    const cmd = text.trim().toLowerCase();
    if (cmd === "/review") return this.review();
    if (cmd === "/tests") return this.text("TESTS");
    if (cmd === "/next") return this.text("NEXT");
    if (cmd === "/init") return this.init();
    if (cmd === "/clear") {
      this.history = [];
      this.view.clear();
      return;
    }
    this.view.push({ kind: "user", text });
    await this.text("CHAT", text);
  }

  async action(id: string): Promise<void> {
    if (id.startsWith("cmd:")) {
      await vscode.commands.executeCommand(id.slice(4));
      return;
    }
    if (FOLLOW_IDS.includes(id)) {
      const f = followUps(this.deps.lang())[id]!;
      this.view.push({ kind: "user", text: f.label });
      return this.text("CHAT", f.question);
    }
    if (id.startsWith("adr-view:")) return this.showChange(id.slice(9));
    if (id.startsWith("adr-apply:")) return this.applyChange(id.slice(10));
    if (id === "retry") {
      this.view.clearActions("retry");
      return this.lastRequest?.();
    }
    // I pulsanti "una tantum" spariscono dopo l'uso; quelli ripetibili (next, review) restano.
    if (["init", "save-plan", "create-bootstrap", "adopt", "save-adoption"].includes(id)) this.view.clearActions(id);
    if (id === "adopt") return this.adopt();
    if (id === "save-adoption") return this.saveAdoption();
    if (id === "init") return this.init();
    if (id === "save-plan") return this.savePlan();
    if (id === "next") return this.text("NEXT");
    if (id === "review") return this.review();
    if (id === "create-bootstrap") return this.createBootstrap();
    if (id === "open-architecture") {
      const r = this.root();
      if (r) await vscode.window.showTextDocument(vscode.Uri.joinPath(r, ".pebble", "architecture.md"));
    }
  }

  // ---------- modalità ----------

  async init(): Promise<void> {
    const store = this.store();
    if (!store) return this.info(this.C.openFolder);
    const ctx = await store.load();
    if (!ctx.bootstrap) return this.start();

    await this.run(this.C.readingBootstrap, async (mentor, system) => {
      const { data, usage } = await mentor.generate(system, buildInitMessage(ctx.bootstrap!, this.deps.level(), this.deps.lang()), InitPlan, "init_plan");
      const plan = cleanPlan(data, this.deps.lang());
      const cost = await this.account(mentor, usage);
      this.lastPlan = plan.blockingQuestion ? undefined : plan;
      const actions: ChatAction[] = plan.blockingQuestion
        ? [{ id: "init", label: this.C.bootstrapUpdated }]
        : [
            { id: "save-plan", label: this.C.saveToPebble, primary: true },
            { id: "init", label: this.C.regenerate },
          ];
      this.view.push({ kind: "pebble", label: this.C.labelPlan, file: "bootstrap.md", html: renderMarkdown(initPlanToMarkdown(plan, this.deps.lang())), meta: meta(mentor, cost, this.deps.lang()), actions });
      this.history.push({ role: "pebble", text: initPlanToMarkdown(plan, this.deps.lang()) });
    }, "roadmap");
  }

  /** Adotta un progetto già avviato (ADR-014): legge il codice e propone quello che c'è, da confermare. */
  async adopt(): Promise<void> {
    const store = this.store();
    if (!store || !this.deps.snapshot) return this.info(this.C.openFolder);
    await this.view.reveal();
    await this.run(this.C.readingCode, async (mentor, system) => {
      const snapshot = await this.deps.snapshot!();
      if (!snapshot) return;
      const { data, usage } = await mentor.generate(system, buildAdoptMessage(snapshot, this.deps.level(), this.deps.lang()), AdoptPlan, "adopt_plan");
      const cost = await this.account(mentor, usage);
      this.lastAdoption = { plan: data, snapshot };
      const md = adoptPlanToMarkdown(data, snapshot, this.deps.lang());
      this.view.push({
        kind: "pebble",
        label: this.C.labelAdopt,
        html: renderMarkdown(md),
        meta: meta(mentor, cost, this.deps.lang()),
        actions: [
          { id: "save-adoption", label: this.C.saveAdoption, primary: true },
          { id: "adopt", label: this.C.regenerate },
        ],
      });
      this.history.push({ role: "pebble", text: md });
    }, "roadmap");
  }

  private async saveAdoption(): Promise<void> {
    const store = this.store();
    if (!store || !this.lastAdoption) return;
    if (await store.hasPebble()) {
      const ok = await vscode.window.showWarningMessage(this.C.overwritePebble, { modal: true }, this.C.overwrite);
      if (ok !== this.C.overwrite) return;
    }
    const { plan, snapshot } = this.lastAdoption;
    const files = adoptPlanToFiles(plan, snapshot, new Date().toISOString().slice(0, 10), this.deps.lang());
    await store.writeFiles(files);
    this.lastAdoption = undefined;
    this.view.push({
      kind: "pebble",
      label: this.C.labelSaved,
      html: renderMarkdown(this.C.wroteFiles(files.length, files.map((f) => `- \`${f.path}\``).join("\n"))),
      actions: [{ id: "open-architecture", label: this.C.openArchitecture }],
    });
  }

  private async savePlan(): Promise<void> {
    const store = this.store();
    if (!store || !this.lastPlan) return;
    if (await store.hasPebble()) {
      const ok = await vscode.window.showWarningMessage(
        this.C.overwritePebble,
        { modal: true },
        this.C.overwrite,
      );
      if (ok !== this.C.overwrite) return;
    }
    const files = initPlanToFiles(this.lastPlan, new Date().toISOString().slice(0, 10), this.deps.lang());
    await store.writeFiles(files);
    this.view.push({
      kind: "pebble",
      label: this.C.labelSaved,
      html: renderMarkdown(this.C.wroteFiles(files.length, files.map((f) => `- \`${f.path}\``).join("\n"))),
      actions: [{ id: "open-architecture", label: this.C.openArchitecture }],
    });
  }

  /** "Rivedi il passo" dalla mappa (ADR-013): in chat un'etichetta breve, al modello compiti e diario del passo. */
  async reviewStep(label: string, question: string): Promise<void> {
    await this.view.reveal();
    this.view.push({ kind: "user", text: label });
    await this.text("CHAT", question);
  }

  async text(mode: TextMode, question?: string): Promise<void> {
    const store = this.store();
    if (!store) return this.info(this.C.openFolder);
    const file = this.openFile();
    if (mode === "TESTS" && !file) return this.info(this.C.openFileForTests);
    const ctx = await store.load();
    const thinking = { CHAT: this.C.thinkingChat, NEXT: this.C.thinkingNext, TESTS: this.C.thinkingTests, NEW_FILE: this.C.thinkingNewFile }[mode];

    await this.run(thinking, async (mentor, system) => {
      const msg = buildTextMessage(mode, ctx, this.deps.level(file?.path), {
        file: file && (mode !== "NEXT" ? { path: file.path, content: file.content } : undefined),
        question,
        history: mode === "CHAT" ? this.history : undefined,
        lang: this.deps.lang(),
        ...(file && mode !== "NEXT" && { problems: editorProblems(file.doc.uri) }),
      });
      if (question) this.history.push({ role: "user", text: question });
      await this.answer(mentor, system, msg, ctx, store.rootUri, labels(this.deps.lang())[mode], mode === "NEXT" ? undefined : file?.path);
    }, mode === "NEXT" ? "roadmap" : "mentor");
  }

  /** Indicazioni su un file appena creato (come nel mockup). */
  async newFile(uri: vscode.Uri): Promise<void> {
    if (!this.deps.setting("guideNewFiles", true)) return;
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) return;
    const rel = vscode.workspace.asRelativePath(uri, false);
    if (/(^|\/)(\.|node_modules\/|dist\/|out\/|build\/)/.test(rel) || /\.(md|json|lock|png|jpe?g|svg|gif)$/i.test(rel)) return;
    const store = new WorkspaceStore(folder.uri);
    if (!(await store.hasPebble())) return;
    const ctx = await store.load();
    const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)).slice(0, 20000);
    await this.view.reveal();
    await this.run(this.C.newFileThinking(rel), async (mentor, system) => {
      const msg = buildTextMessage("NEW_FILE", ctx, this.deps.level(rel), { file: { path: rel, content }, lang: this.deps.lang() });
      await this.answer(mentor, system, msg, ctx, folder.uri, this.C.labelNewFile, rel);
    });
  }

  /** Risposta in testo con eventuali proposte di modifica alle decisioni. */
  private async answer(
    mentor: MentorModel,
    system: string,
    msg: string,
    ctx: ProjectContext,
    root: vscode.Uri,
    label: string,
    file?: string,
  ): Promise<void> {
    const { data, usage } = await mentor.generate(system, msg, TextAnswer, "answer");
    const cost = await this.account(mentor, usage);
    // ADR-016: il codice chiesto passa; il filtro resta solo in allenamento. Il diario segna il codice dato da Pebble.
    const filtered = stripLongCode(data.answer, this.deps.lang());
    const training = this.deps.setting("training", false);
    const clean = training ? filtered.text : data.answer;
    if (!training && filtered.removed > 0) this.deps.note?.({ kind: "code", where: file ?? label, level: this.deps.level(file) });
    this.history.push({ role: "pebble", text: clean });

    const actions: ChatAction[] = [];
    let changesMd = "";
    for (const change of data.decisionChanges.slice(0, 3)) {
      const f = decisionFile({ ...change, content: stripLongCode(change.content, this.deps.lang()).text }, ctx.decisions);
      const key = String(++this.pendingSeq);
      this.pending.set(key, { root, ...f, reason: change.reason });
      changesMd += `\n\n> **${f.isNew ? this.C.newDecision : this.C.change} · ${f.id}** — ${change.reason}`;
      actions.push({ id: `adr-view:${key}`, label: `Vedi ${f.id}` }, { id: `adr-apply:${key}`, label: f.isNew ? `Crea ${f.id}` : `Aggiorna ${f.id}`, primary: true });
    }
    // I pulsanti di approfondimento restano solo sull'ultima risposta.
    for (const id of FOLLOW_IDS) this.view.clearActions(id);
    actions.push(...followUpActions(this.deps.lang()));
    this.view.push({ kind: "pebble", label, file, html: renderMarkdown(clean + changesMd), meta: meta(mentor, cost, this.deps.lang()), actions });
  }

  /** Confronto tra l'ADR attuale e quello proposto. */
  private async showChange(key: string): Promise<void> {
    const c = this.pending.get(key);
    if (!c) return;
    const right = this.proposals.put(`${key}/${c.id}-proposto.md`, c.content);
    const current = vscode.Uri.joinPath(c.root, ...c.path.split("/"));
    const left = c.isNew ? this.proposals.put(`${key}/${c.id}-vuoto.md`, "") : current;
    await vscode.commands.executeCommand("vscode.diff", left, right, this.C.diffDecision(c.id));
  }

  private async applyChange(key: string): Promise<void> {
    const c = this.pending.get(key);
    if (!c) return;
    await new WorkspaceStore(c.root).writeFiles([{ path: c.path, content: c.content }]);
    this.pending.delete(key);
    this.view.clearActions(`adr-apply:${key}`);
    this.view.push({
      kind: "pebble",
      label: this.C.labelDecisionSaved,
      html: renderMarkdown(this.C.decisionWritten(c.isNew, c.path)),
    });
    await vscode.window.showTextDocument(vscode.Uri.joinPath(c.root, ...c.path.split("/")), { preview: true, preserveFocus: true });
  }

  async review(): Promise<void> {
    const file = this.openFile();
    if (!file) return this.info(this.C.openFileToReview);
    const folder = vscode.workspace.getWorkspaceFolder(file.doc.uri);
    const store = new WorkspaceStore(folder?.uri ?? vscode.Uri.joinPath(file.doc.uri, ".."));
    await this.view.reveal();
    await this.run(this.C.reviewing(file.path), async (mentor, system) => {
      const result = await reviewFile(
        mentor,
        store,
        system,
        { path: file.path, content: file.content, languageId: file.doc.languageId, problems: editorProblems(file.doc.uri) },
        this.deps.level(file.path),
        this.deps.priceFor(mentor),
        this.deps.lang(),
      );
      await this.deps.record(result);
      this.deps.note?.({ kind: "review", file: file.path, notes: result.review.notes.length });
      this.diagnostics.set(file.doc.uri, toDiagnostics(file.doc, result.review.notes));
      this.history.push({ role: "pebble", text: `Review di ${file.path}: ${result.review.summary}` });
      for (const id of FOLLOW_IDS) this.view.clearActions(id);
      this.history.push({ role: "pebble", text: result.review.notes.map((n) => `[${n.severity}] riga ${n.line}: ${n.problem} Prova: ${n.try}`).join("\n") });
      this.view.push({ kind: "pebble", label: this.C.labelReview, file: file.path, html: reviewHtml(result, this.deps.lang()), meta: meta(mentor, result.costUsd, this.deps.lang()), actions: followUpActions(this.deps.lang()) });
    });
  }

  private async createBootstrap(): Promise<void> {
    const r = this.root();
    if (!r) return this.info(this.C.openFolder);
    const uri = vscode.Uri.joinPath(r, "bootstrap.md");
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(bootstrapGuide(this.deps.lang())));
    }
    await vscode.window.showTextDocument(uri);
    this.view.push({
      kind: "pebble",
      label: "bootstrap.md",
      html: renderMarkdown(this.C.fillBootstrap),
      actions: [{ id: "init", label: this.C.doneProposePlan, primary: true }],
    });
  }

  // ---------- infrastruttura ----------

  private info(text: string): void {
    this.view.push({ kind: "pebble", label: "Pebble", html: renderMarkdown(text) });
  }

  private async account(mentor: MentorModel, usage: Usage): Promise<number | null> {
    const costUsd = estimateCost(usage, this.deps.priceFor(mentor));
    await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd });
    return costUsd;
  }

  private async run(thinking: string, fn: (mentor: MentorModel, system: string) => Promise<void>, ghost: Ghost = "mentor"): Promise<void> {
    if (this.busy) return;
    this.lastRequest = () => this.run(thinking, fn, ghost);
    this.busy = true;
    this.view.thinking(thinking);
    try {
      const mentor = await this.deps.mentor(ghost);
      await fn(mentor, await this.deps.systemPrompt());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const fix: ChatAction[] =
        err instanceof ProviderError && err.kind === "auth"
          ? [{ id: "cmd:pebble.setApiKey", label: this.C.setApiKey }]
          : err instanceof ProviderError && (err.kind === "config" || err.kind === "network")
            ? [{ id: "cmd:pebble.openSettings", label: this.C.openSettings }]
            : [];
      // Un solo "Riprova" alla volta: quello sulla scheda più recente.
      this.view.clearActions("retry");
      const actions: ChatAction[] = [...fix, { id: "retry", label: this.C.retry, primary: true }];
      this.view.push({ kind: "error", text: message, actions });
    } finally {
      this.busy = false;
      this.view.done();
    }
  }
}

function meta(mentor: MentorModel, cost: number | null, lang: Lang = "it"): string {
  return `${mentor.provider} · ${mentor.model} · ${formatUsd(cost, lang)}`;
}

/** Filtro "niente codice" (ADR-003) su tutti i testi del piano; l'albero delle cartelle resta com'è. */
function cleanPlan(p: InitPlan, lang: Lang = "it"): InitPlan {
  const c = (s: string) => stripLongCode(s, lang).text;
  const cn = (s: string | null) => (s === null ? null : c(s));
  return {
    ...p,
    reading: c(p.reading),
    blockingQuestion: cn(p.blockingQuestion),
    decisions: p.decisions.map((d) => ({
      title: c(d.title),
      context: c(d.context),
      decision: c(d.decision),
      alternatives: c(d.alternatives),
      consequences: c(d.consequences),
    })),
    layers: c(p.layers),
    roadmap: p.roadmap.map(c),
    start: c(p.start),
    question: cn(p.question),
  };
}

const inline = (s: string) => escapeHtml(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");

function reviewHtml(r: ReviewResult, lang: Lang): string {
  const C = CHAT_TEXT[lang];
  const notes = r.review.notes
    .map(
      (n) => `<div class="note"><span class="sev ${n.severity}">${C.severity[n.severity]}</span><b>${C.line} ${n.line}${
        n.endLine && n.endLine !== n.line ? `–${n.endLine}` : ""
      }</b> · ${escapeHtml(n.anchor)}<p><b>${inline(n.problem)}</b></p><p>${inline(n.why)}</p><p><i>${C.try}</i> ${inline(n.try)}</p></div>`,
    )
    .join("");
  return `<p>${inline(r.review.summary)}</p>${notes}${r.review.question ? `<blockquote><b>${C.question}</b> ${inline(r.review.question)}</blockquote>` : ""}${
    r.review.adrProposal ? `<blockquote><b>${C.adrToConsider}</b> ${inline(r.review.adrProposal)}</blockquote>` : ""
  }`;
}
