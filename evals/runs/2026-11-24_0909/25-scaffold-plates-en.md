```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result", "ok", "invalid"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR_WEIGHT",
      "type": "Grams",
      "value": "20000",
      "doc": "Weight of the barbell in grams (bootstrap › Constraints: 20 kg barbell; ADR-003: integer grams)."
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
      "doc": "How a total load is built: the plates on ONE side of the bar, heaviest first. The other side is identical (bootstrap › Constraints: plates in pairs).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load (barbell included) into the plates for each side. Pure function, no console or process (ADR-001). Anomalies are returned as results, never thrown (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is below BAR_WEIGHT, return ok with an empty perSide list and a 'bar only' warning, never negative plates (ADR-004).",
        "Subtract BAR_WEIGHT from total and halve the rest: that is the weight to put on one side.",
        "Walk PLATE_SIZES from the first (heaviest): while the plate fits in what is left on the side, add it to perSide and subtract it from what is left.",
        "When the walk is done, if something is still left, the total can't be built: return invalid with a message that shows the total in kg.",
        "Otherwise return ok with total and perSide, and no warnings."
      ],
      "question": "Before writing: work out by hand which plates go on one side for 142.5 kg. Then do the same for 21 kg: what is left after the walk, and why is it better to return invalid than to round silently in this function (ADR-003 rounds before plates are computed)?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
