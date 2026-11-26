```json
{
  "imports": [
    { "names": ["type Grams"], "from": "./units.ts" },
    { "names": ["type Result"], "from": "./result.ts" }
  ],
  "constants": [
    {
      "name": "BAR",
      "type": "Grams",
      "value": "20000",
      "doc": "Peso del bilanciere in grammi: 20 kg (bootstrap › Vincoli, ADR-003)."
    },
    {
      "name": "PLATES",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Tagli dei dischi disponibili in grammi, dal più pesante. Ogni taglio va montato in coppia, uno per lato, e la quantità è illimitata (bootstrap › Vincoli, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Come caricare il bilanciere. `total` è il carico reale, bilanciere compreso, e può essere più basso del target perché si arrotonda per difetto (ADR-003). `perSide` elenca i dischi di un lato, dal più pesante. Se c'è solo il bilanciere, la lista è vuota.",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale in dischi per lato, con il metodo greedy (prima i dischi più pesanti) e arrotondando per difetto (ADR-003). I casi anomali escono come esito e non come eccezione (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total è minore o uguale a zero, restituisci un esito non valido con un messaggio che spiega perché (ADR-004).",
        "Se total è minore di BAR, restituisci ok con perSide vuoto, total uguale a BAR e un avviso «solo bilanciere». Non calcolare mai dischi negativi.",
        "Togli BAR da total e dividi per due: ottieni il peso da mettere su ciascun lato. Tieni conto che può non essere un multiplo di 1250.",
        "Scorri PLATES dal più pesante: finché il disco entra nel peso che resta per quel lato, aggiungilo a perSide e sottrailo dal resto.",
        "Ciò che resta alla fine è la parte non componibile. Il carico reale è BAR più due volte la somma di perSide, e non supera mai total.",
        "Restituisci ok con total uguale al carico reale e perSide."
      ],
      "question": "Prova a mano con 143 kg (143000 g). Quanti grammi devi mettere per lato? Quali dischi sceglie il greedy e quanto resta alla fine? Che carico reale restituisci? E con 22,5 kg cosa contiene perSide?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
