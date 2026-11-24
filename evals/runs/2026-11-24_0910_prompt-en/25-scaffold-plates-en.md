```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR",
      "type": "Grams",
      "value": "20000",
      "doc": "Weight of the barbell in grams: 20 kg (bootstrap › Constraints, integer grams per ADR-003)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Available plate sizes in grams, heaviest first. Plates come in pairs and are unlimited per size (bootstrap › Constraints, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "How to load the barbell for a given total. perSide lists the plates on ONE side, heaviest first. An empty list means bar only (ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load (barbell included) into the plates to put on each side. Pure function, no console or process (ADR-001). Anomalies are returned as results and never thrown (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is not a positive integer number of grams, return invalid with a clear message (ADR-004).",
        "If total is below BAR, return ok with total equal to BAR, an empty perSide and a 'bar only' warning. Never compute negative plates.",
        "Subtract BAR from total and halve what is left. That is the weight to build on one side.",
        "Walk PLATES from the heaviest. For each plate, add it to perSide as many times as it fits in the remaining weight per side, and reduce the remainder each time.",
        "If something is still left at the end, the total was not buildable (it should already have been rounded down, ADR-003). Return invalid instead of a wrong load.",
        "Otherwise return ok with total and perSide."
      ],
      "question": "Work out 142.5 kg by hand in grams: how much is left per side after removing the bar, and which plates do you pick, in order? Then try 21 kg. Where does the walk get stuck, and which branch should handle it?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
