```json
{
  "reading": "Il passo 1 è chiuso: package.json con gli script `test` e `typecheck`, tsconfig.json e test/smoke.test.ts già passano. In src/ non c'è ancora niente, quindi questo passo crea i primi due file del core, src/core/units.ts per il tipo Grams e src/core/plates.ts per la scomposizione. Per ADR-003 la funzione lavora in grammi interi: i test passano i carichi in grammi (22,5 kg = 22500), senza funzioni di conversione kg ↔ grammi, che restano fuori da questo passo. Per ADR-004 il risultato è un valore con esito, non un'eccezione. Sotto i 20 kg l'esito è «solo bilanciere» con avviso.",
  "tasks": [
    {
      "title": "Scrivi i test dei dischi per lato",
      "todo": "In test/core/plates.test.ts, con node:test e node:assert (ADR-005), scrivi questi casi, partendo dai bordi: \"15 kg: solo bilanciere, con avviso\", \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". Controlla sia l'esito sia la lista dei dischi, in grammi (ADR-003). All'inizio i test saranno rossi.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci tipi e costanti dei dischi",
      "todo": "In src/core/units.ts dichiara il tipo Grams. In src/core/plates.ts dichiara il peso del bilanciere, i tagli dei dischi disponibili dal più pesante e il tipo del risultato con i suoi esiti (ADR-003, ADR-004, bootstrap › Vincoli). Usa una union di stringhe per l'esito, perché il type stripping non accetta `enum` (ADR-005).",
      "signature": "// src/core/units.ts\nexport type Grams = number;\n\n// src/core/plates.ts\nexport declare const BAR: Grams;\nexport declare const PLATES: readonly Grams[];\nexport type PlatesResult =\n  | { outcome: 'ok'; perSide: Grams[] }\n  | { outcome: 'bar-only'; perSide: []; warning: string }\n  | { outcome: 'invalid'; error: string };",
      "doneWhen": [
        "file src/core/units.ts exports Grams",
        "file src/core/plates.ts exports PlatesResult",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa platesPerSide per i carichi componibili",
      "todo": "Togli il bilanciere dal carico, dividi il resto per due e scomponi ogni lato con i tagli disponibili. I dischi sono illimitati per taglio (ADR-004). La funzione resta pura, senza console e senza process (ADR-001).",
      "signature": "export function platesPerSide(load: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\"",
        "file src/core/plates.ts exports platesPerSide"
      ]
    },
    {
      "title": "Gestisci il carico sotto il bilanciere",
      "todo": "Quando il carico è sotto i 20 kg, platesPerSide restituisce l'esito «solo bilanciere» con un avviso esplicito, mai dischi negativi né una lista vuota spacciata per ok (ADR-004).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Revisione con Pebble",
      "todo": "Fai rivedere a Pebble src/core/plates.ts e i suoi test: purezza del core (ADR-001), grammi interi (ADR-003), esiti espliciti (ADR-004).",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Se platesPerSide riceve un carico non componibile (per esempio 23 kg, che non è multiplo di 2,5), deve restituire l'esito «non valido» oppure possiamo dare per scontato che arrivi sempre già arrotondato dal modulo loads?"
}
```
