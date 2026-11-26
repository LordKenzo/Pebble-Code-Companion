**main** vuole `test("main")`, mentre il tuo commit «Arrotonda il carico per difetto» aggiunge `test("mine")`. Sono due test nuovi e indipendenti: non si escludono.

**Cosa succede se ne tieni solo uno:** perdi il test dell'altro lato, e il lavoro di quel lato non risulta più coperto dai test.

**Raccomandazione:** `both`. Tieni entrambi, uno dopo l'altro.

**Risoluzione proposta** (sostituisce le righe 2-6, senza marcatori):

```ts
test("main")
test("mine")
```

**Da verificare dopo aver risolto:** lancia la suite di test e controlla che compaiano sia `main` sia `mine`, e che nessun marcatore `<<<<<<<`, `=======` o `>>>>>>>` sia rimasto nel file. Poi prosegui con `git add plates.test.ts` e `git rebase --continue`.
