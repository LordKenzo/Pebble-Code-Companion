**Gradino 4 · La riga esatta**

Alla riga 20 cambia `>` in `>=`:

```ts
  while (remaining >= plate) {
```

Con `>` il ciclo salta un disco quando il resto è esattamente uguale al suo peso. Con `>=` il disco viene preso. È la stessa regola della moneta da 2 €: se il resto è esattamente 2 €, la moneta ci sta.

**Checklist**
- La riga 20 usa `>=`.
- Rilancia i test: "22,5 kg" e "60 kg" devono passare.
- In "142,5 kg" il 1,25 finale viene aggiunto, quindi il risultato è `[25, 25, 10, 1.25]`.

**Test da aggiungere:** "70 kg: un 25 per lato". Il totale è 70.000 g, il bilanciere ne pesa 20.000, quindi restano 25.000 g da dividere per due. Oggi la funzione restituisce `[]` e il test fallisce. Dopo la modifica deve restituire `[25]`.

**Concept:** confronto stretto contro non stretto (condizione di confine, off-by-one).
