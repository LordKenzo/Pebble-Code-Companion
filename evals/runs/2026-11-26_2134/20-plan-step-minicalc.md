```json
{
  "reading": "Il setup è fatto: TypeScript, tipi di Node, script `test` e `typecheck` e un primo test che passa. Di `core` non c'è ancora niente, quindi questo passo parte da zero con `src/core/plates.ts`. Seguo ADR-003: la funzione lavora in grammi interi (20 kg = 20000), così 22,5 e 142,5 non diventano float ambigui. La conversione kg ↔ grammi (modulo `units`) non rientra in questo passo: nei test scrivi i carichi direttamente in grammi. Seguo anche ADR-004: sotto i 20 kg l'esito è «solo bilanciere» con un avviso, e un carico non componibile è un esito non valido, non un'eccezione. L'arrotondamento resta fuori dal passo, perché qui il carico arriva già componibile. Una nota sul type stripping (ADR-005): negli import serve l'estensione `.ts` (`../../src/core/plates.ts`). Se `tsc` si lamenta, nel `tsconfig.json` servono `allowImportingTsExtensions` e `noEmit`.",
  "tasks": [
    {
      "title": "Scrivi i test della scomposizione in dischi",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005), seguendo la struttura a specchio dell'architettura. Casi, con questi nomi esatti: \"15 kg: solo bilanciere, con avviso\", \"21 kg: non componibile, esito non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". All'inizio devono fallire tutti: la funzione non esiste ancora.",
      "signature": null,
      "doneWhen": ["file test/core/plates.test.ts"]
    },
    {
      "title": "Definisci tipi e firma di platesPerSide",
      "todo": "In src/core/plates.ts dichiara il tipo Grams, l'elenco dei dischi disponibili e il tipo del risultato come union di stringhe sull'esito. Niente enum, li vieta il type stripping (ADR-005). Il risultato distingue ok, avviso e non valido (ADR-004). La funzione deve essere pura, senza console né process (ADR-001).",
      "signature": "export type Grams = number;\nexport declare const BAR: Grams;\nexport declare const PLATES: readonly Grams[];\nexport type PlatesResult =\n  | { outcome: \"ok\"; perSide: Grams[] }\n  | { outcome: \"warning\"; perSide: Grams[]; warning: string }\n  | { outcome: \"invalid\"; error: string };\nexport declare function platesPerSide(total: Grams): PlatesResult;",
      "doneWhen": ["file src/core/plates.ts esporta platesPerSide", "nessun errore in src/core/plates.ts"]
    },
    {
      "title": "Implementa la scomposizione per i carichi componibili",
      "todo": "Togli il bilanciere, dividi per due e riempi il lato partendo dal disco più grande e scendendo. I dischi sono illimitati per taglio (ADR-004). Restituisci i dischi di un lato in ordine decrescente, con le ripetizioni, per esempio due 25.",
      "signature": null,
      "doneWhen": ["test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""]
    },
    {
      "title": "Gestisci i casi anomali",
      "todo": "Sotto i 20 kg restituisci l'esito con avviso «solo bilanciere» e un lato vuoto, mai dischi negativi. Se un lato non si compone esattamente con i dischi disponibili, restituisci l'esito non valido. Entrambe le regole vengono da ADR-004.",
      "signature": null,
      "doneWhen": ["test \"15 kg\" \"21 kg\""]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Fai rivedere plates.ts e i test. Verifica soprattutto che il codice lavori solo con grammi interi (ADR-003) e che non ci siano dipendenze da cli (ADR-001).",
      "signature": null,
      "doneWhen": ["a mano"]
    }
  ],
  "question": null
}
```
