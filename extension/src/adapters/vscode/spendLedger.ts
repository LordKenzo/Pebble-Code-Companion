import * as vscode from "vscode";
import type { ReviewResult } from "../../core/model";

export type SpendEntry = Pick<ReviewResult, "provider" | "model" | "usage" | "costUsd">;

export interface SpendRow {
  reviews: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  /** Review di cui non si conosce il prezzo (token contati, costo no). */
  unpriced: number;
}

/** mese "2026-11" → "provider · modello" → totali */
export type SpendData = Record<string, Record<string, SpendRow>>;

const KEY = "pebble.spend.v1";
/** mese → modalità (MODE: …) → totali, per vedere quanto costa ogni fantasmino (ADR-016). */
const MODES_KEY = "pebble.spend.modes.v1";
const empty = (): SpendRow => ({
  reviews: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0, unpriced: 0,
});

function add(row: SpendRow, r: SpendEntry): void {
  row.reviews++;
  row.inputTokens += r.usage.inputTokens;
  row.outputTokens += r.usage.outputTokens;
  row.cacheReadTokens += r.usage.cacheReadTokens;
  row.cacheWriteTokens += r.usage.cacheWriteTokens;
  if (r.costUsd === null) row.unpriced++;
  else row.costUsd += r.costUsd;
}

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Registro locale della spesa, sul computer dell'utente (globalState di VS Code), valido per tutti i progetti. */
export class SpendLedger {
  constructor(private state: vscode.Memento) {}

  data(): SpendData {
    return this.state.get<SpendData>(KEY, {});
  }

  /** La spesa per modalità; le richieste senza modalità finiscono in "?". */
  modes(): SpendData {
    return this.state.get<SpendData>(MODES_KEY, {});
  }

  async record(r: SpendEntry): Promise<void> {
    const data = this.data();
    add(((data[monthKey()] ??= {})[`${r.provider} · ${r.model}`] ??= empty()), r);
    await this.state.update(KEY, data);
    const modes = this.modes();
    add(((modes[monthKey()] ??= {})[r.usage.mode ?? "?"] ??= empty()), r);
    await this.state.update(MODES_KEY, modes);
  }

  monthTotal(month = monthKey()): { costUsd: number; reviews: number; unpriced: number } {
    const rows = Object.values(this.data()[month] ?? {});
    return {
      costUsd: rows.reduce((s, r) => s + r.costUsd, 0),
      reviews: rows.reduce((s, r) => s + r.reviews, 0),
      unpriced: rows.reduce((s, r) => s + r.unpriced, 0),
    };
  }

  async reset(): Promise<void> {
    await this.state.update(KEY, {});
    await this.state.update(MODES_KEY, {});
  }
}
