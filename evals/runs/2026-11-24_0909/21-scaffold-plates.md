```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR_GRAMS",
      "type": "Grams",
      "value": "20000",
      "doc": "Peso del bilanciere in grammi: 20 kg (bootstrap › Vincoli, ADR-003)."
    },
    {
      "name": "PLATES_GRAMS",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Dischi disponibili per lato, in grammi e dal più pesante al più leggero. L'ordine conta per lo scorrimento (bootstrap › Vincoli). Sono illimitati per taglio (ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Come caricare il bilanciere: carico reale totale e dischi da mettere su ciascun lato, dal più pesante. Un elenco vuoto vuol dire solo bilanciere (ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale in dischi per lato. È una funzione pura: niente console e niente process (ADR-001). I casi anomali sono esiti espliciti, non eccezioni (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un numero intero di grammi maggiore di zero, restituisci un esito non valido con un messaggio che dica perché (ADR-004).",
        "Se total è sotto BAR_GRAMS, restituisci un esito ok con perSide vuoto, total uguale a BAR_GRAMS e l'avviso «solo bilanciere» (ADR-004).",
        "Togli BAR_GRAMS da total e dividi per due: questo è il peso che resta da mettere su un lato.",
        "Scorri PLATES_GRAMS dal più pesante: finché il disco corrente sta nel peso che resta, aggiungilo a perSide e sottrailo dal resto. Lo stesso disco può ripetersi.",
        "Se alla fine resta un avanzo, il carico non è componibile: il carico reale è quello effettivamente caricato, arrotondato per difetto (ADR-003). Aggiungi un avviso che mostri la differenza.",
        "Restituisci un esito ok con il carico reale in total e i dischi in perSide."
    ],
      "question": "Prima di scrivere, prova a mano con 142,5 kg: quanti grammi vanno su ogni lato e quali dischi escono dal ciclo, in ordine? E con 21 kg, cosa resta alla fine dello scorrimento?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
