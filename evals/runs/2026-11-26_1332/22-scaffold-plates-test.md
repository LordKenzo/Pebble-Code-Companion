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
    "body": "const result = platesFor(kgToGrams(60));\nassert.equal(result.ok, true);\nif (!result.ok) return;\n// ipotesi: PlateLoad espone i dischi di un lato in grammi, dal più pesante\nassert.deepEqual(result.value.perSide, [kgToGrams(20)]);\nassert.deepEqual(result.warnings, []);"
  },
  "testCases": [
    "15 kg: solo bilanciere con avviso, nessun disco e nessun disco negativo",
    "20 kg: nessun disco, nessun avviso",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato, in ordine dal più pesante"
  ]
}
```
