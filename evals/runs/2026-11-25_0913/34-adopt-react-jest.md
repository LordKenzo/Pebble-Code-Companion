```json
{
  "reading": "todo-lite è una piccola lista di cose da fare in React 18 e TypeScript, avviata con Vite e testata con Jest (ts-jest, ambiente jsdom). Il codice è diviso in tre cartelle: componenti, store con funzioni pure, client per l'API. Ci sono 42 commit. I test passano 6 su 7: quello rosso c'era già prima di Pebble ed è un buon primo passo.",
  "name": "todo-lite",
  "what": "Una lista di cose da fare minimale in React: aggiungere un todo, segnarlo come fatto, salvarlo nel browser e caricarlo da un'API.",
  "stack": [
    "React 18.3 (react, react-dom)",
    "TypeScript 5.6",
    "Vite 5.4 per sviluppo e build (`npm run dev`, `npm run build` con `tsc` prima di `vite build`)",
    "Jest 29 con ts-jest per i test (`npm test`)",
    "jest-environment-jsdom per simulare il browser nei test",
    "@testing-library/react 16 (installata, uso non ancora visto)",
    "localStorage per la persistenza",
    "fetch nativo per le chiamate HTTP"
  ],
  "constraints": [
    "Lo stato dei todo si aggiorna in modo immutabile: le funzioni dello store ricevono una lista e ne restituiscono una nuova (todos.ts righe 5 e 9)",
    "Il titolo di un todo viene ripulito con trim e un titolo vuoto non è accettato (todos.ts riga 4)",
    "Gli id dei todo sono generati con crypto.randomUUID() (todos.ts riga 5)",
    "Il client API non lancia eccezioni: restituisce sempre un Result<T> con ok true/false (client.ts righe 3-14)",
    "I file di test stanno accanto al file che testano, con suffisso .test.ts (src/store/todos.test.ts, src/api/client.test.ts)",
    "Il tipo Todo è definito nello store e importato dall'API con `import type` (client.ts riga 1)"
  ],
  "unknowns": [
    "Il test rosso 'saveTodos: persists to localStorage' legge la chiave \"todo-list\" (todos.test.ts riga 16), mentre saveTodos scrive su \"todos\" (todos.ts riga 13). Non è chiaro quale delle due sia quella voluta.",
    "Esiste saveTodos ma non si vede una funzione che rilegga i todo da localStorage: non è chiaro se il caricamento sia pianificato o avvenga altrove (App.tsx non è stato letto).",
    "Il TODO in client.ts riga 5 ('retry once on network errors') non è ancora risolto.",
    "I componenti TodoList e TodoItem non hanno test, anche se @testing-library/react è già installata.",
    "Il contenuto di client.test.ts e di jest.config.js non è stato letto: non si sa quali casi di fetchTodos siano già coperti né come sia configurato ts-jest.",
    "In package.json non compaiono @types/react, @types/react-dom e @types/jest: non è chiaro da dove arrivino i tipi per JSX e per describe/it/expect."
  ],
  "decisions": [
    {
      "title": "React con Vite come base dell'interfaccia",
      "context": "Serviva un modo per costruire e servire una piccola interfaccia web.",
      "decision": "L'interfaccia è scritta in React 18 con TypeScript. Vite gestisce il server di sviluppo e la build, e `tsc` controlla i tipi prima della build.",
      "consequences": "Sviluppo veloce con ricaricamento immediato. Il controllo dei tipi avviene solo in `npm run build`, non durante `npm run dev`.",
      "evidence": [
        "package.json righe 5-6 (script dev e build)",
        "package.json riga 9 (react, react-dom)",
        "src/main.tsx, src/App.tsx"
      ]
    },
    {
      "title": "Jest con ts-jest e jsdom per i test",
      "context": "Il progetto aveva bisogno di test automatici su codice TypeScript che usa API del browser (localStorage, fetch).",
      "decision": "I test girano con Jest 29: ts-jest traduce TypeScript, jest-environment-jsdom simula il browser. I nuovi test usano Jest, non un altro runner.",
      "consequences": "Le API del browser sono disponibili nei test senza configurazione extra. Vite e Jest restano due pipeline separate, con due configurazioni da tenere allineate.",
      "evidence": [
        "package.json riga 7 (\"test\": \"jest\")",
        "package.json righe 13-16",
        "jest.config.js",
        "git: 'chore: add jest'"
      ]
    },
    {
      "title": "Cartelle per responsabilità: components, store, api",
      "context": "Bisognava separare l'interfaccia, la logica dei todo e la comunicazione con il server.",
      "decision": "src/components contiene i componenti React, src/store le funzioni sui todo e la persistenza, src/api il client HTTP. Il tipo Todo vive nello store e l'API lo importa.",
      "consequences": "La logica dello store si testa senza React. L'api dipende dallo store per il tipo, quindi lo store non deve importare l'api, per evitare dipendenze circolari.",
      "evidence": [
        "elenco file: src/components/, src/store/, src/api/",
        "src/api/client.ts riga 1"
      ]
    },
    {
      "title": "Store a funzioni pure e immutabili",
      "context": "Serviva un modo per modificare la lista dei todo che fosse prevedibile e facile da testare.",
      "decision": "Lo stato non sta in una classe né in una libreria di gestione dello stato: è una lista Todo[] passata a funzioni che ne restituiscono una copia modificata.",
      "consequences": "Test semplici, si confrontano input e output. La persistenza (saveTodos) invece ha un effetto collaterale e va tenuta separata dalle funzioni pure.",
      "evidence": [
        "src/store/todos.ts righe 3-10 (addTodo, toggleTodo)",
        "src/store/todos.ts righe 12-14 (saveTodos)"
      ]
    },
    {
      "title": "Test affiancati al codice",
      "context": "Bisognava decidere dove mettere i file di test.",
      "decision": "Ogni modulo ha il suo file NomeModulo.test.ts nella stessa cartella. I nomi dei test iniziano con la funzione testata (\"addTodo: …\").",
      "consequences": "È immediato vedere quali moduli hanno test e quali no. La cartella src/components, per ora, non ne ha.",
      "evidence": [
        "src/store/todos.test.ts righe 4, 7, 10, 14",
        "src/api/client.test.ts"
      ]
    }
  ],
  "conflicts": [
    {
      "topic": "Gestione degli errori",
      "question": "Lo store lancia un'eccezione per un titolo vuoto (todos.ts riga 4), mentre il client API restituisce un Result con ok: false (client.ts righe 3-14): per il codice nuovo quale delle due regole vuoi seguire?"
    }
  ],
  "layers": "Tre livelli. In alto l'interfaccia (src/components e App.tsx), che usa lo store e l'api. Lo store (src/store) contiene il tipo Todo, le funzioni pure e la persistenza su localStorage, e non dipende da nessun altro livello. L'api (src/api) parla con il server e dipende dallo store solo per il tipo Todo.",
  "folders": "src/main.tsx: punto di ingresso, monta l'app.\nsrc/App.tsx: componente radice.\nsrc/components/: componenti React (TodoList, TodoItem).\nsrc/store/: tipo Todo, funzioni pure sulla lista, salvataggio su localStorage, con i test.\nsrc/api/: client HTTP che restituisce Result<T>, con i test.\njest.config.js: configurazione di Jest (ts-jest, jsdom).",
  "paths": [
    "Far tornare verde 'saveTodos: persists to localStorage': scegliere una sola chiave di localStorage (\"todos\" o \"todo-list\") e allineare il codice o il test. Il test era già rosso all'adozione.",
    "Aggiungere una funzione che rilegga i todo da localStorage e un test che salvi una lista e la ritrovi uguale (andata e ritorno).",
    "Risolvere il TODO di client.ts riga 5: prima un test che simuli un errore di rete seguito da una risposta valida e si aspetti ok: true, poi il retry.",
    "Scrivere il primo test di componente per TodoItem con @testing-library/react: cliccando il todo, risulta segnato come fatto."
  ],
  "question": "Per il test rosso, qual è la chiave giusta in localStorage: \"todos\" come nel codice o \"todo-list\" come nel test? Se ci sono già utenti con dati salvati, cambiare la chiave nel codice farebbe perdere i loro todo."
}
```
