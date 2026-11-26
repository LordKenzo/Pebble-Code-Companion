```json
{
  "reading": "Per ora il progetto contiene solo bootstrap.md e la cartella .pebble: non c'è ancora codice e nessuna parte di questo passo è fatta. Creeremo il pacchetto SupportCore direttamente nella cartella del progetto, quella aperta nell'editor. Un pacchetto è una raccolta di codice Swift con un file che lo descrive, Package.swift. Il comando 'swift package init' crea da solo Package.swift, il file di partenza in Sources/SupportCore, un test di esempio in Tests/SupportCoreTests e un .gitignore, cioè l'elenco dei file che git deve ignorare. Quindi non servono passi per creare questi file a mano. Le versioni minime di macOS 14 e Xcode 15 (ADR-001) contano già adesso, perché decidono quali strumenti hai sul Mac.",
  "tasks": [
    {
      "title": "Crea il pacchetto SupportCore",
      "todo": "Apri il terminale nella cartella del progetto. Lancia 'swift --version' per vedere quale versione di Swift hai: serve almeno la 5.9, quella di Xcode 15 (ADR-001). Poi lancia 'swift package init --type library --name SupportCore'. 'library' vuol dire codice che altri programmi usano, senza finestre: qui sarà la logica separata dall'app (ADR-002).",
      "signature": "",
      "doneWhen": "file Package.swift"
    },
    {
      "title": "Fai passare il test di esempio",
      "todo": "Nella stessa cartella lancia 'swift test' (ADR-003). La prima volta Swift compila tutto, cioè traduce il codice in un programma, e può metterci un minuto. Alla fine cerca la riga che dice che i test sono passati. Il nome del test di esempio cambia con la versione di Swift: con Swift 6 si chiama 'example', con le versioni precedenti 'testExample'.",
      "signature": "",
      "doneWhen": "a mano"
    },
    {
      "title": "Rivedi con Pebble",
      "todo": "Apri Package.swift e il file di test creato dal comando e chiedi a Pebble di rileggerli con te. Così capisci a cosa serve ogni riga prima di aggiungere il modello della chiamata nel passo 2.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Che cosa stampa 'swift --version' sul tuo Mac? Da lì capisco se il test di esempio usa Swift Testing o XCTest e come preparare i prossimi passi."
}
```
