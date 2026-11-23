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
      "doc": "Peso del bilanciere: 20 kg (bootstrap › Vincoli), in grammi interi (ADR-003)."
    },
    {
      "name": "PLATES_GRAMS",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Dischi disponibili per lato, dal più pesante al più leggero (bootstrap › Vincoli). Illimitati per taglio (ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Carico composto: il totale reale sul bilanciere e i dischi da mettere su UN lato, dal più pesante al più leggero (ADR-003, ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale (già arrotondato a un valore componibile) nei dischi per lato. Funzione pura (ADR-001); i casi anomali sono esiti, non eccezioni (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un intero di grammi oppure è ≤ 0, restituisci un esito non valido con un messaggio chiaro (ADR-004).",
        "Se total è sotto BAR_GRAMS (oppure uguale), restituisci ok con perSide vuoto, total pari a BAR_GRAMS e, solo se era sotto, l'avviso «solo bilanciere» (ADR-004).",
        "Togli BAR_GRAMS da total e dividi a metà: è il peso da caricare per lato. Se la metà non è intera, il carico non è componibile: esito non valido.",
        "Scorri PLATES_GRAMS dal primo all'ultimo: finché il disco corrente sta nel peso per lato rimasto, aggiungilo a perSide e sottrailo dal rimanente.",
        "Alla fine, se resta qualcosa (non multiplo di 1250 g), restituisci un esito non valido: la CLI deve arrotondare prima (ADR-003).",
        "Altrimenti restituisci ok con total e perSide."
      ],
      "question": "Prima di scrivere, calcola a mano 142,5 kg: quanti grammi per lato ottieni dopo aver tolto il bilanciere e diviso a metà, e quali dischi escono scorrendo la lista? Poi chiediti: 20 kg esatti devono dare l'avviso «solo bilanciere» oppure no?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
