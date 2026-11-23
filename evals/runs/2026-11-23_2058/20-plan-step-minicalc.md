```json
{
  "reading": "Il passo 1 è chiuso: package.json con gli script `test` e `typecheck`, tsconfig e test/smoke.test.ts. Non c'è ancora nessun file in src/. ADR-003 chiede di lavorare in grammi interi, ma il modulo `units` previsto dall'architettura non esiste. Per questo i primi due compiti lo creano: `plates` lavora in grammi e ne ha bisogno. La scomposizione riceve un carico già componibile, perché l'arrotondamento spetta a `loads` (passo successivo). Un carico non componibile qui è quindi un input non valido, non qualcosa da correggere. In questo modo ogni modulo ha una sola responsabilità.",
  "tasks": [
    {
      "title": "Scrivi i test della conversione kg ↔ grammi",
      "todo": "In test/core/units.test.ts, con node:test e node:assert (ADR-005), copri questi casi: 22,5 kg diventano 22500 g, 1,25 kg diventano 1250 g, 0,1 + 0,2 kg diventano 300 g esatti, 142500 g tornano 142,5 kg. Il caso 0,1 + 0,2 è il motivo per cui esiste ADR-003: in virgola mobile la somma non fa esattamente 0,3, e il test deve dimostrare che la conversione restituisce comunque un intero.",
      "signature": null,
      "doneWhen": ["file test/core/units.test.ts"]
    },
    {
      "title": "Implementa la conversione in src/core/units.ts",
      "todo": "Il file contiene solo due funzioni pure (ADR-001). Moltiplicare per 1000 non basta: il risultato in grammi deve essere sempre un intero, anche quando l'input in kg ha un errore di virgola mobile. Chiediti quale operazione garantisce un intero esatto.",
      "signature": "export function kgToGrams(kg: number): number\nexport function gramsToKg(grams: number): number",
      "doneWhen": ["test \"22,5 kg in grammi\" \"1,25 kg in grammi\" \"0,1 + 0,2\" \"142500 g\"", "nessun errore in src/core/units.ts"]
    },
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "In test/core/plates.test.ts, parti dai casi limite delle regole del bootstrap e di ADR-004. Sotto i 20 kg (es. 15 kg): esito di avviso «solo bilanciere» e nessun disco. Esattamente 20 kg: esito ok con lista vuota. Carico non componibile (es. 61 kg): esito non valido. Poi i casi base: 22,5 kg dà [1,25] per lato; 60 kg dà [20]; 142,5 kg dà [25, 25, 10, 1,25], perché i dischi sono illimitati per taglio (ADR-004). In ogni caso ok, verifica anche che 20 kg più due volte la somma di un lato dia il totale. Nei test passa i valori in grammi con kgToGrams.",
      "signature": null,
      "doneWhen": ["file test/core/plates.test.ts"]
    },
    {
      "title": "Definisci tipi e firma di platesPerSide",
      "todo": "In src/core/plates.ts dichiara la lista dei dischi in grammi, dal più grande al più piccolo, e il tipo del risultato con i tre esiti di ADR-004. Usa una union di stringhe per l'esito e niente enum: il type stripping non li supporta (ADR-005). Per ora il corpo della funzione può restare vuoto: l'obiettivo è che `npm run typecheck` passi e che i test compilino, anche se falliscono.",
      "signature": "export type PlatesResult =\n  | { status: \"ok\"; perSideGrams: number[] }\n  | { status: \"warning\"; perSideGrams: []; message: string }\n  | { status: \"invalid\"; message: string };\nexport function platesPerSide(totalGrams: number): PlatesResult",
      "doneWhen": ["file src/core/plates.ts esporta platesPerSide", "nessun errore in src/core/plates.ts"]
    },
    {
      "title": "Implementa la scomposizione per i carichi componibili",
      "todo": "Togli il bilanciere e dividi a metà: ottieni il peso per lato. Poi scorri i dischi dal più grande al più piccolo e usa ogni taglio finché ci sta (algoritmo greedy). Funziona perché ogni disco della lista è componibile con i più piccoli. Tutto in grammi interi (ADR-003).",
      "signature": null,
      "doneWhen": ["test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""]
    },
    {
      "title": "Gestisci i casi anomali come esiti espliciti",
      "todo": "Aggiungi due controlli prima della scomposizione. Sotto il peso del bilanciere restituisci l'avviso «solo bilanciere», senza calcolare dischi negativi. Se il resto per lato non si azzera con i dischi disponibili, restituisci un esito non valido. Niente eccezioni (ADR-004).",
      "signature": null,
      "doneWhen": ["test \"sotto i 20\" \"non componibile\""]
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Fai una review di src/core/units.ts e src/core/plates.ts. Controlla in particolare che non ci siano `console` o `process` nel core (ADR-001) e che nessun valore in kg venga usato nei calcoli (ADR-003).",
      "signature": null,
      "doneWhen": ["a mano"]
    }
  ],
  "question": null
}
```
