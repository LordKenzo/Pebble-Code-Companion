import type { Grams } from "./units.ts";
import { ok, type Result } from "./result.ts";

export const BAR: Grams = 20_000;
export const PLATES: readonly Grams[] = [25_000, 20_000, 15_000, 10_000, 5_000, 2_500, 1_250];

export interface PlateLoad {
  readonly total: Grams;
  readonly perSide: readonly Grams[];
}

/** Dischi per lato per un carico già componibile. */
export function platesFor(total: Grams): Result<PlateLoad> {
  if (total < BAR) {
    return ok({ total: BAR, perSide: [] }, ["sotto il peso del bilanciere"]);
  }
  let remaining = (total - BAR) / 2;
  const perSide: Grams[] = [];
  for (const plate of PLATES) {
    while (remaining > plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  return ok({ total, perSide });
}
