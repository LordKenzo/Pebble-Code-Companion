```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR_WEIGHT",
      "type": "Grams",
      "value": "20000",
      "doc": "Weight of the barbell in grams (bootstrap › Constraints, integer grams per ADR-003)."
    },
    {
      "name": "PLATE_SIZES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Available plate sizes in grams, heaviest first (bootstrap › Constraints). Unlimited quantity per size (ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "How a load is built: the real total on the bar and the plates to put on each side, heaviest first. Both sides are identical.",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load into the plates to put on each side of the barbell. Expects a load that is already rounded to a buildable value (ADR-003). Anomalies come back as results, never as exceptions (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is not a positive integer number of grams, return invalid with a message that names the received value.",
        "If total is below BAR_WEIGHT, return ok with total equal to BAR_WEIGHT, an empty perSide list and a 'bar only' warning (ADR-004). If total equals BAR_WEIGHT, return the same value but without the warning.",
        "Subtract BAR_WEIGHT from total and halve the rest. This gives the weight still missing on one side.",
        "Walk PLATE_SIZES from the first (heaviest). While the missing weight is at least the current plate, add that plate to perSide and subtract it from the missing weight.",
        "If some weight is still missing after the last plate, the load cannot be built. Return invalid and say that rounding must happen before this step.",
        "Otherwise return ok with the original total and the perSide list."
      ],
      "question": "Work out 142.5 kg by hand: how many grams per side, and which plates in which order? Then try 21 kg: what is left after the walk, and should platesFor round it or refuse it?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
