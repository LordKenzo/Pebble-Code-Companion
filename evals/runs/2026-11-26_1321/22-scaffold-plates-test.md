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
    "name": "60 kg: un 20 per lato",
    "body": "test(\"60 kg: un 20 per lato\", () => {\n  const result = platesFor(kgToGrams(60));\n  assert.ok(result.ok);\n  assert.deepEqual(result.value.perSide, [kgToGrams(20)]);\n  assert.deepEqual(result.warnings, []);\n});"
  },
  "testCases": [
    "15 kg: solo bilanciere con avviso (esito ok, nessun disco, almeno un avviso in warnings)",
    "20 kg: nessun disco (esito ok, lista per lato vuota, nessun avviso)",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato (dischi in ordine dal più pesante)"
  ]
}
```
