```json
{
  "reading": "Il passo 1 è chiuso: package.json con gli script `test` e `typecheck`, tsconfig.json e test/smoke.test.ts che passa. Non esiste ancora codice in src/. Lo script di test usa il glob \"test/**/*.test.ts\", quindi un file in test/core/ viene già raccolto senza toccare la configurazione. Questo passo riguarda solo la scomposizione in dischi di un carico già componibile. Arrotondamento e percentuali appartengono ai passi successivi. Per ADR-003 la funzione lavora in grammi interi: nei test passa i valori già in grammi (22,5 kg diventa 22500). Così il passo non dipende dalla conversione kg ↔ grammi, che arriverà con il modulo units completo.",
  "tasks": [
    {
      "title": "Scrivi i test della scomposizione in dischi",
      "todo": "Crea test/core/plates.test.ts con node:test e node:assert (ADR-005). Importa da ../../src/core/plates.ts, con l'estensione .ts richiesta dal type stripping. Copri prima i casi anomali di ADR-004: \"15 kg: solo bilanciere, con avviso\", \"21 kg: non componibile, esito non valido\". Poi i casi base: \"20 kg: solo bilanciere, nessun disco\", \"22,5 kg: un 1,25 per lato\", \"60 kg: un 20 per lato\", \"142,5 kg: 25, 25, 10, 1,25 per lato\". All'inizio i test saranno rossi: è previsto.",
      "signature": null,
      "doneWhen": [
        "file test/core/plates.test.ts"
      ]
    },
    {
      "title": "Definisci i tipi di grammi e risultato",
      "todo": "In src/core/units.ts dichiara il tipo Grams e l'elenco dei dischi disponibili, in grammi e senza decimali (ADR-003). In src/core/plates.ts dichiara il tipo del risultato con un campo esito come union di stringhe, per esempio 'ok' | 'avviso' | 'non-valido' (ADR-004; niente enum, ADR-005). Per l'esito ok il risultato porta la lista dei dischi per lato, per gli altri esiti un messaggio.",
      "signature": "export type PlatesResult = { outcome: 'ok'; perSide: Grams[] } | { outcome: 'avviso'; perSide: Grams[]; message: string } | { outcome: 'non-valido'; message: string }",
      "doneWhen": [
        "file src/core/units.ts esporta Grams",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Implementa la scomposizione per lato",
      "todo": "In src/core/plates.ts scrivi la funzione pura (ADR-001: niente console né process). Togli il peso del bilanciere, dividi il resto per due e scegli i dischi dal più pesante al più leggero finché il resto non arriva a zero. Prima di scrivere il codice, verifica a mano il caso 142,5 kg.",
      "signature": "export function platesPerSide(load: Grams): PlatesResult",
      "doneWhen": [
        "test \"20 kg\" \"22,5 kg\" \"60 kg\" \"142,5 kg\""
      ]
    },
    {
      "title": "Gestisci il carico sotto il bilanciere e quello non componibile",
      "todo": "Sotto i 20 kg l'esito è «solo bilanciere» con avviso e una lista di dischi vuota, mai dischi negativi (ADR-004). Se dopo aver usato tutti i dischi resta un avanzo, l'esito è non valido, perché la funzione accetta solo carichi già componibili (ADR-003).",
      "signature": null,
      "doneWhen": [
        "test \"15 kg\" \"21 kg\"",
        "nessun errore in src/core/plates.ts"
      ]
    },
    {
      "title": "Review con Pebble",
      "todo": "Apri src/core/plates.ts e chiedi una review. Controlla che il core non importi nulla dalla CLI (ADR-001) e che `npm run typecheck` non dia errori.",
      "signature": null,
      "doneWhen": [
        "a mano"
      ]
    }
  ],
  "question": "Un carico non componibile come 21 kg può arrivare a platesPerSide solo per un bug, perché l'arrotondamento a monte (ADR-003) dovrebbe impedirlo. Vuoi che lo segnali come esito non valido, come previsto qui, o preferisci che la funzione lo consideri impossibile e non lo gestisca?"
}
```
