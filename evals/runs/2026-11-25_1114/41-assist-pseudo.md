```json
{
  "intro": "Manca il corpo di `loadsFor` (righe 21-23), il passo 4 della roadmap: da un massimale e una lista di percentuali ottieni, per ogni percentuale, il target, il carico reale e i dischi. È composizione di funzioni: `loadsFor` non rifà i calcoli, mette in fila pezzi che hai già o avrai al passo 3 (arrotondamento) e `platesFor`. Prima di scrivere, dichiara il tipo di ritorno, che oggi manca: per ADR-004 deve essere un `Result`, non un valore nudo.",
  "target": "loadsFor",
  "steps": [
    "Valida l'input prima di tutto (ADR-004): se `max` è ≤ 0, oppure se una qualsiasi voce di `percents` è fuori da 1–100, restituisci subito un esito «non valido» con un messaggio che dica quale valore è sbagliato. Niente eccezioni.",
    "Per ogni percentuale calcola il target in grammi partendo da `max`: moltiplica prima e dividi per 100 dopo, così resti negli interi il più a lungo possibile (ADR-003, niente kg in virgola mobile).",
    "Arrotonda il target per difetto al multiplo componibile, cioè ai 2.500 g totali (ADR-003). Usa la funzione di arrotondamento del passo 3: se non esiste ancora, segnati il punto e scrivila prima, invece di rifare il calcolo qui dentro.",
    "Passa il carico arrotondato a `platesFor` e tieni sia il target sia il carico reale: per ADR-003 l'output deve mostrarli entrambi.",
    "Raccogli gli avvisi: se il carico reale è sotto `BAR` l'esito è «solo bilanciere» con avviso (ADR-004). Controlla che `platesFor` lo gestisca davvero: oggi con 15 kg la riga 10 dà un `remaining` negativo e il ciclo restituisce zero dischi senza avviso.",
    "Restituisci un unico `Result` con la lista delle voci (percentuale, target, carico reale, dischi), nello stesso ordine di `percents`. Se almeno una voce ha un avviso, l'esito complessivo è «ok con avviso»."
  ],
  "question": "Calcola a mano, prima di scrivere: massimale 100 kg, percentuale 73%. Quanti grammi vale il target, quale carico reale ottieni arrotondando per difetto a multipli di 2.500 g, e quali dischi metti per lato? Poi trasforma quel risultato nel primo test di `loadsFor`."
}
```
