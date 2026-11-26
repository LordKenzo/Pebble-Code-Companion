**Raccomandazione: nessuna iniezione nel componente. Usa `navigator.clipboard` direttamente e nei test usa lo stub di `user-event`.**

**Perché non `vi.spyOn` da solo**
In jsdom `navigator.clipboard` è `undefined`, quindi `vi.spyOn(navigator.clipboard, 'writeText')` fallisce subito. Dovresti definire la proprietà a mano con `Object.defineProperty` o `vi.stubGlobal`, e ripulirla dopo ogni test. Si può fare, ma è fragile (`best practice`).

**Perché non la DI via prop**
Aggiungeresti all'API del componente un parametro che serve solo ai test, e non esiste una seconda implementazione. In una pagina singola è complessità senza ritorno. Diventa la scelta giusta se gli effetti collaterali si moltiplicano (storage, share, ecc.): a quel punto conviene un modulo adapter, non una prop.

**Cosa fare**
`userEvent.setup()` (v14) installa uno stub di Clipboard su `navigator`. Il test resta comportamentale, coerente con ADR-004: clicchi "copia", poi verifichi che `navigator.clipboard.readText()` restituisca il risultato mostrato. Non serve nessun mock.

```sh
npm install -D @testing-library/user-event
```

**Il caso di errore (ADR-003)**
`writeText` può rifiutare, per esempio con permesso negato o contesto non sicuro. Il componente deve trasformare il rifiuto in un messaggio, non lasciar scappare la promise. Per questo test, dopo `setup()`, fai `vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(...)`. Lo spy funziona perché lo stub ora esiste. Poi verifichi che compaia il messaggio d'errore e chiudi con `vi.restoreAllMocks()` in `afterEach`.

Casi da coprire:
- click → la clipboard contiene il valore visualizzato
- il risultato è un messaggio d'errore di `calculate` → decidi se copiarlo o disabilitare il pulsante
- `writeText` rifiuta → messaggio visibile, nessuna eccezione non gestita

**ADR proposto**
ADR-005: Effetti del browser nei test. Decisione: le API del browser si usano direttamente nei componenti. Nei test si usano gli stub di `user-event`, e `vi.spyOn` sugli stub per i casi di errore. Si introduce un adapter solo quando le API coinvolte sono più di una.
