import * as vscode from "vscode";

/**
 * Una sezione della barra laterale di Pebble (accanto a Percorso e Mentor), al posto di una colonna dell'editor:
 * il codice resta in una colonna sola e si passa da una sezione all'altra aprendole e chiudendole.
 * La sezione compare solo quando serve (context key nel `when` della vista) e non ruba il cursore all'editor.
 */
export class SideView implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;
  private readonly ready: ((view: vscode.WebviewView) => void)[] = [];

  constructor(
    readonly id: string,
    private readonly contextKey: string,
    private readonly extensionUri: vscode.Uri,
    /** Prepara il contenuto quando VS Code crea la vista: html e ascolto dei messaggi. */
    private readonly setup: (webview: vscode.Webview) => void,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")] };
    this.setup(view.webview);
    view.onDidDispose(() => (this.view = undefined));
    for (const r of this.ready.splice(0)) r(view);
  }

  get webview(): vscode.Webview | undefined {
    return this.view?.webview;
  }

  set description(text: string | undefined) {
    if (this.view) this.view.description = text;
  }

  /** Mostra la sezione; con `keepEditorFocus` il cursore torna nell'editor, così si continua a scrivere. */
  async reveal(keepEditorFocus = true): Promise<void> {
    await vscode.commands.executeCommand("setContext", this.contextKey, true);
    if (this.view) {
      this.view.show(keepEditorFocus);
      return;
    }
    const resolved = new Promise<vscode.WebviewView>((r) => this.ready.push(r));
    await vscode.commands.executeCommand(`${this.id}.focus`);
    await resolved;
    if (keepEditorFocus) await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  }

  /** La rende visibile nella barra senza aprirla né spostare il cursore. */
  async enable(): Promise<void> {
    await vscode.commands.executeCommand("setContext", this.contextKey, true);
  }

  async hide(): Promise<void> {
    await vscode.commands.executeCommand("setContext", this.contextKey, false);
  }

  dispose(): void {
    this.view = undefined;
  }
}
