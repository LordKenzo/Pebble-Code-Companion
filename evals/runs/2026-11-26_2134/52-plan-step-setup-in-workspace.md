```json
{
  "reading": "Il progetto è vuoto: ci sono solo bootstrap.md e i file di Pebble in .pebble/. Partiamo quindi da zero, nella cartella già aperta nell'editor, senza crearne un'altra. In questo passo prepariamo gli attrezzi, senza ancora scrivere la logica dei clienti. Gli attrezzi sono TypeScript (ADR-001), cioè JavaScript con i tipi, che aiuta a scoprire gli errori prima di eseguire il codice, e Vitest (ADR-004), il programma che esegue i test. Un test è un piccolo pezzo di codice che controlla che un altro pezzo faccia quello che deve. Alla fine npm test dovrà passare con un test finto, che serve solo a dimostrare che tutto è collegato bene. Per i comandi serve Node.js installato sul Mac: è il programma che esegue JavaScript fuori dal browser e porta con sé npm, lo strumento che scarica le librerie.",
  "tasks": [
    {
      "title": "Crea il file package.json",
      "todo": "Nel terminale dell'editor, nella cartella del progetto, esegui npm init -y. Il comando crea package.json, la carta d'identità del progetto: contiene il nome, le librerie usate e i comandi. Poi crea a mano un file .gitignore con due righe, node_modules/ e data/*.db. Così le librerie scaricate e il database (ADR-002) non finiscono nella cronologia del codice (best practice).",
      "signature": "",
      "doneWhen": "file package.json"
    },
    {
      "title": "Installa TypeScript e Vitest",
      "todo": "Esegui npm install -D typescript vitest @types/node. Il -D le segna come dipendenze di sviluppo: sono librerie che servono a te mentre scrivi e provi il codice, non all'app quando gira. @types/node insegna a TypeScript com'è fatto Node.js (ADR-001, ADR-004).",
      "signature": "",
      "doneWhen": "dipendenza typescript vitest @types/node"
    },
    {
      "title": "Configura TypeScript",
      "todo": "Crea tsconfig.json, il file che dice a TypeScript come controllare il codice. Attiva la modalità strict, che è più severa e trova più errori. Imposta src/ e tests/ come cartelle da controllare (ADR-003, ADR-004). Se vuoi, chiedimi il contenuto completo del file: è configurazione, te lo do intero.",
      "signature": "",
      "doneWhen": "file tsconfig.json"
    },
    {
      "title": "Aggiungi lo script di test",
      "todo": "In package.json, dentro scripts, cambia la riga \"test\" in \"vitest run\". Uno script è un comando con un nome breve: così npm test avvia Vitest una volta e mostra i risultati (ADR-004).",
      "signature": "",
      "doneWhen": "script test \"vitest run\""
    },
    {
      "title": "Scrivi il test finto",
      "todo": "Crea la cartella tests/ e dentro un file setup.test.ts con un solo test, dal nome esatto \"progetto pronto: 1 + 1 fa 2\". Il test controlla una cosa ovvia, perché qui serve solo a vedere che Vitest trova i test e li esegue (ADR-004). Poi lancia npm test e controlla che sia verde.",
      "signature": "",
      "doneWhen": "test \"progetto pronto\""
    },
    {
      "title": "Rivedi con Pebble",
      "todo": "Apri package.json e tsconfig.json e chiedimi una revisione. Controlliamo insieme che la base sia solida prima di scrivere i tipi Cliente e Contatto nel passo 2.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Hai già Node.js sul Mac? Se scrivi node -v nel terminale, che numero di versione ti risponde?"
}
```
