```json
{
  "reading": "Il bug non è nella logica di `calculate`: alla riga 6 di `src/calculator/calculator.ts`, `a + b` fa esattamente quello che fa JavaScript. I numeri sono in virgola mobile binaria (standard IEEE 754), dove 0,1 e 0,2 non si rappresentano in modo esatto, quindi la somma vale 0.30000000000000004. Il problema compare quando quel numero arriva sulla pagina così com'è, convertito in testo con il punto e senza arrotondamento. Il bug ha quindi due parti: troppe cifre decimali e il separatore sbagliato per l'italiano. Ti propongo di lasciare `calculate` com'è, perché il valore numerico è corretto, e di aggiungere una funzione pura di formattazione in `src/calculator/`. Resta separata da React come chiede ADR-002 e si testa come funzione come chiede ADR-004. Così gestisce anche i messaggi d'errore restituiti come valori (ADR-003). Puoi approfondire su MDN alla voce Intl.NumberFormat, in particolare l'opzione maximumFractionDigits.",
  "tasks": [
    {
      "title": "Scrivi il test che riproduce il bug",
      "todo": "Crea src/calculator/format.test.ts con il test \"0,1 + 0,2: mostra 0,3\". Il test passa il risultato di calculate(0.1, 0.2, 'add') alla funzione di formattazione e si aspetta il testo '0,3'. Lancialo: deve fallire con il codice attuale, perché la funzione non esiste ancora. Prima di correggere, verifica che fallisca davvero (ADR-004).",
      "signature": "",
      "doneWhen": "file src/calculator/format.test.ts"
    },
    {
      "title": "Scrivi la funzione di formattazione",
      "todo": "Crea src/calculator/format.ts. Se riceve un numero, lo arrotonda a un numero massimo di cifre decimali e lo scrive con la virgola italiana. Se riceve una stringa, cioè un messaggio d'errore, la restituisce invariata (ADR-002, ADR-003). Lascia calculate com'è.",
      "signature": "export function formatResult(value: number | string): string;",
      "doneWhen": "test \"0,1 + 0,2\""
    },
    {
      "title": "Copri i casi vicini",
      "todo": "Aggiungi a src/calculator/format.test.ts tre test: \"0,3 - 0,1: mostra 0,2\" e \"1,1 × 3: mostra 3,3\", che sono altri due casi dello stesso errore di virgola mobile, e \"7 ÷ 0: mostra il messaggio d'errore invariato\", che controlla che la formattazione non rovini i messaggi d'errore (ADR-003).",
      "signature": "",
      "doneWhen": "test \"0,3 - 0,1\" \"1,1 × 3\" \"7 ÷ 0\""
    },
    {
      "title": "Usa la formattazione nella pagina",
      "todo": "In src/App.tsx, dove mostri il risultato di calculate, passalo prima a formatResult. Il componente non deve fare arrotondamenti per conto suo: si limita a chiamare la funzione e a mostrarne il risultato (ADR-002).",
      "signature": "",
      "doneWhen": "nessun errore in src/App.tsx"
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Rileggiamo insieme format.ts, i suoi test e la modifica in App.tsx.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Quante cifre decimali al massimo vuoi mostrare nel risultato (per esempio 1 ÷ 3 = 0,3333333333)? Da questo dipende l'arrotondamento in formatResult e il valore atteso nei test."
}
```
