```json
{
  "reading": "Il passo 1 è chiuso: ci sono package.json, tsconfig.json e test/smoke.test.ts, ma ancora nessun file in src/. Questo passo crea il primo modulo del core, src/core/plates.ts, con il test speculare in test/core/plates.test.ts (architettura › Livelli e cartelle). Per ADR-003 la funzione lavora in grammi interi. Il modulo units non serve ancora: nei test scrivi direttamente i grammi (142,5 kg = 142500), e la conversione arriverà con il passo dei carichi. Calcolo dei casi: 142,5 kg tolto il bilanciere fa 122,5 kg, cioè 61,25 kg per lato, cioè 25 + 25 + 10 + 1,25.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005), prima i casi limite delle regole del bootstrap: \"15 kg: solo bilanciere con avviso\", \"20 kg: solo bilanciere, nessun disco\", \"21 kg: non componibile, non valido\", \"0 kg: non valido\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". Scrivere i test prima ti obbliga a decidere il risultato atteso a mano: è la tua rete di sicurezza contro un carico sbagliato (bootstrap › Vincoli).",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci il tipo del risultato",
      "todo": "In src/core/plates.ts dichiara il tipo di ritorno con un campo che dice l'esito: ok, avviso oppure non valido (ADR-004). Usa una union di stringhe, non un enum, perché il type stripping non supporta gli enum (ADR-005). Nel file metti anche le costanti in grammi: bilanciere 20000 e dischi 25000, 20000, 15000, 10000, 5000, 2500, 1250 (ADR-003).",
      "signature": "export type PlatesResult = { status: 'ok'; perSide: number[] } | { status: 'warning'; perSide: number[]; message: string } | { status: 'invalid'; message: string }",
      "doneWhen": [
        "file src/core/plates.ts esporta PlatesResult",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "Togli il bilanciere, dividi per due e riempi il lato partendo dal disco più pesante. I dischi sono illimitati per taglio, quindi non devi contare le scorte (ADR-004). La funzione resta pura: niente console e niente process (ADR-001).",
      "signature": "export function platesPerSide(totalGrams: number): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i casi anomali",
      "todo": "Sotto i 20 kg restituisci «solo bilanciere» con avviso, mai dischi negativi. Un carico che non è multiplo di 2,5 kg, oppure che è ≤ 0, è non valido (ADR-004). Ogni anomalia è un valore che puoi testare, non un'eccezione.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"21 kg\" \"0 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Apri src/core/plates.ts e chiedi una review: verifica che il calcolo sia in grammi interi (ADR-003) e che il modulo non importi nulla dalla CLI (ADR-001).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Per la CLI ti è più utile una lista di dischi ripetuti (25, 25, 10, 1,25) oppure un conteggio per taglio (2×25, 1×10, 1×1,25)? La scelta cambia la forma di perSide e tutte le asserzioni dei test."
}
```
