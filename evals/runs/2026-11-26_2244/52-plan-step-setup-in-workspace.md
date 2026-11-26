```json
{
  "reading": "Il progetto è ancora vuoto: ci sono solo bootstrap.md e i file di .pebble, quindi questo passo parte da zero. Prepariamo il progetto Node.js con TypeScript (ADR-001) e Vitest (ADR-004). Alla fine npm test esegue un test di prova che passa. Il test di prova verifica una cosa ovvia: serve solo a provare che gli strumenti funzionano. I tipi Cliente e Contatto e le regole del dominio arrivano nel passo 2, non qui.",
  "tasks": [
    {
      "title": "Inizializzare il progetto npm",
      "todo": "Nella cartella del progetto lancia npm init -y. Il comando crea package.json, il file che descrive il progetto: nome, comandi e dipendenze (le librerie che il tuo codice usa per funzionare).",
      "signature": "",
      "doneWhen": ["file package.json"]
    },
    {
      "title": "Installare TypeScript e Vitest",
      "todo": "Lancia npm install -D typescript vitest @types/node. Il -D le segna come dipendenze di sviluppo: servono a scrivere e provare il codice, non all'app che gira. TypeScript viene da ADR-001, Vitest da ADR-004. @types/node fa capire a TypeScript gli strumenti di Node.js.",
      "signature": "",
      "doneWhen": ["dipendenza typescript vitest @types/node"]
    },
    {
      "title": "Configurare TypeScript",
      "todo": "Crea tsconfig.json, il file di impostazioni di TypeScript. Attiva il controllo rigoroso (strict) e indica src e tests come cartelle da controllare. Pebble ti dà il contenuto completo con una riga di spiegazione per ogni voce (ADR-001, ADR-003).",
      "signature": "",
      "doneWhen": ["file tsconfig.json"]
    },
    {
      "title": "Creare il .gitignore",
      "todo": "Crea .gitignore, la lista dei file che git non deve salvare. Mettici node_modules, cioè le librerie scaricate che si possono sempre reinstallare. Aggiungi anche i file del database dentro data/: contengono i dati dei clienti, che non vanno nel codice (ADR-002).",
      "signature": "",
      "doneWhen": ["file .gitignore"]
    },
    {
      "title": "Aggiungere lo script di test",
      "todo": "In package.json, sotto scripts, cambia la voce test perché lanci Vitest una volta sola e poi si fermi. Così npm test esegue tutti i test della cartella tests/ (ADR-004).",
      "signature": "",
      "doneWhen": ["script test \"vitest run\""]
    },
    {
      "title": "Scrivere il test di prova",
      "todo": "Crea la cartella tests/ con il file tests/setup.test.ts. Dentro scrivi un solo test chiamato \"verifica: il progetto è pronto\", che controlla una cosa sempre vera (per esempio che 1 + 1 fa 2). Poi lancia npm test e guarda che il test diventi verde (ADR-004).",
      "signature": "",
      "doneWhen": ["test \"verifica\""]
    },
    {
      "title": "Rivedere con Pebble",
      "todo": "Apri package.json, tsconfig.json e il test di prova e chiedi una revisione a Pebble. Controlliamo insieme che la base sia pronta per il dominio del passo 2.",
      "signature": "",
      "doneWhen": ["a mano"]
    }
  ],
  "question": "Hai già Node.js installato sul Mac? Nel terminale scrivi node -v e dimmi che numero esce: se il comando non viene trovato, partiamo dall'installazione."
}
```
