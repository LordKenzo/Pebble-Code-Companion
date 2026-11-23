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
  mentor(): Promise<MentorModel>;
  level(): ExperienceLevel;
  systemPrompt(): Promise<string>;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  setting<T>(key: string, fallback: T): T;
  workspaceState: vscode.Memento;
}

const BOOTSTRAP_TEMPLATE = `# Nome del progetto — bootstrap

## Cosa devo fare
Descrivi in poche righe cosa deve fare il progetto e per chi.

## Vincoli
- Linguaggio, piattaforma, librerie obbligatorie o vietate
- Regole del dominio che non si possono sbagliare

## Non so ancora
- Come strutturare le cartelle
- Da dove cominciare
`;

/** Domande di approfondimento proposte sotto ogni risposta. */
const FOLLOW_UPS = {
  "follow:deep": {
    label: "Approfondisci",
    question:
      "Puoi approfondire la tua ultima risposta? Spiega meglio il perché e i punti che hai dato per scontati, e rendi più concreto il cosa fare (un gradino più in alto nella scala di aiuto).",
  },
  "follow:example": {
    label: "Fammi un esempio",
    question:
      "Mi fai un esempio concreto della tua ultima risposta? Sali di un gradino nella scala di aiuto: se riguarda comandi o configurazione dammi il contenuto completo; se riguarda la struttura, file e firme; se riguarda la logica, un esempio su un caso analogo o i passi in pseudocodice.",
  },
} as const;
const followUpActions = (): ChatAction[] => Object.entries(FOLLOW_UPS).map(([id, f]) => ({ id, label: f.label }));

const LABELS: Record<TextMode, string> = {
  CHAT: "Risposta",
  NEXT: "Prossimo passo",
  TESTS: "Test consigliati",
  NEW_FILE: "Nuovo file",
};

