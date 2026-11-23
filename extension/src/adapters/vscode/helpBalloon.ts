import * as vscode from "vscode";
import { estimateCost, formatUsd, type Price } from "../../core/cost";
import { buildHelpMessage, historyLine, parseHelpAnswer, RUNG_NAMES, type HelpAsk, type HelpTask, type Rung } from "../../core/help";
import type { ExperienceLevel, Usage } from "../../core/model";
import { stripLongCode } from "../../core/policy";
import type { MentorModel } from "../../core/ports";
import type { TestResult } from "../../core/path";
import { WorkspaceStore } from "../store/workspaceStore";

export interface HelpDeps {
  mentor(): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  level(): ExperienceLevel;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  /** Compito attivo e ultimi risultati dei test, dal percorso. */
  helpContext(filePath: string): { task?: HelpTask; tests?: (TestResult & { detail?: string })[] };
}

interface ThreadState {
  rung: Rung;
  history: string[];
  concepts: string[];
  busy: boolean;
}

class Note implements vscode.Comment {
  mode = vscode.CommentMode.Preview;
  constructor(
    public body: vscode.MarkdownString | string,
    public author: vscode.CommentAuthorInformation,
    public label?: string,
  ) {}
}

/** Argomento dei comandi: dal menu sotto il riquadro arriva una CommentReply, dal titolo il thread. */
type ThreadArg = vscode.CommentReply | vscode.CommentThread;
const threadOf = (arg: ThreadArg): vscode.CommentThread => ("thread" in arg ? arg.thread : arg);

/**
 * Il fumetto sulla riga (ADR-009): con ⌥P si apre un riquadro di commento sotto il cursore,
 * che parte da una domanda e sale la scala di aiuto solo quando lo chiedi (ADR-006).
 */
export class HelpBalloon implements vscode.Disposable {
  private readonly controller = vscode.comments.createCommentController("pebble.help", "Pebble");
  private readonly states = new Map<vscode.CommentThread, ThreadState>();
  private readonly pebble: vscode.CommentAuthorInformation;
  private readonly you: vscode.CommentAuthorInformation = { name: "Tu" };

  constructor(
    extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly deps: HelpDeps,
  ) {
    this.pebble = { name: "Pebble", iconPath: vscode.Uri.joinPath(extensionUri, "media", "icon.png") };
    this.controller.options = { prompt: "Rispondi a Pebble…", placeHolder: "Scrivi la tua risposta alla domanda, poi premi Rispondi" };
  }

  /** ⌥P: apre il fumetto sulla riga del cursore, o riapre quello che c'è già. */
  async helpHere(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      void vscode.window.showInformationMessage("Pebble: metti il cursore su una riga del tuo codice, poi premi ⌥P.");
      return;
    }
    const line = editor.selection.active.line;
    const existing = [...this.states.keys()].find((t) => t.uri.toString() === editor.document.uri.toString() && t.range?.start.line === line);
    if (existing) {
      existing.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
      return;
    }
    const thread = this.controller.createCommentThread(editor.document.uri, new vscode.Range(line, 0, line, 0), []);
    thread.contextValue = "pebble.help";
    thread.canReply = true;
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    this.states.set(thread, { rung: 1, history: [], concepts: [], busy: false });
    await this.ask(thread, { kind: "rung", rung: 1 });
  }

  async up(arg: ThreadArg): Promise<void> {
    const thread = threadOf(arg);
    const st = this.states.get(thread);
    if (!st || st.busy) return;
    if (st.rung === 4) {
      void vscode.window.showInformationMessage("Pebble: sei già alla riga esatta. Se serve, chiedimi perché conta o un approfondimento.");
      return;
    }
    st.rung = (st.rung + 1) as Rung;
    await this.ask(thread, { kind: "rung", rung: st.rung });
  }

  async why(arg: ThreadArg): Promise<void> {
    const thread = threadOf(arg);
    const st = this.states.get(thread);
    if (st) await this.ask(thread, { kind: "why", rung: st.rung });
  }

  async deep(arg: ThreadArg): Promise<void> {
    const thread = threadOf(arg);
    const st = this.states.get(thread);
    if (st) await this.ask(thread, { kind: "deep", rung: st.rung });
  }

  /** Lo sviluppatore risponde alla domanda: è il cuore didattico, ragionare prima di ricevere. */
  async reply(arg: vscode.CommentReply): Promise<void> {
    const st = this.states.get(arg.thread);
    const text = arg.text.trim();
    if (!st || st.busy || !text) return;
    arg.thread.comments = [...arg.thread.comments, new Note(text, this.you)];
    st.history.push(`Sviluppatore: ${text}`);
    await this.ask(arg.thread, { kind: "reply", rung: st.rung, text });
  }

  close(arg: ThreadArg): void {
    const thread = threadOf(arg);
    this.states.delete(thread);
    thread.dispose();
  }

  private async ask(thread: vscode.CommentThread, ask: HelpAsk): Promise<void> {
    const st = this.states.get(thread);
    if (!st || st.busy) return;
    st.busy = true;
    const thinking = new Note(new vscode.MarkdownString("_Ci penso…_"), this.pebble);
    thread.comments = [...thread.comments, thinking];
    thread.label = `Pebble · gradino ${st.rung} di 4 · ${RUNG_NAMES[st.rung]}`;
    try {
      const doc = await vscode.workspace.openTextDocument(thread.uri);
      const path = vscode.workspace.asRelativePath(thread.uri, false);
      const ctx = this.root ? await new WorkspaceStore(this.root).load() : { bootstrap: null, architecture: null, decisions: [] };
      const { task, tests } = this.deps.helpContext(path);
      const message = buildHelpMessage({
        ctx,
        level: this.deps.level(),
        file: { path, content: doc.getText() },
        line: (thread.range?.start.line ?? 0) + 1,
        ask,
        history: st.history,
        ...(task && { task }),
        ...(tests && { tests }),
      });
      const mentor = await this.deps.mentor();
      const { text, usage } = await mentor.chat(await this.deps.systemPrompt(), message);
      const costUsd = estimateCost(usage, this.deps.priceFor(mentor));
      await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd });

      const { body, concept } = parseHelpAnswer(stripLongCode(text).text);
      if (concept && !st.concepts.includes(concept)) st.concepts.push(concept);
      st.history.push(historyLine(body));
      const md = new vscode.MarkdownString(body);
      if (concept) md.appendMarkdown(`\n\n*Concetto:* ${concept}`);
      md.appendMarkdown(`\n\n---\n_${mentor.provider} · ${mentor.model} · ${formatUsd(costUsd)}_`);
      thread.comments = thread.comments.map((c) => (c === thinking ? new Note(md, this.pebble) : c));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const md = new vscode.MarkdownString(`Non sono riuscito a rispondere: ${msg}\n\nControlla provider e chiave in **Pebble: Impostazioni**, poi riprova.`);
      thread.comments = thread.comments.map((c) => (c === thinking ? new Note(md, this.pebble) : c));
    } finally {
      st.busy = false;
    }
  }

  dispose(): void {
    this.controller.dispose();
  }
}
