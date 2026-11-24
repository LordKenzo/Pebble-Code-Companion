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
      "doc": "Peso del bilanciere: 20 kg, espresso in grammi interi (bootstrap › Vincoli, ADR-003)."
    },
    {
      "name": "PLATES_GRAMS",
      "type": "readonly Grams[]",
      "value": "[25000, 20000, 15000, 10000, 5000, 2500, 1250]",
      "doc": "Dischi disponibili in grammi, dal più pesante al più leggero. Sono illimitati per taglio (bootstrap › Vincoli, ADR-004)."
    },
    {
      "name": "MAX_LOAD_GRAMS",
      "type": "Grams",
      "value": "999000",
      "doc": "Limite superiore dei carichi operativi previsti, 999 kg (ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Scomposizione di un carico: il totale reale sul bilanciere e i dischi da mettere su ciascun lato, dal più pesante (ADR-003, ADR-004).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Dato un carico totale in grammi, già arrotondato per difetto, restituisce i dischi per lato. È una funzione pura, senza console né process (ADR-001). I casi anomali sono esiti espliciti, non eccezioni (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un intero positivo o supera MAX_LOAD_GRAMS, restituisci un esito non valido con un messaggio chiaro (ADR-004).",
        "Se total è minore o uguale a BAR_GRAMS, restituisci ok con un PlateLoad che contiene solo il bilanciere (perSide vuoto). Se total è sotto BAR_GRAMS, aggiungi l'avviso «solo bilanciere» e non produrre mai dischi negativi.",
        "Togli BAR_GRAMS da total e dividi il resto per due: ottieni i grammi da caricare su ogni lato.",
        "Scorri PLATES_GRAMS dal più pesante: finché il disco sta nel resto del lato, aggiungilo a perSide e sottrailo dal resto.",
        "Alla fine controlla il resto. Se è zero, restituisci ok con total e perSide. Se non è zero, il carico non era componibile e va segnalato come esito esplicito."
      ],
      "question": "Prova a mano con 142,5 kg: quanti grammi vanno su ogni lato e quali dischi escono, in ordine? E con 21 kg, cosa resta dopo l'ultimo disco? È un errore dell'input oppure un compito che spetta all'arrotondamento?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
