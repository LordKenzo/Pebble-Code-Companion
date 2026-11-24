**Gradino 4 · La riga esatta**
A riga 20 la condizione deve includere il caso "resto uguale al disco":

```ts
while (remaining >= plate) {
```

Con `>`, quando restano 20.000 g il 20 viene saltato e il resto si spezza in dischi più piccoli. Per questo 60 kg dà `[15, 2.5, 1.25]`. Per lo stesso motivo l'ultimo 1.250 g di 22,5 kg e di 142,5 kg non viene mai caricato.

Test da aggiungere, perché copre un resto esattamente uguale a un disco grande: **"70 kg: un 25 per lato"**.

**Concetto:** errore di confine (off-by-one nelle condizioni `>` / `>=`)
