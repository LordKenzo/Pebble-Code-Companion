{
  "reading": "Il passo 1 è chiuso: TypeScript, i tipi di Node e il test di prova con `node:test` ci sono già (package.json, test/smoke.test.ts). Non esiste ancora una cartella `src/`, quindi questo passo crea il primo modulo del core: `src/core/plates.ts`, più il tipo dei grammi in `src/core/units.ts` che serve alla firma (ADR-003). La funzione riceve un carico già componibile. L'arrotondamento al carico componibile resta fuori: appartiene al modulo `loads` e a un passo successivo.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "In `test/core/plates.test.ts`, con `node:test` e `node:assert` (ADR-005), descrivi il comportamento di `platesPerSide` con i carichi espressi in grammi (ADR-003). Metti prima i casi limite di ADR-004. Usa questi nomi: \"15 kg: solo bilanciere, con avviso\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". All'inizio saranno rossi: va bene così.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci i grammi e il tipo del risultato",
      "todo": "In `src/core/units.ts` esporta il tipo `Grams`. In `src/core/plates.ts` esporta `PlatesResult`, un'unione di esiti come in ADR-004: ok con la lista dei dischi per lato, oppure solo bilanciere con avviso. Usa union di stringhe e non `enum`, che il type stripping non supporta (ADR-005). Nello stesso file metti la costante con i dischi del bootstrap, in grammi.",
      "signature": null,
      "doneWhen": [
        "file src/core/units.ts exports Grams",
        "file src/core/plates.ts exports PlatesResult",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "Togli i 20 kg del bilanciere, dividi il resto per due e scegli i dischi dal più grande al più piccolo. I dischi sono illimitati per taglio (ADR-004). Solo funzioni pure: niente `console` né `process` (ADR-001).",
      "signature": "export function platesPerSide(total: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci il carico sotto il bilanciere",
      "todo": "Sotto i 20 kg l'esito è «solo bilanciere» con un avviso, mai dischi negativi (ADR-004). Il caso merita un test a parte, perché è quello che in palestra trae in inganno.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\""
      ]
    },
    {
      "title": "Rivedi con Pebble",
      "todo": "Chiedi una review di `src/core/plates.ts` e del suo test. Controlla soprattutto che si lavori solo in grammi interi (ADR-003) e che ogni esito sia un valore e non un'eccezione (ADR-004).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Se `platesPerSide` riceve un carico non componibile, per esempio 21 kg, deve restituire un esito «non valido» oppure lo consideri un errore di chi la chiama, visto che l'arrotondamento spetta a `loads`?"
}
