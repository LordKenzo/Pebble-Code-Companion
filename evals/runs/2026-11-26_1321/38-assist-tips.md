```json
{
  "tips": [
    {
      "where": "righe 10 e 18",
      "title": "Sotto i 20 kg restituisci ok senza avviso",
      "body": "Con 15 kg, `remaining` alla riga 10 vale (15000 − 20000) / 2 = −2500. Il ciclo non aggiunge dischi e la riga 18 restituisce un `ok` pulito con `perSide` vuoto, quindi il test «15 kg: solo bilanciere, con avviso» è rosso. Il core deve dire esplicitamente che il carico è sotto il bilanciere. Prova così: prima del calcolo controlla se `total` è minore di `BAR`. In quel caso restituisci l'esito «ok con avviso» del tuo `result.ts` (solo bilanciere, nessun disco), senza entrare nel ciclo. Nello stesso punto puoi gestire anche `total ≤ 0`, che va restituito come non valido.",
      "anchor": "ADR-004"
    },
    {
      "where": "righe 10–18",
      "title": "Il resto non componibile viene ignorato",
      "body": "Con 61 kg per lato servono 20500 g. Il ciclo mette un disco da 20000 e lascia `remaining = 500`, che poi sparisce: l'output dichiara `total` 61000, ma sul bilanciere ci sono 60 kg. Qui l'errore finisce direttamente sul bilanciere, ed è il secondo test rosso. Prova così: dopo il ciclo guarda `remaining`. Se non è zero, restituisci «ok con avviso» e riporta il carico reale accanto al target. Attenzione anche ai totali dispari: (61001 − 20000) / 2 non è un numero intero di grammi.",
      "anchor": "ADR-003"
    },
    {
      "where": "riga 21",
      "title": "`loadsFor` senza tipo di ritorno",
      "body": "Così com'è, TypeScript deduce `void` e accetta un array di percentuali modificabile. Fissa subito il contratto del passo 4: percentuali come `readonly number[]` e ritorno `Result<readonly PlannedLoad[]>`. `PlannedLoad` è un'interfaccia con target, carico reale e `PlateLoad`. In questo modo le percentuali fuori dall'intervallo 1–100 diventano un esito non valido già nella firma, e non un'eccezione.",
      "anchor": "ADR-004"
    }
  ]
}
```
