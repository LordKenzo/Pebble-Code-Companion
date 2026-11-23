```json
{
  "reading": "Il setup è fatto: package.json con gli script test e typecheck, tsconfig.json e test/smoke.test.ts. Non esiste ancora niente in src/, quindi il passo 2 parte da zero: si crea src/core/units.ts e src/core/plates.ts, con i test in test/core/ come chiede l'architettura (test specchio di src/core). La scomposizione lavora in grammi interi (ADR-003) e restituisce un esito esplicito invece di lanciare eccezioni (ADR-004). L'arrotondamento al carico componibile non c'entra qui: è compito di loads, al passo successivo. Per questo un carico non componibile che arriva a plates viene trattato come input non valido.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). Ogni test controlla l'esito e i dischi per lato, dal più pesante al più leggero. Casi da coprire: \"15 kg: solo bilanciere con avviso\", \"21 kg: non componibile, esito non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". All'inizio falliranno: è normale, scrivere prima i test (TDD) ti obbliga a decidere cosa deve uscire prima di decidere come.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Scrivi la conversione kg ↔ grammi",
      "todo": "In src/core/units.ts due funzioni pure (ADR-001): da kg a grammi interi e da grammi a kg. Lavorare in interi evita errori come 0,1 + 0,2 ≠ 0,3 (ADR-003). Fai attenzione che 22,5 kg diventi esattamente 22500 e non 22499,999…",
      "signature": "function kgToGrams(kg: number): number; function gramsToKg(grams: number): number",
      "doneWhen": [
        "file src/core/units.ts esporta kgToGrams",
        "nessun errore in src/core/units.ts"
      ]
    },
    {
      "title": "Scomponi un carico componibile in dischi",
      "todo": "In src/core/plates.ts definisci il tipo del risultato come union di stringhe sul campo status (niente enum, ADR-005) e implementa la scomposizione: togli il bilanciere, dividi per due, poi usa i dischi dal più pesante al più leggero, che sono illimitati per taglio (ADR-004). Bilanciere e dischi in grammi, come costanti del modulo (bootstrap › Vincoli).",
      "signature": "type PlatesResult = { status: \"ok\"; perSideGrams: number[] } | { status: \"warning\"; perSideGrams: number[]; message: string } | { status: \"invalid\"; message: string }; function platesPerSide(totalGrams: number): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Gestisci i carichi sotto il bilanciere e quelli non componibili",
      "todo": "Sotto i 20 kg l'esito è «solo bilanciere» con avviso e lista di dischi vuota, mai dischi negativi (ADR-004). Un carico che non è multiplo di 2,5 kg dà esito non valido con un messaggio chiaro, perché l'arrotondamento spetta a loads (ADR-003).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"21 kg\""
      ]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Apri src/core/plates.ts e chiedi una review: verifichiamo che non usi console o process (ADR-001), che i conti restino in grammi (ADR-003) e che ogni esito sia coperto da un test (ADR-004).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": null
}
```
