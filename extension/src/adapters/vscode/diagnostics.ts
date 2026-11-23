import * as vscode from "vscode";
import type { Note, Severity } from "../../core/model";

const SEVERITY: Record<Severity, vscode.DiagnosticSeverity> = {
  errore: vscode.DiagnosticSeverity.Error,
  avviso: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
};

/** Converte le note in sottolineature nell'editor e nel pannello Problemi. */
export function toDiagnostics(doc: vscode.TextDocument, notes: Note[]): vscode.Diagnostic[] {
  return notes.map((n) => {
    const start = clamp(n.line, doc.lineCount) - 1;
    const end = clamp(n.endLine ?? n.line, doc.lineCount) - 1;
    const first = doc.lineAt(start);
    const last = doc.lineAt(Math.max(start, end));
    const range = new vscode.Range(
      start,
      first.firstNonWhitespaceCharacterIndex,
      last.lineNumber,
      Math.max(last.range.end.character, 1),
    );
    const d = new vscode.Diagnostic(range, `${n.problem}\nProva: ${n.try}`, SEVERITY[n.severity]);
    d.source = "Pebble";
    d.code = n.anchor;
    return d;
  });
}

function clamp(line: number, count: number): number {
  return Math.min(Math.max(1, Math.round(line)), Math.max(1, count));
}
