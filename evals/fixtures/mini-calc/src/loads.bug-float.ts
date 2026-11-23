import { platesFor } from "./plates.ts";
import { invalid, ok, type Result } from "./result.ts";

export interface LoadRow {
  percent: number;
  targetKg: number;
  actualKg: number;
  perSide: readonly number[];
}

/** Massimale in kg e percentuali → target, carico reale arrotondato per difetto, dischi per lato. */
export function computeLoads(oneRmKg: number, percents: readonly number[]): Result<LoadRow[]> {
  if (oneRmKg <= 0) return invalid("massimale non valido");
  const rows: LoadRow[] = [];
  for (const percent of percents) {
    const targetKg = oneRmKg * (percent / 100);
    const actualKg = 20 + Math.floor((targetKg - 20) / 2.5) * 2.5;
    const plates = platesFor(actualKg * 1000);
    if (!plates.ok) return invalid(plates.error);
    rows.push({ percent, targetKg, actualKg, perSide: plates.value.perSide });
  }
  return ok(rows);
}
