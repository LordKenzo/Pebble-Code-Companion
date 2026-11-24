```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR_WEIGHT",
      "type": "Grams",
      "value": "20000",
      "doc": "Peso del bilanciere in grammi: 20 kg (bootstrap › Vincoli, ADR-003)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Dischi disponibili per lato, in grammi e dal più pesante al più leggero. Sono illimitati per taglio (bootstrap › Vincoli, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Come caricare il bilanciere. `total` è il carico reale componibile, bilanciere compreso. `perSide` elenca i dischi di un lato, dal più pesante (ADR-003, ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale in dischi per lato. Non supera mai il totale richiesto (ADR-003). Sotto i 20 kg restituisce solo bilanciere con un avviso, mai dischi negativi (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un intero positivo, restituisci un esito non valido con un messaggio chiaro (ADR-004).",
        "Se total è sotto BAR_WEIGHT, restituisci un esito ok con perSide vuoto, total uguale a BAR_WEIGHT e l'avviso «solo bilanciere».",
        "Togli BAR_WEIGHT da total e dividi per due: ottieni quanto peso va su ogni lato.",
        "Scorri PLATES dal più pesante. Finché il disco corrente sta nel peso rimasto per lato, aggiungilo a perSide e scala il rimanente.",
        "Quello che resta alla fine è meno di 1250 g e non è componibile, quindi va scartato (arrotondamento per difetto, ADR-003).",
        "Ricalcola il total reale come BAR_WEIGHT più due volte la somma di perSide, e restituiscilo con ok."
      ],
      "question": "Fai a mano 142,5 kg: quanti grammi restano per lato dopo aver tolto il bilanciere, e quali dischi scegli uno dopo l'altro? Poi prova 21 kg: il total reale che restituisci deve essere 20 kg o 21 kg?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
