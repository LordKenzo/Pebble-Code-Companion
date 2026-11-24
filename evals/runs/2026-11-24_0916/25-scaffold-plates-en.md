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
      "doc": "Weight of the barbell in grams (bootstrap › Constraints: 20 kg barbell; ADR-003: integer grams)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Available plate sizes in grams, heaviest first. They come in pairs and there is no limit per size (bootstrap › Constraints; ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "How to build a total load: the real total and the plates that go on ONE side, heaviest first (ADR-003: grams internally, converted to kg only by the CLI).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load into the plates for each side. Pure function: no console, no process (ADR-001). Anomalies are returned as results, never thrown (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is not a positive integer number of grams, return an invalid result with a clear message (ADR-004).",
        "If total is below BAR_WEIGHT, return ok with the bar only (total = BAR_WEIGHT, perSide empty) and a 'below the bar weight' warning. Never negative plates (ADR-004).",
        "Subtract BAR_WEIGHT from total and halve what is left: that is the weight to put on one side.",
        "Walk PLATES from the heaviest: while the current plate fits in the remaining weight per side, add it to perSide and subtract it from the remainder.",
        "If at the end the remainder is not zero, the total was not buildable (it should have been rounded down before, ADR-003): return invalid with a message that names the total.",
        "Otherwise return ok with the total and the perSide list."
      ],
      "question": "Work out 142.5 kg by hand in grams: what is left per side after removing the bar, and which plates do you pick, in order? Then try 21 kg: where exactly does the walk get stuck, and which step catches it?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
