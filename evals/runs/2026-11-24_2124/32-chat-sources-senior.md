**Né l'uno né l'altro come primo strumento: usa `@testing-library/user-event`.** In questo caso è la scelta più economica.

**Perché non `vi.spyOn` da solo.** In jsdom `navigator.clipboard` non esiste. Quindi `vi.spyOn(navigator.clipboard, 'writeText')` fallisce prima ancora di girare (`best practice`). Per farlo funzionare servirebbe `vi.stubGlobal` o `Object.defineProperty` su `navigator`, cioè altro setup fragile da tenere in ogni test.

**Perché non l'iniezione come default.** Aggiungere una prop `copy` solo per i test sporca l'API del componente. Il componente sa già dove copiare, e ADR-004 chiede di testare la pagina "come la usa l'utente", non i suoi collaboratori.

**Cosa fare.** `userEvent.setup()` (v14) installa uno stub funzionante di `navigator.clipboard` nel documento jsdom. Il test diventa: clic sul pulsante, poi leggi gli appunti e confronta col risultato mostrato.

```sh
npm install -D @testing-library/user-event
```

Il cuore del test sta in due righe:

```ts
await user.click(screen.getByRole('button', { name: /copia/i }));
expect(await navigator.clipboard.readText()).toBe('4');
```

**Il caso d'errore.** Dopo `setup()` lo stub esiste, quindi lì `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(...)` funziona. Ti serve per verificare che un rifiuto (permesso negato, contesto non sicuro) diventi un messaggio a schermo e non un'eccezione non gestita. È lo spirito di ADR-003 applicato alla UI.

**Quando passare all'iniezione.** Passaci se la logica di copia cresce, per esempio con formattazione del numero, fallback a `execCommand` o retry. In quel caso estraila in un modulo fuori dal componente, coerente con ADR-002, e iniettala o mockala con `vi.mock`:

```ts
// src/clipboard/copyText.ts
export type CopyResult = { ok: true } | { ok: false; error: string };
export declare function copyText(text: string): Promise<CopyResult>;
```

Costo: un modulo in più e un `vi.mock` nei test della pagina. Guadagno: la gestione dell'errore si testa come funzione pura-ish, senza DOM.

Se la gestione degli errori di copia diventa una regola stabile, ha senso fissarla con un ADR: "Errori degli appunti come valori, mostrati in pagina". Così chiarisci che ADR-003 vale anche oltre i calcoli.

Il pulsante copia il risultato così com'è, o deve formattarlo (decimali, separatore)? Da questo dipende se ti basta user-event o conviene già estrarre `copyText`.