/** Orchestrazione della conversazione con il mentor nel pannello laterale. */
export class MentorSession {
  private history: Turn[] = [];
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
      this.view.push({
        kind: "pebble",
        label: "Benvenuto",
        html: renderMarkdown(
          "Ciao, sono Pebble. Per guidarti bene mi serve un **`bootstrap.md`** nella radice del progetto: cosa vuoi costruire, i vincoli e cosa non sai ancora. Lo leggo e ti propongo come impostare il progetto.",
        ),
        actions: [{ id: "create-bootstrap", label: "Crea bootstrap.md", primary: true }],
      });
      return;
    }

    if (!hasPebble) {
      const doneKey = `pebble.autoInit:${root.toString()}`;
      if (this.deps.setting("autoStart", true) && !this.deps.workspaceState.get(doneKey)) {
        await this.deps.workspaceState.update(doneKey, true);
        this.view.push({ kind: "pebble", label: "Benvenuto", html: renderMarkdown("Ho trovato **`bootstrap.md`**. Lo leggo e ti propongo come impostare il progetto.") });
        await this.init();
      } else {
        this.view.push({
          kind: "pebble",
          label: "Benvenuto",
          html: renderMarkdown("Ho trovato **`bootstrap.md`**, ma il progetto non ha ancora decisioni in `.pebble/`."),
          actions: [{ id: "init", label: "Leggi il bootstrap e proponi il piano", primary: true }],
        });
      }
      return;
    }

    const n = ctx.decisions.length;
    this.view.push({
      kind: "pebble",
      label: "Bentornato",
      html: renderMarkdown(
        `Progetto con ${n} ${n === 1 ? "decisione" : "decisioni"} in \`.pebble/\`. Quando crei un file ti dico che ruolo ha; quando vuoi, rivedo quello che hai scritto.`,
      ),
      actions: [
        { id: "next", label: "Qual è il prossimo passo?", primary: true },
        { id: "review", label: "Rivedi il file aperto" },
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
    if (id in FOLLOW_UPS) {
      const f = FOLLOW_UPS[id as keyof typeof FOLLOW_UPS];
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
    if (["init", "save-plan", "create-bootstrap"].includes(id)) this.view.clearActions(id);
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
    if (!store) return this.info("Apri una cartella di progetto per iniziare.");
    const ctx = await store.load();
    if (!ctx.bootstrap) return this.start();

    await this.run("Leggo bootstrap.md e preparo il piano…", async (mentor, system) => {
      const { data, usage } = await mentor.generate(system, buildInitMessage(ctx.bootstrap!, this.deps.level()), InitPlan, "init_plan");
      const plan = cleanPlan(data);
      const cost = await this.account(mentor, usage);
      this.lastPlan = plan.blockingQuestion ? undefined : plan;
      const actions: ChatAction[] = plan.blockingQuestion
        ? [{ id: "init", label: "Ho aggiornato il bootstrap: riprova" }]
        : [
            { id: "save-plan", label: "Salva in .pebble/", primary: true },
            { id: "init", label: "Rigenera" },
          ];
      this.view.push({ kind: "pebble", label: "Piano iniziale", file: "bootstrap.md", html: renderMarkdown(initPlanToMarkdown(plan)), meta: meta(mentor, cost), actions });
      this.history.push({ role: "pebble", text: initPlanToMarkdown(plan) });
    });
  }

  private async savePlan(): Promise<void> {
    const store = this.store();
    if (!store || !this.lastPlan) return;
    if (await store.hasPebble()) {
      const ok = await vscode.window.showWarningMessage(
        "La cartella .pebble/ esiste già. Sovrascrivere architettura, roadmap e decisioni con lo stesso nome?",
        { modal: true },
        "Sovrascrivi",
      );
      if (ok !== "Sovrascrivi") return;
    }
    const files = initPlanToFiles(this.lastPlan, new Date().toISOString().slice(0, 10));
    await store.writeFiles(files);
    this.view.push({
      kind: "pebble",
      label: "Salvato",
      html: renderMarkdown(
        `Ho scritto ${files.length} file in \`.pebble/\`:\n\n${files.map((f) => `- \`${f.path}\``).join("\n")}\n\nSono tuoi: modificali quando cambi idea, li userò per ogni review.`,
      ),
      actions: [{ id: "open-architecture", label: "Apri l'architettura" }],
    });
  }

  async text(mode: TextMode, question?: string): Promise<void> {
    const store = this.store();
    if (!store) return this.info("Apri una cartella di progetto per iniziare.");
    const file = this.openFile();
    if (mode === "TESTS" && !file) return this.info("Apri il file per cui vuoi i test consigliati.");
    const ctx = await store.load();
    const thinking = { CHAT: "Ci penso…", NEXT: "Guardo la roadmap…", TESTS: "Penso ai casi da coprire…", NEW_FILE: "Guardo dove sta il nuovo file…" }[mode];

    await this.run(thinking, async (mentor, system) => {
      const msg = buildTextMessage(mode, ctx, this.deps.level(), {
        file: file && (mode !== "NEXT" ? { path: file.path, content: file.content } : undefined),
        question,
        history: mode === "CHAT" ? this.history : undefined,
      });
      if (question) this.history.push({ role: "user", text: question });
      await this.answer(mentor, system, msg, ctx, store.rootUri, LABELS[mode], mode === "NEXT" ? undefined : file?.path);
    });
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
    await this.run(`Nuovo file ${rel}: guardo che ruolo ha…`, async (mentor, system) => {
      const msg = buildTextMessage("NEW_FILE", ctx, this.deps.level(), { file: { path: rel, content } });
      await this.answer(mentor, system, msg, ctx, folder.uri, "Nuovo file", rel);
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
    const clean = stripLongCode(data.answer).text;
    this.history.push({ role: "pebble", text: clean });

    const actions: ChatAction[] = [];
    let changesMd = "";
    for (const change of data.decisionChanges.slice(0, 3)) {
      const f = decisionFile({ ...change, content: stripLongCode(change.content).text }, ctx.decisions);
      const key = String(++this.pendingSeq);
      this.pending.set(key, { root, ...f, reason: change.reason });
      changesMd += `\n\n> **${f.isNew ? "Nuova decisione" : "Modifica"} · ${f.id}** — ${change.reason}`;
      actions.push({ id: `adr-view:${key}`, label: `Vedi ${f.id}` }, { id: `adr-apply:${key}`, label: f.isNew ? `Crea ${f.id}` : `Aggiorna ${f.id}`, primary: true });
    }
    // I pulsanti di approfondimento restano solo sull'ultima risposta.
    for (const id of Object.keys(FOLLOW_UPS)) this.view.clearActions(id);
    actions.push(...followUpActions());
    this.view.push({ kind: "pebble", label, file, html: renderMarkdown(clean + changesMd), meta: meta(mentor, cost), actions });
  }

  /** Confronto tra l'ADR attuale e quello proposto. */
  private async showChange(key: string): Promise<void> {
    const c = this.pending.get(key);
    if (!c) return;
    const right = this.proposals.put(`${key}/${c.id}-proposto.md`, c.content);
    const current = vscode.Uri.joinPath(c.root, ...c.path.split("/"));
    const left = c.isNew ? this.proposals.put(`${key}/${c.id}-vuoto.md`, "") : current;
    await vscode.commands.executeCommand("vscode.diff", left, right, `${c.id}: attuale ↔ proposta di Pebble`);
  }

  private async applyChange(key: string): Promise<void> {
    const c = this.pending.get(key);
    if (!c) return;
    await new WorkspaceStore(c.root).writeFiles([{ path: c.path, content: c.content }]);
    this.pending.delete(key);
    this.view.clearActions(`adr-apply:${key}`);
    this.view.push({
      kind: "pebble",
      label: "Decisione salvata",
      html: renderMarkdown(`${c.isNew ? "Ho creato" : "Ho aggiornato"} \`${c.path}\`. Dalla prossima richiesta ne tengo conto.`),
    });
    await vscode.window.showTextDocument(vscode.Uri.joinPath(c.root, ...c.path.split("/")), { preview: true, preserveFocus: true });
  }

  async review(): Promise<void> {
    const file = this.openFile();
    if (!file) return this.info("Apri il file da rivedere.");
    const folder = vscode.workspace.getWorkspaceFolder(file.doc.uri);
    const store = new WorkspaceStore(folder?.uri ?? vscode.Uri.joinPath(file.doc.uri, ".."));
    await this.view.reveal();
    await this.run(`Rivedo ${file.path}…`, async (mentor, system) => {
      const result = await reviewFile(
        mentor,
        store,
        system,
        { path: file.path, content: file.content, languageId: file.doc.languageId, problems: editorProblems(file.doc.uri) },
        this.deps.level(),
        this.deps.priceFor(mentor),
      );
      await this.deps.record(result);
      this.diagnostics.set(file.doc.uri, toDiagnostics(file.doc, result.review.notes));
      this.history.push({ role: "pebble", text: `Review di ${file.path}: ${result.review.summary}` });
      for (const id of Object.keys(FOLLOW_UPS)) this.view.clearActions(id);
      this.history.push({ role: "pebble", text: result.review.notes.map((n) => `[${n.severity}] riga ${n.line}: ${n.problem} Prova: ${n.try}`).join("\n") });
      this.view.push({ kind: "pebble", label: "Review", file: file.path, html: reviewHtml(result), meta: meta(mentor, result.costUsd), actions: followUpActions() });
    });
  }

  private async createBootstrap(): Promise<void> {
    const r = this.root();
    if (!r) return this.info("Apri una cartella di progetto per iniziare.");
    const uri = vscode.Uri.joinPath(r, "bootstrap.md");
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(BOOTSTRAP_TEMPLATE));
    }
    await vscode.window.showTextDocument(uri);
    this.view.push({
      kind: "pebble",
      label: "bootstrap.md",
      html: renderMarkdown("Compila il bootstrap con parole tue: non serve che sia perfetto. Quando hai finito, salvalo e premi il pulsante."),
      actions: [{ id: "init", label: "Ho finito: proponi il piano", primary: true }],
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

  private async run(thinking: string, fn: (mentor: MentorModel, system: string) => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.lastRequest = () => this.run(thinking, fn);
    this.busy = true;
    this.view.thinking(thinking);
    try {
      const mentor = await this.deps.mentor();
      await fn(mentor, await this.deps.systemPrompt());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const fix: ChatAction[] =
        err instanceof ProviderError && err.kind === "auth"
          ? [{ id: "cmd:pebble.setApiKey", label: "Imposta la chiave API" }]
          : err instanceof ProviderError && (err.kind === "config" || err.kind === "network")
            ? [{ id: "cmd:pebble.openSettings", label: "Apri le impostazioni" }]
            : [];
      // Un solo "Riprova" alla volta: quello sulla scheda più recente.
      this.view.clearActions("retry");
      const actions: ChatAction[] = [...fix, { id: "retry", label: "Riprova", primary: true }];
      this.view.push({ kind: "error", text: message, actions });
    } finally {
      this.busy = false;
      this.view.done();
    }
  }
}

function meta(mentor: MentorModel, cost: number | null): string {
  return `${mentor.provider} · ${mentor.model} · ${formatUsd(cost)}`;
}

/** Filtro "niente codice" (ADR-003) su tutti i testi del piano; l'albero delle cartelle resta com'è. */
function cleanPlan(p: InitPlan): InitPlan {
  const c = (s: string) => stripLongCode(s).text;
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

function reviewHtml(r: ReviewResult): string {
  const notes = r.review.notes
    .map(
      (n) => `<div class="note"><span class="sev ${n.severity}">${n.severity}</span><b>riga ${n.line}${
        n.endLine && n.endLine !== n.line ? `–${n.endLine}` : ""
      }</b> · ${escapeHtml(n.anchor)}<p><b>${inline(n.problem)}</b></p><p>${inline(n.why)}</p><p><i>Prova:</i> ${inline(n.try)}</p></div>`,
    )
    .join("");
  return `<p>${inline(r.review.summary)}</p>${notes}${r.review.question ? `<blockquote><b>Domanda:</b> ${inline(r.review.question)}</blockquote>` : ""}${
    r.review.adrProposal ? `<blockquote><b>ADR da valutare:</b> ${inline(r.review.adrProposal)}</blockquote>` : ""
  }`;
}
