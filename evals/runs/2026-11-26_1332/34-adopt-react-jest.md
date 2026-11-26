```json
{
  "reading": "todo-lite è una piccola app React + TypeScript, costruita con Vite e testata con Jest (ts-jest, ambiente jsdom). La logica della lista sta in `src/store/todos.ts` come funzioni pure che ricevono la lista e ne restituiscono una nuova. L'accesso al server sta in `src/api/client.ts`, che non lancia eccezioni ma restituisce un `Result<T>`. I componenti sono in `src/components/`. Lo store e il client hanno ciascuno un file di test accanto. Sui test, 6 su 7 sono verdi. L'unico rosso, `saveTodos`, era già rosso prima dell'adozione: il codice salva con la chiave `\"todos\"`, il test legge `\"todo-list\"`.",
  "name": "todo-lite",
  "what": "Una lista di cose da fare minimale in React: aggiungere un todo, segnarlo come fatto, salvarlo in localStorage e caricare la lista da un'API.",
  "stack": [
    "React 18 (react, react-dom)",
    "TypeScript 5.6",
    "Vite 5 per dev server e build (`tsc && vite build`)",
    "Jest 29 con ts-jest",
    "jest-environment-jsdom",
    "@testing-library/react 16",
    "localStorage per la persistenza",
    "fetch nativo per le chiamate HTTP"
  ],
  "constraints": [
    "Le funzioni dello store sono immutabili: restituiscono una nuova lista invece di modificarla (`addTodo`, `toggleTodo`).",
    "Il titolo di un todo viene ripulito con `trim()` e non può essere vuoto.",
    "Gli id dei todo vengono generati con `crypto.randomUUID()`.",
    "Il client API non lancia eccezioni: gli errori diventano `{ ok: false, error }`.",
    "Ogni modulo di logica ha il suo test accanto, con il nome `<modulo>.test.ts`.",
    "La build esegue il controllo dei tipi (`tsc`) prima di Vite."
  ],
  "unknowns": [
    "Il test `saveTodos: persists to localStorage` è rosso: il codice usa la chiave `\"todos\"`, il test si aspetta `\"todo-list\"`. Non è chiaro quale delle due sia quella voluta.",
    "Manca una funzione per rileggere i todo da localStorage: `saveTodos` scrive, ma nessuna funzione visibile carica.",
    "`src/api/client.ts` riga 5 ha un TODO aperto: un nuovo tentativo in caso di errore di rete.",
    "La risposta dell'API viene convertita con `as Todo[]` senza alcun controllo: dati malformati arriverebbero ai componenti senza errori.",
    "I componenti (`TodoList.tsx`, `TodoItem.tsx`, `App.tsx`) non hanno test, anche se @testing-library/react è installato.",
    "Il contenuto di `jest.config.js` e `tsconfig.json` non è stato letto: non è chiaro come siano configurati l'ambiente jsdom e la trasformazione TypeScript."
  ],
  "decisions": [
    {
      "title": "React con Vite e TypeScript",
      "context": "Serviva una piccola interfaccia web tipizzata con un ciclo di sviluppo rapido.",
      "decision": "L'app usa React 18 scritto in TypeScript. Vite fa da dev server e da bundler, e la build esegue prima `tsc`.",
      "consequences": "Gli errori di tipo bloccano la build. I nuovi file dell'interfaccia sono componenti `.tsx`.",
      "evidence": ["package.json righe 5-6 (script dev e build)", "package.json riga 9 (react, react-dom)", "src/main.tsx", "src/App.tsx"]
    },
    {
      "title": "Jest con ts-jest e jsdom per i test",
      "context": "Serviva poter testare la logica TypeScript e le API del browser come localStorage.",
      "decision": "I test girano con Jest 29: ts-jest compila TypeScript e jest-environment-jsdom simula il browser.",
      "consequences": "I nuovi test usano Jest (`describe`, `it`, `expect`), non Vitest. Il comando è `npm test`.",
      "evidence": ["package.json righe 7, 13-16", "jest.config.js", "src/store/todos.test.ts"]
    },
    {
      "title": "Store come funzioni pure e immutabili",
      "context": "La logica della lista doveva essere facile da testare senza montare componenti.",
      "decision": "Le operazioni sui todo sono funzioni che ricevono la lista e ne restituiscono una nuova, senza modificarla. L'eccezione è `saveTodos`, che ha un effetto collaterale su localStorage.",
      "consequences": "La logica si testa con semplici chiamate di funzione. Le nuove operazioni seguono lo stesso schema `(list, ...) => Todo[]`.",
      "evidence": ["src/store/todos.ts righe 3-10", "src/store/todos.test.ts righe 4-13"]
    },
    {
      "title": "Il client API restituisce un Result invece di lanciare",
      "context": "Le chiamate di rete possono fallire per molte ragioni: stato HTTP, rete, JSON.",
      "decision": "`fetchTodos` restituisce `Result<T>` (`{ ok: true, value }` oppure `{ ok: false, error }`) e cattura ogni eccezione.",
      "consequences": "Chi chiama deve controllare `ok` prima di usare `value`. Il tipo obbliga a gestire il caso di errore.",
      "evidence": ["src/api/client.ts righe 3, 6-14"]
    },
    {
      "title": "Cartelle per responsabilità e test accanto al codice",
      "context": "Il progetto separa interfaccia, stato e comunicazione col server.",
      "decision": "Il codice è diviso in `src/components/`, `src/store/` e `src/api/`. Ogni modulo di logica ha il suo `.test.ts` nella stessa cartella.",
      "consequences": "Un nuovo modulo va nella cartella della sua responsabilità, con il suo test accanto.",
      "evidence": ["src/store/todos.test.ts", "src/api/client.test.ts", "struttura di src/"]
    }
  ],
  "conflicts": [
    {
      "topic": "Gestione degli errori",
      "question": "Lo store segnala gli errori lanciando un'eccezione (`addTodo` riga 4: `throw new Error(\"empty title\")`), il client API li restituisce come `Result` (`client.ts` riga 3). Per il codice nuovo quale regola vuoi seguire: eccezioni per gli errori di dominio e `Result` per quelli di rete, oppure `Result` ovunque?"
    }
  ],
  "layers": "Tre livelli. In alto l'interfaccia (`App.tsx`, `TodoList.tsx`, `TodoItem.tsx`) che mostra i todo e raccoglie le azioni. Al centro lo store (`store/todos.ts`), con le regole sui todo come funzioni pure più la persistenza in localStorage. Ai margini il client API (`api/client.ts`), che parla col server e traduce ogni esito in un `Result`. Il tipo `Todo` è definito nello store e usato dal client.",
  "folders": "src/main.tsx (punto di ingresso) · src/App.tsx (componente radice) · src/components/ (componenti dell'interfaccia) · src/store/ (modello Todo, operazioni sulla lista, persistenza, con test) · src/api/ (chiamate HTTP e tipo Result, con test) · nella radice: package.json, tsconfig.json, jest.config.js, README.md",
  "paths": [
    "Far tornare verde `saveTodos: persists to localStorage`: allineare la chiave di localStorage tra `todos.ts` riga 13 e `todos.test.ts` riga 16, decidendo prima quale delle due è quella giusta.",
    "Aggiungere `loadTodos(): Todo[]` nello store, il complemento di `saveTodos`, con un test che salva una lista e la rilegge identica, e uno su cosa succede se la chiave non esiste.",
    "Risolvere il TODO di `client.ts` riga 5: un solo nuovo tentativo sugli errori di rete, con un test in `client.test.ts` dove il primo `fetch` fallisce e il secondo riesce.",
    "Scrivere il primo test di un componente con @testing-library/react, per esempio `TodoItem` che mostra il titolo e cambia stato al clic."
  ],
  "question": "Per localStorage, la chiave giusta è `\"todos\"` (come nel codice) o `\"todo-list\"` (come nel test)? Se ci sono già utenti con dati salvati, cambiare la chiave nel codice li farebbe sparire."
}
```
