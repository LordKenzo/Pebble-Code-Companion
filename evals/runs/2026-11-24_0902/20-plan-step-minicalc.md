```json
{
  "reading": "Il passo 1 è chiuso: package.json con gli script test e typecheck, tsconfig.json e test/smoke.test.ts che passa. src/ non esiste ancora, quindi questo passo crea il primo modulo del core: src/core/plates.ts. Non dipende da niente (ADR-001). Per rispettare ADR-003, platesPerSide riceve il carico in grammi interi e restituisce i dischi in grammi. Il modulo units con la conversione kg ↔ grammi non serve ancora: arriverà con il passo dei carichi, che è il primo a ricevere kg dall'utente. Nei test scrivi i valori in grammi (142,5 kg = 142500). Un carico non multiplo di 2,5 kg qui è un errore: l'arrotondamento per difetto spetta a loads (ADR-003), non a plates.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). Copri questi casi, prima i limiti: \"15 kg: solo bilanciere con avviso\", \"61 kg: non componibile, non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\", \"da 20 a 200 kg ogni 2,5: un lato somma a metà del carico meno il bilanciere\". All'inizio saranno tutti rossi, ed è giusto così.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci costanti e tipo del risultato",
      "todo": "In src/core/plates.ts dichiara il peso del bilanciere e la lista dei dischi in grammi interi, dal più pesante al più leggero (bootstrap › Vincoli, ADR-003). Dichiara poi il tipo PlatesResult con un esito come union di stringhe, ok, avviso oppure non valido: niente enum (ADR-004, ADR-005). Ragiona su cosa contiene ogni esito: la lista dei dischi per lato, un messaggio, entrambi?",
      "signature": "export type PlatesResult = { outcome: 'ok'; perSide: number[] } | { outcome: 'warning'; perSide: number[]; message: string } | { outcome: 'invalid'; message: string }",
      "doneWhen": [
        "file src/core/plates.ts esporta PlatesResult",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "Scrivi platesPerSide per i carichi componibili da 20 kg in su. Togli il bilanciere, dividi per due e prendi i dischi dal più pesante finché resta peso da coprire. Lavora solo con interi in grammi (ADR-003) e resta una funzione pura, senza console (ADR-001).",
      "signature": "export function platesPerSide(loadGrams: number): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i casi anomali e l'intera gamma",
      "todo": "Aggiungi gli esiti espliciti di ADR-004. Sotto i 20 kg l'esito è un avviso «solo bilanciere» senza dischi negativi. Un carico che non si scompone esattamente con i dischi disponibili è non valido. Fai passare anche il test che percorre tutta la gamma: è la rete di sicurezza contro un carico sbagliato (bootstrap › Vincoli).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"61 kg\" \"da 20 a 200 kg ogni 2,5\""
      ]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una review di src/core/plates.ts e del suo test. Controlla soprattutto che non ci siano float in kg (ADR-003) e che ogni anomalia sia un valore restituito e non un'eccezione (ADR-004). Lancia anche npm run typecheck.",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Per 142,5 kg ogni lato deve fare 61,25 kg: in quanti modi diversi puoi comporlo con i dischi disponibili, e quale combinazione vuoi che il programma restituisca sempre?"
}
```
