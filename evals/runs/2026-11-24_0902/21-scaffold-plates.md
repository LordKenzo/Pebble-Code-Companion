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
      "doc": "Peso del bilanciere in grammi (bootstrap › Vincoli: 20 kg; ADR-003: grammi interi)."
    },
    {
      "name": "PLATES_GRAMS",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Tagli dei dischi disponibili in grammi, dal più pesante al più leggero. Sono illimitati per taglio (bootstrap › Vincoli, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Come caricare il bilanciere: il totale realmente caricato e i dischi da mettere su UN lato, dal più pesante al più leggero. Gli avvisi (es. «solo bilanciere») stanno nei warnings del Result (ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale (in grammi) nei dischi da mettere per lato. Funzione pura, niente console né process (ADR-001). I casi anomali sono esiti espliciti, non eccezioni (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un intero positivo, restituisci un esito non valido con un messaggio chiaro (ADR-004).",
        "Se total è uguale o sotto BAR_GRAMS, restituisci un esito ok con perSide vuoto e total uguale a BAR_GRAMS, e se total è sotto aggiungi l'avviso «solo bilanciere» (ADR-004: mai dischi negativi).",
        "Togli BAR_GRAMS da total e dividi il resto per due: è il peso da mettere su ciascun lato.",
        "Scorri PLATES_GRAMS dal più pesante: finché il peso rimasto per lato è almeno quel disco, aggiungi il disco a perSide e sottrailo dal peso rimasto.",
        "Se alla fine il peso rimasto per lato non è zero, il carico non è componibile: restituisci un esito non valido (l'arrotondamento per difetto dell'ADR-003 va fatto prima di chiamare platesFor).",
        "Altrimenti restituisci un esito ok con total e perSide."
      ],
      "question": "Prima di scrivere, calcola a mano 142,5 kg: quanti grammi restano per lato dopo aver tolto il bilanciere, e quali dischi esci scorrendo dal 25 in giù? Poi chiediti: con 22,5 kg, il peso per lato è un multiplo del disco più piccolo?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
