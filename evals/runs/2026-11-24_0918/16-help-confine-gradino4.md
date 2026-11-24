**Gradino 4 · La riga esatta**
A riga 20 la condizione deve accettare anche il caso in cui il resto è uguale al disco:

```ts
while (remaining >= plate) {
```

Questa riga sistema tutti e tre i rossi. A 22,5 kg restano 1.250 g e il disco da 1.250 viene saltato. A 60 kg il 20 non entra. A 142,5 kg manca l'ultimo 1,25.

Test da aggiungere: "40 kg: un 10 per lato". È un carico in cui il resto coincide esattamente con un solo disco. Fallisce finché la condizione resta `>`.

Prima di chiudere, controlla due cose: il ciclo deve finire con `remaining` a 0 su ogni carico componibile, e la somma di `perSide` × 2 + `BAR` deve dare `total`.

**Concetto:** errore off-by-one (condizione di confine `>` vs `>=`)
