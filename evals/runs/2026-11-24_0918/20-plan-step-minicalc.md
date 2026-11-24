{
  "reading": "Il setup è fatto: package.json con gli script `test` e `typecheck`, tsconfig e un test di prova. `src/` non esiste ancora, quindi questo passo crea il primo modulo del core: `src/core/plates.ts` (architettura › Livelli e cartelle). Seguendo ADR-003 la funzione lavora in grammi interi. La conversione kg ↔ grammi (`units`) resta fuori da questo passo: nei test i carichi si scrivono già in grammi (es. 142_500). Seguendo ADR-004 il risultato è un valore con un esito, mai un'eccezione. I dischi sono illimitati per taglio, quindi basta scegliere i dischi dal più grande al più piccolo.",
  "tasks": [
    {
      "title": "Scrivi i test della scomposizione in dischi",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). Ogni carico va passato in grammi (ADR-003). Copri questi casi, partendo dai casi limite di ADR-004: \"15 kg: solo bilanciere, con avviso\", \"0 kg: carico non valido, esito errore\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: due 25, un 10 e un 1,25 per lato\". All'inizio saranno rossi, ed è giusto così.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci tipi e costanti del modulo dischi",
      "todo": "In src/core/plates.ts dichiara il tipo `Grams`, il peso del bilanciere e la lista dei dischi in grammi, dal più pesante al più leggero (bootstrap › Vincoli). Dichiara anche il tipo del risultato come union di stringhe sull'esito: ok, avviso con messaggio, errore con messaggio (ADR-004). Niente `enum`, perché il type stripping non lo supporta (ADR-005). In questo task scrivi solo dichiarazioni, nessuna logica.",
      "signature": "export type Grams = number;\nexport type PlatesResult =\n  | { status: 'ok'; perSide: Grams[] }\n  | { status: 'warning'; perSide: Grams[]; message: string }\n  | { status: 'error'; message: string };",
      "doneWhen": [
        "file src/core/plates.ts exports PlatesResult",
        "no errors in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa platesPerSide per i carichi componibili",
      "todo": "Togli il peso del bilanciere, dividi a metà e scegli i dischi dal più grande al più piccolo finché il resto arriva a zero. Lavora sempre in grammi interi (ADR-003) e resta una funzione pura, senza console né process (ADR-001).",
      "signature": "export function platesPerSide(totalGrams: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\"",
        "no errors in src/core/plates.ts"
      ]
    },
    {
      "title": "Gestisci i carichi sotto il bilanciere e quelli non validi",
      "todo": "Sotto i 20 kg restituisci l'esito «solo bilanciere» con avviso e la lista dei dischi vuota, mai dischi negativi. Con un carico ≤ 0 restituisci un esito di errore (ADR-004). Fai questi controlli prima della scomposizione.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"0 kg\""
      ]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Apri src/core/plates.ts e chiedi una revisione. Controlliamo l'aderenza ad ADR-001, ADR-003 e ADR-004, e che `npm run typecheck` sia pulito.",
      "signature": null,
      "doneWhen": [
        "manual"
      ]
    }
  ],
  "question": "Se a platesPerSide arriva un carico non componibile (es. 21 kg), deve restituire un errore oppure arrotondare per difetto lui stesso? ADR-003 assegna l'arrotondamento a `loads`, ma da questa scelta dipende se serve un settimo test."
}
