```json
{
  "imports": [
    { "names": ["test"], "from": "node:test" },
    { "names": ["ok", "deepEqual"], "from": "node:assert/strict" },
    { "names": ["platesFor"], "from": "../../src/core/plates.ts" },
    { "names": ["kgToGrams"], "from": "../../src/core/units.ts" }
  ],
  "constants": [],
  "types": [],
  "functions": [],
  "exampleTest": {
    "name": "15 kg: solo bilanciere con avviso",
    "body": "const result = platesFor(kgToGrams(15));\nok(result.ok);\nok(result.warnings.length > 0);"
  },
  "testCases": [
    "20 kg: nessun disco",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato",
    "60 kg: un 20 per lato"
  ]
}
```
