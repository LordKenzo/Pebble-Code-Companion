import * as vscode from "vscode";

/** Documenti virtuali, in sola lettura, con il testo proposto da Pebble: servono per la vista di confronto. */
export class ProposalDocs implements vscode.TextDocumentContentProvider {
  static readonly scheme = "pebble-proposal";
  private docs = new Map<string, string>();
  private emitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.emitter.event;

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.docs.get(uri.path) ?? "";
  }

  /** Registra un testo e restituisce l'indirizzo del documento virtuale. */
  put(key: string, content: string): vscode.Uri {
    const uri = vscode.Uri.from({ scheme: ProposalDocs.scheme, path: `/${key}` });
    this.docs.set(uri.path, content);
    this.emitter.fire(uri);
    return uri;
  }
}
