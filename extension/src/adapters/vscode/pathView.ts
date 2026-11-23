import * as vscode from "vscode";
import { buildViewModel, parsePath, withCheckbox, type PathViewModel } from "../../core/path";

const PATH_FILE = [".pebble", "percorso.md"] as const;

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

type FromWebview =
  | { type: "ready" }
  | { type: "toggle"; line: number; checked: boolean }
  | { type: "reveal"; line: number }
  | { type: "createExample" };

/**
 * Vista "Percorso" (ADR-001, ADR-007): passi e compiti di .pebble/percorso.md,
 * con la grafica di mockup/on-demand.html. Spuntare una casella cambia solo quella riga del file.
 */
export class PathView implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly id = "pebble.path";

  private view: vscode.WebviewView | undefined;
  private model: (PathViewModel & { hasFile: boolean }) | null = null;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
  ) {
    if (root) {
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, PATH_FILE.join("/")));
      this.disposables.push(
        watcher,
        watcher.onDidChange(() => void this.refresh()),
        watcher.onDidCreate(() => void this.refresh()),
        watcher.onDidDelete(() => void this.refresh()),
        // Le modifiche non ancora salvate contano: la vista segue quello che vedi nell'editor.
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
    });
    view.onDidChangeVisibility(() => view.visible && this.post());
    view.onDidDispose(() => (this.view = undefined));
    this.decorate();
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
    const tasks = text === null ? [] : parsePath(text).tasks;
    this.model = { ...buildViewModel(tasks), hasFile: text !== null };
    void vscode.commands.executeCommand("setContext", "pebble.hasPath", text !== null);
    this.decorate();
    this.post();
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
  }

  /** Spuntare a mano: cambia solo la riga del compito, poi salva se il file non aveva modifiche in sospeso. */
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
    for (const d of this.disposables) d.dispose();
  }
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
