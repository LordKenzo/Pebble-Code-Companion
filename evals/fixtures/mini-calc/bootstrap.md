# mini-calc — bootstrap

## Cosa devo fare
Un programma da riga di comando che aiuta a caricare il bilanciere.

- Stima il massimale (1RM) da una serie: peso sollevato e ripetizioni fatte.
- Dato un massimale, calcola i carichi per una lista di percentuali (es. 70%, 80%, 90%).
- Arrotonda ogni carico a quello realmente componibile con i dischi disponibili
  e dice quali dischi mettere per lato.

Esempio d'uso che immagino:
- `mini-calc 1rm 100 5` → massimale stimato
- `mini-calc carichi 120 70 80 90` → carichi e dischi per lato

## Vincoli
- TypeScript su Node, nessun framework
- Bilanciere da 20 kg; dischi disponibili: 25, 20, 15, 10, 5, 2.5, 1.25 kg (in coppia, uno per lato)
- Le formule di stima devono essere intercambiabili (Epley, Brzycki…)
- Voglio dei test, perché sbagliare un carico in palestra è pericoloso

## Non so ancora
- Come strutturare le cartelle per un progetto così piccolo
- Se arrotondare per difetto o al carico più vicino
- Cosa fare quando un carico non è componibile o è sotto il peso del bilanciere
- Che test runner usare
- Da dove cominciare
