```json
{
  "reading": "Ho letto il manifest, lo store dei todo, il client API e i test dello store. È un progetto piccolo e ordinato: lo store è fatto di funzioni pure su liste che non vengono mai modificate, il client API restituisce un risultato esplicito invece di lanciare errori, e i test stanno accanto al codice. C'è un test rosso già prima del mio arrivo: `saveTodos` scrive con una chiave e il test ne legge un'altra. I due moduli gestiscono gli errori in due modi diversi, ed è l'unica vera incoerenza che vedo. Non ho visto il contenuto di `jest.config.js`, dei componenti e di `client.test.ts`, quindi non ne descrivo le scelte.",
  "name": "todo-lite",
  "what": "Una piccola lista di cose da fare in React: si aggiungono todo, si segnano come fatti, si salvano nel browser con localStorage e si caricano da un'API remota.",
  "stack": [
    "React 18 (react, react-dom)",
    "TypeScript 5.6",
    "Vite 5 per lo sviluppo e la build (`vite`, `tsc && vite build`)",
    "Jest 29 con ts-jest come test runner",
    "jest-environment-jsdom per simulare il browser nei test",
    "@testing-library/react 16 per i test dei componenti",
    "API del browser: localStorage, fetch, crypto.randomUUID"
  ],
  "constraints": [
    "La build passa prima dal controllo dei tipi di `tsc` e solo dopo da Vite: un errore di tipo blocca la build (package.json, riga 6).",
    "Le funzioni dello store non modificano la lista ricevuta: ne restituiscono una nuova (`addTodo`, `toggleTodo` in src/store/todos.ts).",
    "I titoli vengono ripuliti dagli spazi e un titolo vuoto è rifiutato (src/store/todos.ts, riga 4).",
    "Gli id dei todo sono generati con crypto.randomUUID (src/store/todos.ts, riga 5).",
    "Il tipo `Todo` è definito una sola volta nello store e il client API lo importa (src/api/client.ts, riga 1).",
    "I test stanno accanto al file che verificano, con suffisso `.test.ts`."
  ],
  "unknowns": [
    "Quale chiave di localStorage è quella giusta: `saveTodos` usa \"todos\", il test si aspetta \"todo-list\". Da qui il test rosso.",
    "Il TODO in src/api/client.ts (riga 5): riprovare una volta in caso di errore di rete non è ancora fatto.",
    "Non esiste una funzione che rilegge i todo da localStorage: oggi si salva ma non si carica.",
    "La risposta dell'API viene accettata così com'è come lista di `Todo` (cast `as Todo[]`, riga 10), senza controllare che la forma dei dati sia corretta.",
    "I componenti `TodoList` e `TodoItem` non hanno test nonostante @testing-library/react sia installato.",
    "Non vedo un file di configurazione di Vite né @vitejs/plugin-react tra le dipendenze: potrebbe essere voluto, ma è da verificare."
  ],
  "decisions": [
    {
      "title": "React con TypeScript, servito e compilato da Vite",
      "context": "Serve un'interfaccia web leggera con un ciclo di sviluppo veloce.",
      "decision": "L'interfaccia è scritta in React 18 con TypeScript. Vite gestisce il server di sviluppo e la build; `tsc` controlla i tipi prima della build.",
      "consequences": "Un errore di tipo blocca la build. Il codice nuovo va scritto in `.ts`/`.tsx`.",
      "evidence": ["package.json, righe 5-6, 9, 11-12", "src/main.tsx", "src/App.tsx"]
    },
    {
      "title": "Jest con ts-jest e jsdom come strumento di test",
      "context": "Lo store usa API del browser (localStorage, crypto) e i componenti vanno renderizzati nei test.",
      "decision": "I test girano con Jest 29, compilati da ts-jest, in un ambiente jsdom che simula il browser. Per i componenti si usa @testing-library/react.",
      "consequences": "I test nuovi usano Jest (describe, it, expect), non Vitest, anche se il progetto usa Vite.",
      "evidence": ["package.json, righe 7, 13-16", "jest.config.js"]
    },
    {
      "title": "Store come funzioni pure su liste non modificabili",
      "context": "Lo stato dei todo deve essere semplice da usare in React e da testare.",
      "decision": "Ogni operazione riceve la lista corrente e ne restituisce una nuova, senza modificarla. Il salvataggio in localStorage sta in una funzione separata (`saveTodos`).",
      "consequences": "La logica si testa senza React. Chi chiama deve usare la lista restituita. L'effetto collaterale (salvare) resta isolato in un punto.",
      "evidence": ["src/store/todos.ts, righe 3-10", "src/store/todos.ts, righe 12-14"]
    },
    {
      "title": "Il client API restituisce un risultato esplicito, senza lanciare errori",
      "context": "Le chiamate di rete possono fallire per errori HTTP o di connessione.",
      "decision": "`fetchTodos` restituisce sempre un `Result<T>`: in caso di successo il valore, altrimenti un messaggio d'errore. Le eccezioni di `fetch` vengono catturate e trasformate in errore.",
      "consequences": "Chi chiama deve controllare `ok` prima di usare `value`. TypeScript obbliga a gestire entrambi i casi.",
      "evidence": ["src/api/client.ts, riga 3", "src/api/client.ts, righe 6-14"]
    },
    {
      "title": "Cartelle per responsabilità e test accanto al codice",
      "context": "Il progetto è piccolo ma separa interfaccia, stato e rete.",
      "decision": "Il codice sta in `src/components`, `src/store` e `src/api`. Ogni test sta accanto al file che verifica, con suffisso `.test.ts`. I nomi dei test seguono lo schema \"funzione: comportamento\".",
      "consequences": "Un modulo nuovo va nella cartella della sua responsabilità, con il suo test accanto.",
      "evidence": ["struttura di src/", "src/store/todos.test.ts, righe 4, 7, 10, 14", "src/api/client.test.ts"]
    }
  ],
  "conflicts": [
    {
      "topic": "Gestione degli errori: eccezioni nello store, risultato esplicito nel client API",
      "question": "Per il codice nuovo, gli errori prevedibili (input non valido, rete) vanno restituiti come `Result` come fa `fetchTodos`, oppure lanciati come eccezione come fa `addTodo`?"
    }
  ],
  "layers": "Tre strati. Interfaccia (`src/components`, `App.tsx`, `main.tsx`): mostra i todo e raccoglie le azioni dell'utente. Stato (`src/store`): funzioni pure che producono la nuova lista, più il salvataggio in localStorage. Rete (`src/api`): legge i todo dal server e restituisce un `Result`. L'interfaccia usa stato e rete. La rete dipende dallo stato solo per il tipo `Todo`.",
  "folders": "src/main.tsx e src/App.tsx sono il punto d'ingresso. src/components/ contiene i componenti React (TodoList, TodoItem). src/store/ contiene il modello Todo e le operazioni sulla lista. src/api/ contiene il client HTTP. I test stanno accanto ai file, con suffisso .test.ts.",
  "paths": [
    "Far tornare verde il test `saveTodos: persists to localStorage`: decidere quale chiave è quella giusta, \"todos\" o \"todo-list\", e allineare codice e test. Era rosso già prima di Pebble.",
    "Aggiungere `loadTodos` nello store, con un test che salva una lista e la rilegge, incluso il caso in cui localStorage è vuoto.",
    "Risolvere il TODO in `fetchTodos`: un solo nuovo tentativo sugli errori di rete, non sugli errori HTTP, con un test che simula un primo fetch fallito e un secondo riuscito.",
    "Scrivere il primo test di `TodoItem` con @testing-library/react: cliccando il todo, la sua azione di toggle viene chiamata."
  ],
  "question": "La chiave di localStorage giusta è \"todos\", quella che usa `saveTodos`, o \"todo-list\", quella che si aspetta il test? Se l'app è già in uso con \"todos\", cambiare chiave farebbe perdere agli utenti i todo salvati."
}
```
