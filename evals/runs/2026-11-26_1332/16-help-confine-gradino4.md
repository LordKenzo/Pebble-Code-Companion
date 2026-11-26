**Gradino 4 · La riga esatta**
Riga 20, il confronto deve includere l'uguaglianza:

```ts
    while (remaining >= plate) {
```

Checklist:
- con `remaining === plate` il disco ora entra;
- a fine ciclo `remaining` vale 0 per ogni carico componibile;
- i tre test rossi diventano verdi.

Test da aggiungere: per ogni multiplo di 2,5 kg tra 20 e 200, verifica che `BAR + 2 × somma(perSide) === total`. Fallisce finché c'è `>`, perché ogni carico che chiude esattamente su un disco resta scoperto.

**Concetto:** errore di confine (off-by-one nel confronto)
