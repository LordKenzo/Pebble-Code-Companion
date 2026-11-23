import * as vscode from "vscode";
import { describeCondition, parsePath, summarizeConditions, withCheckbox, type Task } from "../../core/path";

const PATH_FILE = [".pebble", "percorso.md"] as const;

type Node =
  | { kind: "step"; name: string; tasks: Task[] }
  | { kind: "task"; task: Task }
  | { kind: "detail"; task: Task; label: string; value: string; icon: string };

/** Percorso di esempio, scritto quando il progetto non ne ha ancora uno. */
export const EXAMPLE_PATH = `# Percorso

Una sezione per passo della roadmap, un compito per riga (ADR-007).
Sotto ogni compito: fare, firma, fatto quando. Le righe che Pebble non riconosce restano dove sono.

## Passo 1 · Setup
- [ ] Installa TypeScript e i tipi di Node
  fare: npm install -D typescript @types/node
  fatto quando: a mano
- [ ] Un primo test che passa
  fare: un test banale in test/, per verificare che il runner parta
  fatto quando: test "il runner funziona"
`;

/**
 * Vista "Percorso" (ADR-001, ADR-007): passi e compiti di .pebble/percorso.md, con le caselle.
 * Spuntare una casella aggiorna solo quella riga del file.
 */
export class PathView implements vscode.TreeDataProvider<Node>, vscode.Disposable {
  static readonly id = "pebble.path";

  private readonly changed = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.changed.event;
  private readonly view: vscode.TreeView<Node>;
  private readonly disposables: vscode.Disposable[] = [];
  private tasks: Task[] = [];
  private steps: Node[] = [];

  constructor(private readonly root: vscode.Uri | undefined) {
    this.view = vscode.window.createTreeView(PathView.id, { treeDataProvider: this, showCollapseAll: true, manageCheckboxStateManually: true });
    this.disposables.push(
      this.view,
      this.changed,
      this.view.onDidChangeCheckboxState((e) => void this.onCheckbox(e)),
    );
    if (root) {
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, PATH_FILE.join("/")));
      this.disposables.push(watcher, watcher.onDidChange(() => void this.refresh()), watcher.onDidCreate(() => void this.refresh()), watcher.onDidDelete(() => void this.refresh()));
      // Le modifiche non ancora salvate nell'editor contano: la vista segue quello che vedi.
      this.disposables.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === this.uri?.toString()) this.load(e.document.getText());
        }),
      );
    }
    void this.refresh();
  }

  get uri(): vscode.Uri | undefined {
    return this.root && vscode.Uri.joinPath(this.root, ...PATH_FILE);
  }

  async refresh(): Promise<void> {
    const uri = this.uri;
    if (!uri) return this.load(null);
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (open) return this.load(open.getText());
    try {
      this.load(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)));
    } catch {
      this.load(null);
    }
  }

  private load(text: string | null): void {
    this.tasks = text === null ? [] : parsePath(text).tasks;
    const byStep = new Map<string, Task[]>();
    for (const t of this.tasks) {
      const name = t.step ?? "Senza passo";
      byStep.set(name, [...(byStep.get(name) ?? []), t]);
    }
    this.steps = [...byStep].map(([name, tasks]) => ({ kind: "step", name, tasks }));
    const done = this.tasks.filter((t) => t.checked).length;
    this.view.description = this.tasks.length ? `${done} di ${this.tasks.length}` : undefined;
    this.view.badge = this.tasks.length && done < this.tasks.length
      ? { value: this.tasks.length - done, tooltip: `${this.tasks.length - done} compiti da fare` }
      : undefined;
    void vscode.commands.executeCommand("setContext", "pebble.hasPath", text !== null);
    this.changed.fire(undefined);
  }

  getChildren(node?: Node): Node[] {
    if (!node) return this.steps;
    if (node.kind === "step") return node.tasks.map((task) => ({ kind: "task", task }));
    if (node.kind === "task") return details(node.task);
    return [];
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === "step") {
      const done = node.tasks.filter((t) => t.checked).length;
      const firstOpen = this.steps.find((s) => s.kind === "step" && s.tasks.some((t) => !t.checked));
      const item = new vscode.TreeItem(node.name, firstOpen === node ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
      item.description = `${done}/${node.tasks.length}`;
      item.iconPath = new vscode.ThemeIcon(done === node.tasks.length ? "pass-filled" : "milestone");
      item.contextValue = "pebble.step";
      return item;
    }
    if (node.kind === "task") {
      const { task } = node;
      const hasDetails = details(task).length > 0;
      const item = new vscode.TreeItem(task.title, hasDetails ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
      item.checkboxState = task.checked ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
      item.description = summarizeConditions(task.conditions);
      item.tooltip = tooltip(task);
      item.contextValue = "pebble.task";
      item.command = { command: "pebble.path.reveal", title: "Apri nel percorso", arguments: [task.line] };
      return item;
    }
    const item = new vscode.TreeItem(node.value, vscode.TreeItemCollapsibleState.None);
    item.description = node.label;
    item.iconPath = new vscode.ThemeIcon(node.icon);
    item.tooltip = `${node.label}: ${node.value}`;
    return item;
  }

  /** Apre percorso.md sulla riga del compito. */
  async reveal(line: number): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const editor = await vscode.window.showTextDocument(uri, { preview: true });
    const pos = new vscode.Position(line, 0);
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
    await vscode.window.showTextDocument(uri);
    await this.refresh();
  }

  /** Spuntare a mano: cambia solo la riga del compito, poi salva se il file non aveva modifiche in sospeso. */
  private async onCheckbox(e: vscode.TreeCheckboxChangeEvent<Node>): Promise<void> {
    const uri = this.uri;
    if (!uri) return;
    const doc = await vscode.workspace.openTextDocument(uri);
    const wasDirty = doc.isDirty;
    const edit = new vscode.WorkspaceEdit();
    let stale = false;
    for (const [node, state] of e.items) {
      if (node.kind !== "task") continue;
      const line = node.task.line;
      const updated = line < doc.lineCount ? withCheckbox(doc.lineAt(line).text, state === vscode.TreeItemCheckboxState.Checked) : null;
      if (updated === null) {
        stale = true;
        continue;
      }
      edit.replace(uri, doc.lineAt(line).range, updated);
    }
    if (edit.size) {
      await vscode.workspace.applyEdit(edit);
      if (!wasDirty) await doc.save();
    }
    if (stale) void vscode.window.showWarningMessage("Pebble: il percorso è cambiato mentre lo spuntavi. Ho ricaricato la vista, riprova.");
    await this.refresh();
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}

function details(task: Task): Node[] {
  const out: Node[] = [];
  if (task.todo) out.push({ kind: "detail", task, label: "fare", value: task.todo, icon: "tasklist" });
  if (task.signature) out.push({ kind: "detail", task, label: "firma", value: task.signature, icon: "symbol-method" });
  for (const c of task.conditions) {
    out.push({ kind: "detail", task, label: "fatto quando", value: describeCondition(c), icon: c.kind === "invalid" ? "warning" : "pass" });
  }
  return out;
}

function tooltip(task: Task): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true);
  md.appendMarkdown(`**${task.title}**\n\n`);
  if (task.todo) md.appendMarkdown(`${task.todo}\n\n`);
  if (task.signature) md.appendCodeblock(task.signature, "ts");
  const when = task.conditions.length ? task.conditions.map(describeCondition).join("; ") : "a mano";
  md.appendMarkdown(`\n_Si spunta quando:_ ${when}`);
  return md;
}
