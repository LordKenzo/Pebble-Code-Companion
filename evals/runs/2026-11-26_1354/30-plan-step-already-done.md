```json
{
  "reading": "Il passo 3 è già fatto: `calculate` in `src/calculator/calculator.ts` esegue le quattro operazioni, gestisce la divisione per zero, e nel percorso risulta spuntato che i test passano. Non la riscriviamo. Restano due casi sugli input non validi (ADR-003): il controllo su `NaN` (\"Not a Number\", il valore che JavaScript usa quando qualcosa non è un numero valido) esiste ma nessun test lo verifica. `Infinity` (infinito) invece supera il controllo e viene calcolato come un numero normale.",
  "tasks": [
    {
      "title": "Scrivi i test per gli input non validi",
      "todo": "In `src/calculator/calculator.test.ts` aggiungi \"NaN + 2: chiede due numeri\", \"2 + NaN: chiede due numeri\" e \"Infinity + 1: chiede due numeri\", aspettandoti il messaggio `Inserisci due numeri` (ADR-003, ADR-004). Esegui `npx vitest run`: i primi due devono passare, il terzo deve fallire perché il codice non controlla ancora l'infinito.",
      "signature": "",
      "doneWhen": "test \"NaN + 2\" \"2 + NaN\""
    },
    {
      "title": "Rifiuta anche i numeri infiniti",
      "todo": "In `calculate` allarga il controllo iniziale, così che sia `a` sia `b` debbano essere numeri finiti, cioè né `NaN` né infiniti (ADR-002, ADR-003): cerca `Number.isFinite` su MDN. Poi riesegui `npx vitest run`: tutti i test devono passare.",
      "signature": "export function calculate(a: number, b: number, op: Operation): number | string",
      "doneWhen": "test \"Infinity + 1\""
    },
    {
      "title": "Rileggi con Pebble",
      "todo": "Chiedi una revisione di `calculator.ts` e `calculator.test.ts` prima di passare ai campi e al pulsante.",
      "signature": "",
      "doneWhen": "a mano"
    }
  ],
  "question": "Se due numeri validi danno un risultato troppo grande per JavaScript (per esempio 1e308 × 10, che diventa `Infinity`), vuoi mostrare un messaggio d'errore anche in quel caso?"
}
```
