import * as vscode from "vscode";
import type { Problem } from "../../core/model";

/** Errori e avvisi che l'editor mostra su un file, escluse le note di Pebble stesso. */
export function editorProblems(uri: vscode.Uri): Problem[] {
  return vscode.languages
    .getDiagnostics(uri)
    .filter((d) => d.source !== "Pebble" && d.severity <= vscode.DiagnosticSeverity.Warning)
    .sort((a, b) => a.severity - b.severity || a.range.start.line - b.range.start.line)
    .slice(0, 20)
    .map((d) => ({
      line: d.range.start.line + 1,
      message: d.message.split("\n")[0]!,
      severity: d.severity === vscode.DiagnosticSeverity.Error ? ("errore" as const) : ("avviso" as const),
      ...(d.source && { source: d.source }),
    }));
}
