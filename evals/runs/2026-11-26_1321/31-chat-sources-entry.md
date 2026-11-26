## Cos'è un mock

Un **mock** è un **finto pezzo di codice** che nel test prende il posto di uno vero. Il codice che stai testando lo usa senza accorgersene. Il mock fa due cose:

1. **Non fa nulla di reale.** Per esempio non scrive davvero negli appunti.
2. **Ricorda come è stato usato.** Sa se è stato chiamato, quante volte e con quali dati.

Così puoi chiedere al test: "il mio codice ha chiamato questa funzione, con questo valore?".

## Ti serve per il pulsante "copia"? Sì

Il pulsante userà `navigator.clipboard.writeText(...)`, la funzione del browser che scrive negli appunti. I test però non girano in un browser vero: girano in **jsdom**, un browser simulato (`ADR-004`). Lì `navigator.clipboard` di solito **non esiste**, quindi il codice si romperebbe. E anche se esistesse, non vuoi toccare gli appunti veri del tuo computer (`best practice`: i test non devono dipendere da cose esterne).

Quindi nel test sostituisci `writeText` con un mock. Il costrutto di Vitest per crearlo è `vi.fn()`, per esempio così:

```ts
Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
```

**Il test, descritto a parole** (lo scrivi tu):
- Prepara il mock come sopra, prima di mostrare la pagina.
- Mostra la pagina con Testing Library e fai un calcolo, per esempio 8 ÷ 2.
- Clicca il pulsante "Copia".
- Controlla che il mock sia stato chiamato **una volta**, con il valore `'4'`. Cerca `toHaveBeenCalledWith` nella documentazione.

Per simulare il clic in modo realistico, Testing Library ha un pacchetto apposta. Installalo così:

```sh
npm install -D @testing-library/user-event
```

`-D` lo salva come dipendenza di sviluppo, cioè un pezzo di codice che serve solo ai test e non all'app finale.

**Consiglio:** tieni il test del pulsante in un file accanto al componente, non in `calculator.test.ts`. Quel file prova solo i calcoli puri e lì non servono mock (`ADR-002`, `ADR-004`). Va bene così com'è.

## Dove studiarlo

- **vitest.dev**, sezione *Guide › Mocking*: spiega `vi.fn()` e come controllare le chiamate. Poi guarda *API › expect* e cerca `toHaveBeenCalledWith`.
- **testing-library.com**, sezione *user-event*: spiega come simulare clic e digitazione.
