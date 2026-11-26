Un **mock** è una controfigura: nei test prende il posto di qualcosa di vero (una funzione, un pezzo del browser) e **registra come viene usata**. Puoi anche decidere cosa risponde. Un esempio con Vitest (ADR-004):

```ts
const saluta = vi.fn(); // funzione finta
saluta('Ada');
expect(saluta).toHaveBeenCalledWith('Ada'); // il test passa
```

I tuoi test in `calculator.test.ts` non ne hanno bisogno: `calculate` riceve valori e restituisce un risultato (ADR-002), quindi basta controllare quello.

**Per il pulsante "Copia"**
Il browser copia con `navigator.clipboard.writeText`. I test però girano in jsdom, un browser simulato che non offre gli appunti. La libreria `user-event`, compagna di Testing Library, ne fornisce di finti, pronti all'uso. Se non è già installata:

```sh
npm install -D @testing-library/user-event
```

- **Copia riuscita**, senza scrivere mock: chiami `userEvent.setup()`, mostri la pagina, calcoli 2 + 2, premi "Copia". Poi leggi con `navigator.clipboard.readText()` e ti aspetti `"4"`.
- **Copia fallita** (per esempio permesso negato): qui un mock serve. Con `vi.spyOn`, dopo `userEvent.setup()`, fai fallire `writeText` e controlli che la pagina mostri un messaggio d'errore, in linea con l'idea di ADR-003.

`writeText` è **asincrona**, cioè finisce un po' dopo: nel componente e nel test va attesa con `await`.

Il codice della copia sta nel componente, non in `src/calculator/`, perché usa il browser e non è un calcolo (ADR-002).

**Dove studiare**
- [Vitest, guida "Mocking"](https://vitest.dev/guide/mocking): parti dalle funzioni finte (`vi.fn`, `vi.spyOn`).
- [Testing Library, "user-event"](https://testing-library.com/docs/user-event/intro): leggi l'introduzione, poi cerca la sezione "Clipboard".
