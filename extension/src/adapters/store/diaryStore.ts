import * as vscode from "vscode";
import { appendToDiary, type DiaryEvent, type DiaryStep } from "../../core/diary";
import { parseSection } from "../../core/sections";
import type { Lang } from "../../core/i18n";

export const DIARY_FILE = [".pebble", "diario.md"];

/** Il passo da un'intestazione del percorso ("Passo 3 · Scrivi le operazioni"). */
export function stepFromHeading(heading: string | null | undefined): DiaryStep | null {
  const sec = parseSection(heading);
  return sec && { n: sec.n, title: sec.title, kind: sec.kind };
}

/**
 * Scrive `.pebble/diario.md` (ADR-013): una riga per evento, una scrittura alla volta.
 * Non usa il modello e non chiede niente: se qualcosa va storto, l'evento si perde senza disturbare.
 */
export class DiaryWriter {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly root: vscode.Uri | undefined,
    private readonly lang: () => Lang,
    /** Intestazione del passo corrente nel percorso, per gli eventi che non ne indicano uno. */
    private readonly currentStep: () => string | null,
    private readonly now: () => Date = () => new Date(),
  ) {}

  append(event: DiaryEvent, step?: DiaryStep | string | null): void {
    const root = this.root;
    if (!root) return;
    const resolved = typeof step === "object" && step ? step : stepFromHeading(typeof step === "string" ? step : this.currentStep());
    if (!resolved) return;
    const at = this.now();
    const uri = vscode.Uri.joinPath(root, ...DIARY_FILE);
    this.queue = this.queue
      .then(async () => {
        let current: string | null = null;
        try {
          current = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
        } catch {
          current = null;
        }
        const next = appendToDiary(current, resolved, at, event, this.lang());
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(next));
      })
      .catch(() => undefined);
  }
}
