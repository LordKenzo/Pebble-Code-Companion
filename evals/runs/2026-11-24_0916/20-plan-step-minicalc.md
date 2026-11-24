```json
{
  "reading": "Il passo 1 è chiuso: ci sono package.json, tsconfig.json e il test di prova in test/smoke.test.ts, ma ancora nessun file in src/. Questo passo crea i primi due moduli del core previsti dall'architettura. Il primo è src/core/units.ts, perché ADR-003 chiede di lavorare in grammi interi. Il secondo è src/core/plates.ts, che fa la scomposizione per lato. Lo script test di package.json cerca \"test/**/*.test.ts\", quindi i nuovi test vanno in test/core/ e vengono raccolti senza cambiare la configurazione. Il type stripping di Node (ADR-005) vuole gli import con estensione .ts e union di stringhe al posto degli enum.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). Prima i casi limite del bootstrap, poi quelli normali: \"15 kg: solo bilanciere, con avviso\", \"0 kg: non valido\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"100 kg: un 25 e un 15 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\", \"22,5 kg in grammi: 22500\". I test confrontano l'esito (ADR-004) e la lista dei dischi, non stringhe stampate (ADR-001).",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Crea il tipo Grammi e le conversioni",
      "todo": "In src/core/units.ts definisci il tipo per i grammi interi e le due conversioni kg ↔ grammi (ADR-003). Il core lavora solo in grammi e converte in kg solo ai bordi. Chiediti cosa succede convertendo 1,25 kg: il risultato deve essere un intero esatto.",
      "signature": "export function kgInGrammi(kg: number): Grammi",
      "doneWhen": [
        "file src/core/units.ts exports kgInGrammi",
        "test \"22,5 kg in grammi\""
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "In src/core/plates.ts togli il bilanciere dal carico, dividi per due e riempi ogni lato partendo dal disco più grande. Assumi dischi illimitati per taglio, come dice ADR-004. Dischi e bilanciere sono costanti in grammi presi dal bootstrap. Il risultato è un oggetto con esito e dischi, senza eccezioni (ADR-004).",
      "signature": "export function dischiPerLato(carico: Grammi): RisultatoDischi",
      "doneWhen": [
        "file src/core/plates.ts exports dischiPerLato",
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"100 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci i carichi sotto il bilanciere e non validi",
      "todo": "Sotto i 20 kg l'esito è «solo bilanciere» con avviso e mai dischi negativi. Un carico ≤ 0 è non valido (ADR-004). Controlla che questi casi siano gestiti prima del calcolo, così la scomposizione lavora solo su input sensati.",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"0 kg\"",
        "no errors in src/core/plates.ts"
      ]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Apri src/core/plates.ts e chiedi una review. Verifica che il modulo non usi console né process (ADR-001) e che i numeri non escano mai dai grammi interi (ADR-003).",
      "signature": null,
      "doneWhen": [
        "manual"
      ]
    }
  ],
  "question": "Se a dischiPerLato arriva un carico non componibile (per esempio 61 kg), deve restituire un esito non valido o arrotondare per difetto da sola? L'arrotondamento di ADR-003 sembra compito di loads, ma serve deciderlo prima di scrivere i test."
}
```
