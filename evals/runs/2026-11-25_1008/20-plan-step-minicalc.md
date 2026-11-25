{
  "reading": "Il passo 1 è chiuso: package.json ha gli script `test` (node:test sui file `test/**/*.test.ts`) e `typecheck`, e `test/smoke.test.ts` passa. `src/` non esiste ancora, quindi questo passo crea i primi due moduli del core: `units` per il tipo in grammi (ADR-003) e `plates` per la scomposizione. Il passo riguarda solo carichi già componibili: l'arrotondamento da una percentuale appartiene a un passo successivo e qui non va anticipato. L'unica cosa che il passo deve gestire in più è l'esito dei casi anomali, perché lo chiede ADR-004.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea `test/core/plates.test.ts`, che rispecchia `src/core` come dice l'architettura, con `node:test` e `node:assert` (ADR-005). Importa con l'estensione `.ts` per via del type stripping. Copri, nell'ordine, i casi anomali prima: \"15 kg: solo bilanciere, con avviso\", \"21 kg: non componibile, esito non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10 e 1,25 per lato\". All'inizio i test devono essere rossi.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Crea il modulo units con il tipo Grams",
      "todo": "In `src/core/units.ts` dichiara il tipo `Grams` e la conversione da kg a grammi interi, così i test possono scrivere i carichi in kg e il core lavora solo con interi (ADR-003). Nessun `console` e nessun `process` (ADR-001).",
      "signature": "export function kgToGrams(kg: number): Grams",
      "doneWhen": [
        "file src/core/units.ts exports kgToGrams",
        "nessun errore in src/core/units.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "In `src/core/plates.ts` definisci `PlatesResult` con l'esito come union di stringhe, perché il type stripping vieta gli `enum` (ADR-004, ADR-005). Poi scrivi `platesPerSide`: toglie il bilanciere, divide per due e sceglie i dischi dal più pesante, tutto in grammi. I dischi sono illimitati per taglio (ADR-004).",
      "signature": "export function platesPerSide(total: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci sotto i 20 kg e i carichi non componibili",
      "todo": "Sotto il bilanciere l'esito è «solo bilanciere» con un avviso, mai dischi negativi. Un carico che non si scompone esattamente restituisce un esito non valido, senza eccezioni (ADR-004).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"21 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Rivedi con Pebble",
      "todo": "Lancia `npm test` e `npm run typecheck`. Poi chiedi una review di `src/core/plates.ts`: purezza del core (ADR-001), aritmetica in grammi (ADR-003) ed esiti espliciti (ADR-004).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Per un lato vuoi una lista di dischi ripetuti (25, 25, 10, 1,25) o un conteggio per taglio (2×25, 1×10, 1×1,25)? La scelta cambia il tipo `PlatesResult` e quindi tutte le asserzioni dei test."
}
