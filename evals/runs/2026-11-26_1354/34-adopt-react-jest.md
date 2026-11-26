{
  "reading": "Ho letto per intero package.json, src/store/todos.ts, src/api/client.ts, src/store/todos.test.ts, il README e il riepilogo di git (42 commit). Di tsconfig.json, jest.config.js, dei componenti, di main.tsx, App.tsx e client.test.ts conosco solo il nome. All'adozione i test verdi sono 6 su 7: è rosso «saveTodos: persists to localStorage», perché il codice scrive nella chiave \"todos\" (todos.ts:13) e il test legge \"todo-list\" (todos.test.ts:16).",
  "name": "todo-lite",
  "what": "Una piccola lista di cose da fare in React. Il codice letto permette di aggiungere un todo, segnarlo come fatto o non fatto, salvare la lista in localStorage e scaricare dei todo da un URL.",
  "stack": [
    "TypeScript ^5.6",
    "React ^18.3 con react-dom",
    "Vite ^5.4 per sviluppo e build",
    "Jest ^29.7 con ts-jest",
    "jest-environment-jsdom e @testing-library/react (installati)",
    "localStorage per il salvataggio",
    "fetch per le chiamate HTTP"
  ],
  "constraints": [
    "Le funzioni che modificano la lista restituiscono un nuovo array, senza cambiare quello ricevuto.",
    "Il titolo di un todo viene ripulito dagli spazi ai lati e non può essere vuoto.",
    "fetchTodos restituisce gli errori HTTP e di rete come Result.",
    "La build esegue il controllo dei tipi (tsc) prima di vite build."
  ],
  "unknowns": [
    "Non è chiaro quale chiave di localStorage sia quella giusta, \"todos\" o \"todo-list\". Se ci sono già dati salvati, cambiare la chiave nel codice li renderebbe invisibili a chi la legge.",
    "In todos.ts c'è il salvataggio ma non una funzione di lettura: non so se la lista venga ricaricata altrove.",
    "La risposta dell'API è trattata come Todo[] con un cast (client.ts:10), senza controllarne la forma nel client.",
    "Il TODO in client.ts:5 (un nuovo tentativo in caso di errore di rete) è ancora aperto.",
    "Non ho letto client.test.ts, quindi non so quali casi di fetchTodos siano coperti.",
    "Nell'elenco dei file non ci sono test per TodoList e TodoItem.",
    "In package.json non vedo @types/jest, @types/react e @types/react-dom: va verificato con npm run build che il controllo dei tipi passi."
  ],
  "decisions": [
    {
      "title": "React e TypeScript, con Vite per sviluppo e build",
      "context": "L'applicazione è un'interfaccia web con un server di sviluppo e una build di produzione.",
      "decision": "Si usano React 18 e TypeScript. Vite serve l'app in sviluppo; la build esegue tsc e poi vite build.",
      "consequences": "Il nuovo codice è scritto in TypeScript e un errore di tipo rilevato da tsc blocca la build.",
      "evidence": [
        "package.json:5-6",
        "package.json:9-12",
        "src/main.tsx"
      ]
    },
    {
      "title": "Test con Jest, accanto al file che provano",
      "context": "Il progetto ha test automatici per la logica dello store e per il client API.",
      "decision": "Si usa Jest con ts-jest. Ogni file di test si chiama nome.test.ts e sta nella stessa cartella del modulo.",
      "consequences": "I nuovi test seguono lo stesso schema e si lanciano con npm test. Tenerli vicini al codice rende evidente cosa è coperto.",
      "evidence": [
        "package.json:7",
        "package.json:13-16",
        "src/store/todos.test.ts",
        "src/api/client.test.ts"
      ]
    },
    {
      "title": "Cartelle divise per responsabilità",
      "context": "Interfaccia, logica dei dati e comunicazione con il server hanno compiti diversi.",
      "decision": "I componenti React stanno in src/components, la logica dei todo in src/store, le chiamate HTTP in src/api.",
      "consequences": "Il codice nuovo va nella cartella del suo compito. È la separazione delle responsabilità: ogni parte si può cambiare e provare con meno effetti sulle altre.",
      "evidence": [
        "src/components/TodoList.tsx",
        "src/components/TodoItem.tsx",
        "src/store/todos.ts",
        "src/api/client.ts"
      ]
    },
    {
      "title": "Aggiornamenti della lista senza mutazioni",
      "context": "La lista dei todo viene trasformata da funzioni dello store.",
      "decision": "addTodo e toggleTodo ricevono la lista e ne restituiscono una nuova. Il salvataggio sta in una funzione separata, saveTodos.",
      "consequences": "Le trasformazioni si provano con semplici valori in ingresso e in uscita, e si adattano al modo in cui React rileva i cambiamenti. Chi le chiama deve usare il valore restituito.",
      "evidence": [
        "src/store/todos.ts:3-6",
        "src/store/todos.ts:8-10",
        "src/store/todos.ts:12-14"
      ]
    }
  ],
  "conflicts": [
    {
      "topic": "Gestione degli errori: addTodo lancia un'eccezione (todos.ts:4), fetchTodos restituisce un Result (client.ts:3-13).",
      "question": "Per il codice nuovo vuoi usare Result ovunque, le eccezioni ovunque, oppure la regola «eccezioni per la validazione nello store, Result per le chiamate esterne»?"
    }
  ],
  "layers": "Interfaccia (src/components, con App.tsx e main.tsx), logica e salvataggio dei todo (src/store), accesso al server (src/api). Nei file letti, client.ts importa dallo store solo il tipo Todo.",
  "folders": "src/components: componenti React. src/store: tipo Todo, funzioni sulla lista, salvataggio e relativi test. src/api: client HTTP e relativi test. In src: main.tsx e App.tsx.",
  "paths": [
    "Rendere verde il test di saveTodos: decidere quale chiave è corretta e allineare todos.ts o il test. È fatto quando npm test dà 7 su 7.",
    "Risolvere il TODO di client.ts: un solo nuovo tentativo per gli errori di rete. È fatto quando i test mostrano che un primo errore seguito da un successo dà ok, che due errori danno un Result di errore e che un errore HTTP non viene ritentato.",
    "Completare i test di toggleTodo: con un id inesistente la lista resta uguale nei contenuti, e la lista originale non viene modificata."
  ],
  "question": ""
}
