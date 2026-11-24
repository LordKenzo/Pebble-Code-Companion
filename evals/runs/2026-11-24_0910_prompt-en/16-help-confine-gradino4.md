**Gradino 4 · La riga esatta**
A riga 20 la condizione esclude il caso in cui il resto è esattamente uguale al disco. Va inclusa:

```ts
    while (remaining >= plate) {
```

Con 60 kg restano 20.000 g per lato: ora il 20 entra e il resto va a 0. Lo stesso vale per l'ultimo 1.250 di "22,5 kg" e "142,5 kg".

Test da aggiungere, che fallisce finché c'è il problema: **"70 kg: un 25 per lato"**. Il resto coincide esattamente con il disco più pesante, quindi ti aspetti `[25]`.

Checklist:
- i test devono essere 4 su 4 verdi;
- alla fine `remaining` deve valere 0;
- nessun disco deve comparire fuori ordine.

**Concetto:** errore off-by-one (condizione di confine `>` contro `>=`).
