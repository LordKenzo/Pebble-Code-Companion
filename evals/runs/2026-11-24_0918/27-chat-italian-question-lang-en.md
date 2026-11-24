Il problema non è il grammo in sé, ma come il computer rappresenta i numeri con la virgola.

**Cosa succede con i kg decimali**

JavaScript usa numeri in virgola mobile binaria. Molti decimali "puliti" per noi, come 0.1 o 4.35, in binario non si rappresentano esattamente. Per questo vengono approssimati:

```js
0.1 + 0.2   // 0.30000000000000004
4.35 * 100  // 434.99999999999994
```

Nel tuo progetto il secondo caso è quello pericoloso. L'ADR-003 dice di **arrotondare sempre per difetto**. Immagina un carico che dovrebbe venire esattamente 62.5 kg ma esce 62.49999999. Arrotondando per difetto scendi a 60 kg: perdi un gradino intero da 2.5 kg per un errore invisibile. Anche il controllo "è un multiplo di 2.5?" diventa inaffidabile, perché il resto della divisione non viene mai esattamente zero.

**Cosa cambia con i grammi interi**

Gli interi sono esatti, fino a circa 9 milioni di miliardi. Il carico massimo previsto è 999 kg (ADR-004), cioè 999 000 g, molto sotto quel limite. Con i grammi:
- il passo è 2500 g e il resto modulo 2500 è esatto;
- l'arrotondamento per difetto fa esattamente quello che deve, senza sorprese;
- i test confrontano numeri interi con `assert.strictEqual`, senza tolleranze.

Il principio si chiama **rappresentazione esatta nel dominio**: scegli un'unità in cui i valori del problema sono interi. È lo stesso motivo per cui i sistemi di pagamento lavorano in centesimi. Per approfondire, cerca "floating point precision money cents".

**Sul tuo `units.ts`**

Il `Math.round` alla riga 5 è corretto, e non contraddice l'ADR-003. Lì non stai arrotondando un carico: stai solo ripulendo il rumore della conversione al confine (`kg * 1000` può dare 62499.99999). L'arrotondamento per difetto di sicurezza avviene dopo, sui grammi.

Un limite da sapere (`best practice`): `type Grams = number` alla riga 2 è solo un alias, quindi TypeScript ti lascia passare dei kg dove servono grammi senza segnalarlo. Per avere un controllo vero puoi usare un *branded type*, cioè un tipo che il compilatore distingue da un normale `number`. Se ti interessa, lo vediamo quando scriviamo le firme del core.
