**Cos'è un mock**

Un **mock** è un finto pezzo di codice che, durante il test, prende il posto di uno vero. Lo usi quando la cosa vera non è disponibile nel test o non puoi controllarla, e ti permette di chiedere poi al finto: "sei stato chiamato? con quale valore?".

**Ti serve per il pulsante "copia"? Sì.** (`best practice`)

- Il pulsante usa gli **appunti** del sistema: in un browser si chiamano `navigator.clipboard`, l'oggetto che il browser offre per leggere e scrivere negli appunti.
- I tuoi test girano in **jsdom** (ADR-004), cioè un finto browser che vive dentro Node. jsdom **non ha gli appunti veri**: `navigator.clipboard` lì non esiste.
- Quindi sostituisci la funzione `writeText` (quella che scrive negli appunti) con un mock creato da Vitest con `vi.fn()`.
- Nel test controlli che il mock sia stato chiamato con il risultato giusto, per esempio `"4"` dopo 2 + 2.

**I passi del test, a parole** (il codice lo scrivi tu):

1. Prima del test, metti al posto di `navigator.clipboard` un oggetto finto che ha un `writeText` creato con `vi.fn()`.
2. Mostri la pagina con Testing Library (ADR-004) e fai un calcolo.
3. Clicchi il pulsante "Copia".
4. Verifichi che `writeText` sia stato chiamato una volta, con il risultato mostrato.

Una nota sulla struttura: il pulsante e gli appunti stanno nel componente, non in `src/calculator/`. I calcoli restano funzioni pure, senza browser (ADR-002). Per questo `calculator.test.ts` non ha bisogno di mock, e va bene così.

**Scorciatoia utile.** La libreria `user-event` di Testing Library simula i clic come farebbe una persona. Quando la prepari con `userEvent.setup()`, crea da sola degli appunti finti. Se non l'hai ancora installata:

```sh
npm install -D @testing-library/user-event
```

**Dove studiarlo**

- **vitest.dev**: apri la guida e cerca la sezione **Guide › Mocking**. Leggi la parte su `vi.fn()` e su come controllare le chiamate (`toHaveBeenCalledWith`).
- **testing-library.com**: nella documentazione cerca **user-event**, poi la pagina **Clipboard**.

Domanda prima di iniziare: il pulsante deve copiare anche il messaggio d'errore (es. "Non si può dividere per zero", ADR-003), o solo i numeri? Cambia i casi da testare.
