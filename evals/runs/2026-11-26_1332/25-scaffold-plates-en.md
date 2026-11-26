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
      "doc": "Weight of the empty barbell in grams (bootstrap › Constraints: 20 kg barbell, ADR-003: integer grams)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Available plate sizes in grams, heaviest first. Unlimited per size, loaded in pairs (bootstrap › Constraints, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "How a barbell is loaded: the real total on the bar and the plates on ONE side, heaviest first. The other side mirrors it.",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Splits a total load into the plates for each side (ADR-003, ADR-004). Expects a total that has already been rounded down to a buildable load.",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "If total is not a whole number of grams or is zero or less, return invalid with a clear message (ADR-004: invalid input is an explicit result, not an exception).",
        "If total is below BAR_WEIGHT, return ok with an empty perSide, total equal to BAR_WEIGHT, and a 'bar only' warning (ADR-004: never negative plates).",
        "Remove BAR_WEIGHT from total, then halve what is left: that is the weight to put on one side.",
        "Walk PLATES from the heaviest: while the current plate still fits in the remaining side weight, add it to perSide and subtract it from the remaining weight; then move to the next plate.",
        "If some weight remains after the smallest plate, the total was not buildable: return invalid saying it must be rounded down first (ADR-003).",
        "Otherwise return ok with perSide and the original total."
      ],
      "question": "Before writing it, work out 142.5 kg by hand in grams: how much goes on each side, and which plates does the walk from the heaviest produce, in what order?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
