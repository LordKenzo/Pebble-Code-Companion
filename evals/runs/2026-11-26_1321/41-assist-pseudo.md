```json
{
  "intro": "loadsFor implementa il passo 4 della roadmap: dato un massimale e una lista di percentuali, restituisce per ognuna il target, il carico reale e i dischi. Ricorda tre cose. Prima: dichiara il tipo di ritorno, cioè un Result che contiene una lista di voci, così gli errori restano valori (ADR-004). Seconda: metti l'arrotondamento per difetto in una funzione a parte, come prevede il passo 3 della roadmap. È la parte più delicata e va testata da sola (ADR-003). Terza: lavora sempre in grammi interi e converti in kg solo nella CLI (ADR-001, ADR-003). Il target calcolato da una percentuale può avere decimali di grammo. Decidi tu come troncarlo prima di arrotondare.",
  "target": "loadsFor",
  "steps": [
    "Se max non è positivo, restituisci un esito non valido (ADR-004)",
    "Se una percentuale è fuori da 1–100, restituisci un esito non valido (ADR-004)",
    "Per ogni percentuale calcola il target in grammi interi partendo da max",
    "Arrotonda il target per difetto al carico componibile, a passi di 2,5 kg totali (ADR-003)",
    "Se il carico reale è sotto BAR, usa solo il bilanciere e aggiungi un avviso (ADR-004)",
    "Ottieni i dischi chiamando platesFor sul carico reale",
    "Raccogli target, carico reale e dischi in una voce e restituisci la lista con ok"
  ],
  "question": "Calcola a mano, prima di scrivere il codice: con un massimale di 142,5 kg e il 70%, quanto vale il target in grammi? Qual è il carico reale arrotondato per difetto? Quali dischi metti per lato? Usa questi numeri come primo test di loadsFor."
}
```
