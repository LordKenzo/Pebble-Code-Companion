**Gradino 4 · La riga esatta**
Sei in allenamento, quindi niente funzione completa: questo è l'ultimo gradino. Basta cambiare la condizione a riga 20:

```ts
while (remaining >= plate) {
```

Checklist:
- con `>=` un disco viene usato anche quando il resto è esattamente uguale al suo peso;
- 60 kg: per lato restano 20.000 g e il 20 entra subito;
- 22,5 kg e 142,5 kg: l'ultimo resto è 1.250 g, che ora entra.

Test da aggiungere: «70 kg: un 25 per lato» con atteso `[25_000]`. Con `>` fallisce (dà 20 + 5), con `>=` passa.

**Concetto:** condizione di confine (off-by-one)
