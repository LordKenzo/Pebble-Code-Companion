**Concetto:** un *mock* è un **sostituto finto** di un pezzo di codice che il tuo test non vuole (o non può) usare davvero. Il mock non fa il lavoro vero: **registra come è stato chiamato**, così nel test puoi verificarlo.

**Ti serve per il pulsante "copia"? Sì.**

I tuoi test girano in **jsdom** (`ADR-004`), cioè un browser finto che vive dentro il terminale. Lì gli appunti veri del sistema non ci sono. E anche se ci fossero, non vorresti che un test scrivesse negli appunti del tuo computer.

Quindi il test fa tre cose:

1. Sostituisce la funzione del browser che copia (`navigator.clipboard.writeText`) con un mock.
2. Clicca il pulsante con Testing Library (`ADR-004`).
3. Controlla che il mock sia stato chiamato con il risultato giusto, per esempio `'4'`.

L'idea in due righe, solo per farti vedere la forma:

```ts
const writeText = vi.fn();                        // vi.fn() crea una funzione finta che si ricorda le chiamate
expect(writeText).toHaveBeenCalledWith('4');      // "sei stata chiamata con '4'?"
```

Nota bene: non stai verificando che gli appunti funzionino, perché quello è compito del browser. Verifichi che **il tuo pulsante chieda di copiare la cosa giusta**. È lo stesso principio di `ADR-002`: testi il tuo codice, non quello degli altri.

I test che hai in `calculator.test.ts` non hanno bisogno di mock. `calculate` è una funzione pura (`ADR-002`): riceve dei numeri e restituisce un valore, senza toccare niente fuori da sé. I mock servono solo quando il codice parla con qualcosa di esterno: gli appunti, la rete, l'orologio.

**Dove studiarlo**

- **vitest.dev**, nella sezione *Guide › Mocking*. Leggi prima la parte su `vi.fn` e poi quella su `vi.spyOn`, che serve a sostituire una funzione che esiste già, come `writeText`.
- **testing-library.com**, nella sezione *user-event*. Lì trovi come simulare il click sul pulsante.

Il pulsante "copia" l'hai già scritto, o è ancora da fare?
