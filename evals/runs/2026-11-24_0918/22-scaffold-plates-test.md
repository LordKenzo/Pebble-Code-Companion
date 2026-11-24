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
    "name": "20 kg: nessun disco",
    "body": "// Ipotesi: PlateLoad espone perSide, i dischi di un lato in grammi, dal più pesante.\nconst result = platesFor(kgToGrams(20));\nassert.equal(result.ok, true);\nif (result.ok) {\n  assert.deepEqual(result.value.perSide, []);\n  assert.deepEqual(result.warnings, []);\n}"
  },
  "testCases": [
    "15 kg: solo bilanciere con avviso",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato",
    "60 kg: un 20 per lato"
  ]
}
```
