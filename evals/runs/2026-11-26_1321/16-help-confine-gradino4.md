**Gradino 4 · La riga esatta**
A riga 20 la condizione deve includere il caso di uguaglianza:

```ts
while (remaining >= plate) {
```

Con `>` un disco entra solo se avanza qualcosa dopo, quindi 20.000 g restanti scartano il 20. Con `>=` passano tutti e tre i test rossi.

Test da aggiungere: «70 kg: un 25 per lato». Il resto per lato è esattamente 25.000 g, cioè il primo disco della lista, e quel caso fallisce finché il confine è sbagliato.

Prima di chiudere il task, controlla:
- la somma di `perSide` × 2 + `BAR` è uguale a `total`;
- `remaining` vale 0 alla fine del ciclo.

**Concetto:** condizione al confine (off-by-one)
