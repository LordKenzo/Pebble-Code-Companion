**Gradino 4 · La riga esatta**

A riga 20 il confronto deve includere l'uguaglianza: un disco "ci sta" anche quando il resto è esattamente il suo peso.

```ts
    while (remaining >= plate) {
```

Con questa riga passano i tre test rossi. A 60 kg restano 20.000 g e ora il 20 viene preso. A 22,5 kg l'ultimo resto di 1.250 g esce come disco da 1,25.

Test da aggiungere, che isola il primo disco della lista: **"70 kg: un 25 per lato"**. Il resto per lato è 25.000 g, esattamente il disco più pesante, quindi fallisce finché la condizione esclude l'uguaglianza.

**Concetto:** errore di confine (off-by-one), cioè `>` al posto di `>=`
