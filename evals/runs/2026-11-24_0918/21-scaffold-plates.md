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
      "doc": "Dischi disponibili in grammi, dal più pesante al più leggero. Uno per lato, quantità illimitata per taglio (bootstrap › Vincoli, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Scomposizione di un carico: il totale reale sul bilanciere e i dischi da mettere su un lato, dal più pesante (ADR-003: grammi interi; ADR-004: dischi illimitati).",
      "declaration": "export interface PlateLoad {\n  readonly total: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Dato un carico totale in grammi, già arrotondato per difetto (ADR-003), restituisce i dischi da mettere per lato. Sotto il peso del bilanciere l'esito è «solo bilanciere» con un avviso, mai dischi negativi (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total è minore o uguale a BAR, restituisci un esito ok con perSide vuoto, total uguale a BAR e un avviso «solo bilanciere» (ADR-004).",
        "Togli BAR da total e dividi il resto per due: è il peso da caricare su un lato, sempre in grammi interi.",
        "Scorri PLATES dal primo all'ultimo: finché il disco corrente entra nel peso rimasto per lato, aggiungilo a perSide e sottrailo dal rimanente.",
        "Alla fine controlla il rimanente: se non è zero, il carico non è componibile con i dischi disponibili e restituisci un esito non valido con un messaggio chiaro.",
        "Altrimenti restituisci un esito ok con total e la lista perSide costruita."
      ],
      "question": "Fai a mano 142,5 kg: quanti grammi restano per lato dopo aver tolto il bilanciere, e quali dischi prendi in ordine? E se arrivasse 21 kg, cosa dovrebbe succedere al rimanente?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
