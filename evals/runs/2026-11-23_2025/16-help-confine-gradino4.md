**Gradino 4 · La riga esatta**

A riga 20 il disco deve entrare anche quando il resto è **uguale** al disco, non solo quando è maggiore:

```ts
while (remaining >= plate) {
```

Con `>` l'ultimo disco che chiude il conto esatto viene sempre saltato. Per questo ai 60 kg ricevevi `[15, 2.5, 1.25]` invece di `[20]`.

Test da aggiungere, che avrebbe trovato il problema: «la somma dei dischi torna al totale». Per diversi carichi (30, 60, 100, 142,5 kg) verifica che `BAR + 2 × somma(perSide)` sia uguale a `total`. Così controlli una regola che deve valere sempre, non un singolo caso.

**Concetto:** errore di confine (off-by-one nella condizione)
