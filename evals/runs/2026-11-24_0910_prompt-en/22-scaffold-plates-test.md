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
    "body": "const result = platesFor(kgToGrams(20));\nassert.equal(result.ok, true);\nif (!result.ok) return;\n// perSide: allinea il nome al campo che definirai in PlateLoad (src/core/plates.ts)\nassert.deepEqual(result.value.perSide, []);\nassert.deepEqual(result.warnings, []);"
  },
  "testCases": [
    "15 kg: solo bilanciere con avviso",
    "22,5 kg: un 1,25 per lato",
    "142,5 kg: 25, 25, 10, 1,25 per lato",
    "60 kg: un 20 per lato"
  ]
}
```
