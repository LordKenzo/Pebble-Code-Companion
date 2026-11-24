```json
{
  "imports": [
    { "names": ["test"], "from": "node:test" },
    { "names": ["strict as assert"], "from": "node:assert" },
    { "names": ["platesFor"], "from": "../../src/core/plates.ts" },
    { "names": ["kgToGrams"], "from": "../../src/core/units.ts" }
  ],
  "constants": [],
  "types": [],
  "functions": [],
  "exampleTest": {
    "name": "15 kg: solo bilanciere con avviso",
    "body": "const result = platesFor(kgToGrams(15));\nassert.equal(result.ok, true);\nif (result.ok) {\n  assert.ok(result.warnings.length > 0);\n}"
  },
  "testCases": [
    "20 kg: nessun disco",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato",
    "60 kg: un 20 per lato"
  ]
}
```
