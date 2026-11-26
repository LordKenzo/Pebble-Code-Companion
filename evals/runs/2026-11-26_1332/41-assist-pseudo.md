```json
{
  "intro": "loadsFor è il passo 4 della roadmap: dal massimale e dalle percentuali ricava target, carico reale e dischi. Resta nel core come funzione pura (ADR-001). Lavora sempre in grammi interi e arrotonda per difetto prima di chiamare platesFor (ADR-003): platesFor si aspetta un carico già componibile. I casi anomali diventano esiti del Result, non eccezioni (ADR-004). Conviene anche dichiarare il tipo di ritorno, per esempio Result di una lista di voci: così tsc ti avvisa se dimentichi un campo.",
  "target": "loadsFor",
  "steps": [
    "Se max è ≤ 0 o una percentuale è fuori da 1–100, restituisci un risultato non valido",
    "Per ogni percentuale calcola il target in grammi: max per percentuale diviso 100",
    "Arrotonda il target per difetto al multiplo di 2500 grammi (la funzione del passo 3)",
    "Se il carico arrotondato è sotto BAR, segna la voce come «solo bilanciere» con avviso",
    "Altrimenti passa il carico arrotondato a platesFor e prendi i suoi perSide",
    "Metti percentuale, target, carico reale e dischi in una voce della lista",
    "Restituisci ok con la lista, con avviso se almeno una voce ne ha uno"
  ],
  "question": "Con max = 102500 grammi e 85%, quanto valgono il target e il carico reale in grammi? Fai il conto a mano prima di scrivere il test."
}
```
