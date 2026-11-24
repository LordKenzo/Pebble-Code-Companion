```json
{
  "reading": "Il passo 1 è chiuso: package.json con gli script `test` e `typecheck`, tsconfig.json e test/smoke.test.ts che passa. In src/ non c'è ancora codice, quindi questo passo parte da zero sul core. Il glob `test/**/*.test.ts` copre già una sottocartella test/core/, quindi non serve toccare la configurazione. Il passo si limita alla scomposizione in dischi di un carico già componibile. Il calcolo dalle percentuali e l'arrotondamento per difetto appartengono al modulo loads, in un passo successivo. Lo stesso vale per la conversione kg ↔ grammi nell'output: qui ci serve solo il tipo Grams (ADR-003).",
  "tasks": [
    {
      "title": "Definisci tipi e costanti dei dischi",
      "todo": "In src/core/units.ts esporta il tipo `Grams`, un alias di number, perché tutto il core lavora in grammi interi (ADR-003). In src/core/plates.ts dichiara le costanti del bilanciere (20000 g) e dei dischi disponibili (25, 20, 15, 10, 5, 2,5, 1,25 kg in grammi, dal più pesante) dal bootstrap › Vincoli. Dichiara anche il tipo `PlatesResult` con gli esiti di ADR-004: ok, ok con avviso (solo bilanciere) e non valido. Gli esiti sono una union di stringhe, non un enum, per via del type stripping (ADR-005).",
      "signature": "export type PlatesResult =\n  | { status: 'ok'; perSide: Grams[] }\n  | { status: 'warning'; perSide: Grams[]; message: string }\n  | { status: 'invalid'; message: string };",
      "doneWhen": [
        "file src/core/units.ts esporta Grams",
        "file src/core/plates.ts esporta PlatesResult",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Scrivi i test della scomposizione in dischi",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). I casi anomali di ADR-004 vanno per primi. Usa questi nomi: \"15 kg: solo bilanciere, con avviso\", \"61 kg: non componibile, esito non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". Lanciali con `npm test`: all'inizio devono essere rossi.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "Scrivi `platesPerSide` in src/core/plates.ts. Togli il bilanciere dal totale, dividi per due e riempi il lato partendo dal disco più pesante tra quelli disponibili. I dischi sono illimitati per taglio (ADR-004). La funzione resta pura: niente console e niente process (ADR-001). Prima fai a mano il caso da 142,5 kg per controllare l'ordine dei dischi.",
      "signature": "export function platesPerSide(total: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i carichi anomali",
      "todo": "Sotto i 20 kg restituisci l'esito con avviso «solo bilanciere» e nessun disco, mai dischi negativi (ADR-004). Un carico che non si riesce a comporre con i dischi dà l'esito non valido con un messaggio chiaro, perché questa funzione si aspetta un carico già arrotondato (ADR-003).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"61 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Apri src/core/plates.ts e test/core/plates.test.ts e chiedi una revisione. Verifica anche che `npm run typecheck` passi.",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": null
}
```
