**Gradino 4 · La riga esatta**
A riga 20, il disco va aggiunto anche quando il resto è **uguale** al suo peso, non solo maggiore:

```ts
    while (remaining >= plate) {
```

Con `>` l'ultimo disco "che ci sta esattamente" viene sempre saltato. Per questo con 60 kg ricevi [15, 2.5, 1.25] invece di [20], e con 22,5 kg ricevi [].

Test da aggiungere, perché copre il confine in modo diretto: "70 kg: un 25 per lato". Qui il resto per lato è esattamente uguale al disco più pesante di `PLATES`.

**Concetto:** errore di confine (off-by-one) nelle condizioni di confronto
