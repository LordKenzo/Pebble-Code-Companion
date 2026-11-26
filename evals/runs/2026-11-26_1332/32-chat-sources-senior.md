**Nessuna delle due, nella forma pura: usa lo stub di `user-event`.**

**Perché non `vi.spyOn` diretto:** in jsdom `navigator.clipboard` è `undefined`, quindi lo spy fallisce (`ADR-004`, jsdom). Dovresti prima definirlo con `Object.defineProperty` o `vi.stubGlobal`: funziona, ma è setup fragile da ripetere in ogni test (`best practice`).

**Perché non la DI nel componente:** aggiunge una prop (`copy?: (t: string) => Promise<void>`) che esiste solo per i test. Su una calcolatrice è un costo d'API che non si ripaga, perché la clipboard non è un confine architetturale come i calcoli di `ADR-002`.

**Cosa ti consiglio:** `userEvent.setup()` (v14) installa una clipboard finta su `navigator`. Quindi clicchi e poi leggi:

```ts
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /copia/i }));
expect(await navigator.clipboard.readText()).toBe('4');
```

In questo modo verifichi il comportamento e non il fatto che una certa chiamata sia avvenuta (`best practice`, Testing Library › Guiding Principles).

**Alternativa:** isolare `copyText(text)` in un modulo e sostituirla con `vi.mock`. Conviene solo se ti serve il caso di errore. Ti serve davvero, perché `writeText` può rifiutare (permessi negati, contesto non sicuro). In linea con `ADR-003`, conviene catturare il rifiuto e mostrare un messaggio invece di lasciare una promise rejection non gestita. Per testare quel ramo basta `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(...)` dopo il `setup()`.
