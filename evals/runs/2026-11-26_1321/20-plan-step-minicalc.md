{
  "reading": "Il setup è fatto: package.json con gli script test e typecheck, tsconfig e uno smoke test che passa. Non c'è ancora niente in src/, quindi questo è il primo modulo del core. La scomposizione lavora in grammi interi (ADR-003), perciò serve prima il tipo Grams di core/units: lo introduco qui solo per quanto serve a plates. Con dischi illimitati per taglio (ADR-004) basta prendere ogni volta il disco più grande che ci sta. I casi anomali tornano come esito, non come eccezione (ADR-004). Il calcolo dei carichi a percentuale e l'arrotondamento restano al passo successivo: qui il carico arriva già componibile.",
  "tasks": [
    {
      "title": "Scrivi i test della scomposizione in dischi",
      "todo": "In test/core/plates.test.ts, con node:test e node:assert (ADR-005), scrivi i casi: \"15 kg: solo bilanciere, con avviso\", \"0 kg: non valido\", \"61 kg: non componibile, non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". Per ora devono fallire, perché il modulo non esiste ancora.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci il tipo Grams e le conversioni",
      "todo": "In src/core/units.ts dichiara un tipo Grams per i grammi interi e due funzioni: da kg a grammi e da grammi a kg (ADR-003). Il modulo deve restare puro, quindi senza console e senza process (ADR-001). Per Grams usa un alias o un branded type, non enum: il type stripping non li supporta (ADR-005).",
      "signature": "export function kgToGrams(kg: number): Grams; export function gramsToKg(g: Grams): number",
      "doneWhen": [
        "file src/core/units.ts esporta kgToGrams",
        "file src/core/units.ts esporta gramsToKg"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "In src/core/plates.ts: togli il bilanciere, dividi per due e scorri i dischi dal più grande al più piccolo, prendendo ogni disco finché ci sta. La lista dei dischi e il peso del bilanciere vanno in costanti con nome, in grammi (bootstrap › Vincoli, ADR-003). Il risultato è un'unione di esiti ok, avviso e non valido (ADR-004).",
      "signature": "export function platesPerSide(total: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i casi anomali come esiti",
      "todo": "Un carico sotto i 20 kg dà «solo bilanciere» con un avviso e mai dischi negativi. Un carico ≤ 0, o non multiplo di 2,5 kg totali, dà un esito non valido con un messaggio (ADR-004, ADR-003). Controlla questi casi prima della scomposizione, non dentro il ciclo.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"0 kg\" \"61 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Lancia npm test e npm run typecheck, poi chiedi una revisione di src/core/plates.ts e src/core/units.ts. Controlla in particolare che nessun calcolo usi kg in virgola mobile (ADR-003).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "I dischi per lato li vuoi come lista ripetuta (25, 25, 10, 1,25) o come conteggio per taglio (2×25, 1×10, 1×1,25)? Cambia il tipo di PlatesResult e il modo in cui scrivi i test."
}
