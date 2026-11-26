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
      "doc": "Dischi disponibili in grammi, dal più pesante al più leggero. Sono illimitati per taglio (bootstrap › Vincoli, ADR-004)."
    }
  ],
  "types": [
    {
      "doc": "Come caricare il bilanciere. target è il carico richiesto. actual è il carico reale, che non supera mai il target salvo il caso «solo bilanciere» (ADR-003, ADR-004). perSide elenca i dischi da mettere su un lato, dal più pesante.",
      "declaration": "export interface PlateLoad {\n  readonly target: Grams;\n  readonly actual: Grams;\n  readonly perSide: readonly Grams[];\n}"
    }
  ],
  "functions": [
    {
      "doc": "Scompone un carico totale nei dischi per lato. L'arrotondamento è per difetto (ADR-003). Sotto il peso del bilanciere l'esito è «solo bilanciere» con un avviso, mai dischi negativi (ADR-004).",
      "signature": "export function platesFor(total: Grams): Result<PlateLoad>",
      "pseudocode": [
        "Se total non è un numero intero di grammi maggiore di zero, restituisci invalid con un messaggio che spiega il problema (ADR-004).",
        "Se total è minore di BAR_WEIGHT, restituisci ok con perSide vuoto, actual uguale a BAR_WEIGHT e l'avviso «solo bilanciere».",
        "Calcola il peso da mettere su un lato: togli BAR_WEIGHT da total e dividi per due.",
        "Scorri PLATES dal più pesante. Finché il disco corrente sta nel peso che resta per quel lato, aggiungilo a perSide e sottrailo dal resto.",
        "Quello che avanza (meno di 1250 g per lato) non si carica: è l'arrotondamento per difetto. Il carico reale è BAR_WEIGHT più due volte la somma di perSide.",
        "Restituisci ok con target, actual e perSide. Se actual è diverso da target, aggiungi un avviso con la differenza (ADR-003)."
      ],
      "question": "Prova a farlo a mano prima di scrivere codice. Con 142,5 kg, quali dischi metti su ogni lato? Con 23 kg, quanto resta per lato dopo aver tolto il bilanciere e quale carico reale ottieni?"
    }
  ],
  "exampleTest": null,
  "testCases": []
}
```
