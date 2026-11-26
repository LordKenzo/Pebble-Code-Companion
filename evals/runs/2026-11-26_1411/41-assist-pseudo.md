```json
{
  "intro": "loadsFor è il passo 4 della roadmap. Da un massimale e da una lista di percentuali ricava, per ognuna, il target, il carico reale e i dischi. Le regole vengono dalle decisioni:\n- ADR-003: si arrotonda per difetto a multipli di 2.500 g e si lavora sempre in grammi interi.\n- ADR-004: gli input non validi diventano un risultato esplicito, non un'eccezione, e sotto i 20 kg si usa solo il bilanciere con un avviso.\n\nPrincipio: ogni passo fa una cosa sola (separazione delle responsabilità). La funzione di arrotondamento conviene tenerla a parte, è il passo 3 della roadmap, e loadsFor si limita a chiamarla insieme a platesFor.\n\nPrima di scrivere il corpo definisci il tipo di ritorno, `Result` di una lista di righe. Ogni riga contiene percentuale, target, carico reale e PlateLoad. È anche il momento di aggiungere la firma di ritorno a loadsFor, che oggi manca.",
  "target": "loadsFor",
  "steps": [
    "Se max ≤ 0 o una percentuale è fuori da 1–100, restituisci il risultato «non valido» (ADR-004)",
    "Per ogni percentuale calcola il target in grammi: max × percentuale / 100",
    "Arrotonda il target per difetto al multiplo di 2.500 g: questo è il carico reale (ADR-003)",
    "Se il carico reale è sotto BAR, usa BAR e segna l'avviso «solo bilanciere» (ADR-004)",
    "Chiama platesFor sul carico reale e prendi il suo PlateLoad",
    "Componi la riga: percentuale, target, carico reale, dischi",
    "Restituisci ok con tutte le righe, riportando gli eventuali avvisi"
  ],
  "question": "Calcola a mano con max = 142.500 g e percentuale 72: quanto vale il target, quanto il carico reale e quali dischi metti per lato? Poi prova con 73%. Il target ti viene un intero in grammi, o devi preoccuparti dei decimali prima di arrotondare?"
}
```
