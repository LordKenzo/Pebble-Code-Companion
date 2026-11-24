```json
{
  "reading": "Il passo 1 è chiuso: c'è il package.json con lo script di test su `test/**/*.test.ts` e un test di prova, ma non esiste ancora `src/`. Questo passo crea il primo file del core, `src/core/plates.ts`. Seguendo ADR-003 la funzione lavora in grammi interi: 22,5 kg diventa 22500. Così i test non risentono degli errori dei float. La conversione kg ↔ grammi (`src/core/units`) arriverà quando servirà alla CLI. Per ora i test passano direttamente i grammi e tengono i kg nel nome, così restano leggibili. I casi anomali sono valori di ritorno, non eccezioni (ADR-004).",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea `test/core/plates.test.ts` con `node:test` e `node:assert` (ADR-005). Ogni test passa il carico totale in grammi e controlla l'esito e i dischi per lato. Copri: \"15 kg: solo bilanciere, con avviso\", \"20 kg: solo bilanciere, nessun disco\", \"21 kg: non componibile, esito non valido\", \"0 kg: peso non valido\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10 e 1,25 per lato\". Gli esiti seguono ADR-004.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci tipi e costanti dei dischi",
      "todo": "Crea `src/core/plates.ts`. Dentro metti il peso del bilanciere (20000 g), i dischi disponibili in grammi in ordine decrescente (25000 … 1250, da bootstrap › Vincoli) e il tipo del risultato. Il tipo del risultato è una union discriminata sul campo `status` ('ok' | 'avviso' | 'non-valido'), senza `enum`, perché il type stripping non li supporta (ADR-005). Scrivi la funzione con un corpo provvisorio, così il file compila e i test diventano rossi invece di non partire.",
      "signature": "export function platesPerSide(totalGrams: number): PlatesResult",
      "doneWhen": [
        "file src/core/plates.ts exports platesPerSide",
        "no errors in src/core/plates.ts"
      ]
    },
    {
      "title": "Scomponi un carico componibile",
      "todo": "Implementa il caso normale. Togli il bilanciere e dividi per due. Poi prendi i dischi dal più grande al più piccolo finché il resto è zero. I dischi sono illimitati per taglio (ADR-004), quindi non serve contare le scorte. Verifica a mano 142,5 kg prima di scrivere il codice.",
      "signature": "export function platesPerSide(totalGrams: number): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i casi anomali",
      "todo": "Aggiungi i controlli prima della scomposizione, come chiede ADR-004. Un peso ≤ 0 è non valido. Un carico tra 0 e 20 kg dà «solo bilanciere» con avviso, mai dischi negativi. Un carico che non è multiplo di 2500 g (ADR-003) è non componibile e quindi non valido.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"21 kg\" \"0 kg\""
      ]
    },
    {
      "title": "Review con Pebble",
      "todo": "Chiedi una review di `src/core/plates.ts` e del suo test. Controlla che nel core non ci siano `console` o `process` (ADR-001) e che `npm run typecheck` sia pulito.",
      "signature": null,
      "doneWhen": [
        "manual"
      ]
    }
  ],
  "question": "Per i dischi per lato preferisci una lista ripetuta, per esempio [25000, 25000, 10000, 1250], oppure le coppie taglio → quantità (25 kg × 2, 10 kg × 1, 1,25 kg × 1)? Io consiglio la lista ripetuta: è più semplice da costruire e da confrontare con `deepStrictEqual`. Cambia però come scriverai i test e la formattazione nella CLI."
}
```
