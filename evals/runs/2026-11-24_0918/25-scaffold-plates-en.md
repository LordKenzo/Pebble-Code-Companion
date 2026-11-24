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
      "doc": "Weight of the barbell in grams: 20 kg (bootstrap › Constraints, ADR-003)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Available plate sizes in grams, heaviest first, unlimited per size (bootstrap › Constraints, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "How a total load is built: the total on the bar and the plates to put on ONE side, heaviest first (ADR-003, ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load (bar included) into the plates for each side. Below the bar weight it returns bar only with a warning. A total that can't be built is invalid (ADR-004). Pure function, no console or process (ADR-001).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is not an integer number of grams or is not positive, return invalid with a clear error message.",
        "If total is below BAR_WEIGHT, return ok with an empty perSide list, total equal to BAR_WEIGHT, and a 'bar only' warning.",
        "Subtract BAR_WEIGHT from total and halve what is left: that is the weight for one side.",
        "Walk PLATES from the heaviest. While the plate fits in the weight still to load, add it to perSide and subtract it.",
        "If some weight is still left at the end, the load can't be built with these plates: return invalid. It means the rounding step upstream was skipped.",
        "Otherwise return ok with total and perSide."
      ],
      "question": "Work out 142.5 kg by hand in grams. What is left after removing the bar? How much goes on one side? Which plates do you pick, in order? Then try 21 kg: why does halving leave a weight that no plate can match?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
