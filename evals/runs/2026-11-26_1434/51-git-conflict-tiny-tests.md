```json
{
  "ours": "main ha aggiunto un nuovo test, `test(\"main\")`, subito dopo `test(\"a\")`.",
  "theirs": "Il tuo commit «Arrotonda il carico per difetto» ha aggiunto nello stesso punto un altro test, `test(\"mine\")`, probabilmente quello che verifica l'arrotondamento per difetto.",
  "explanation": "I due lati non si escludono: sono due test indipendenti che Git ha visto nella stessa riga. Se tieni solo main, perdi il test che copre il tuo arrotondamento e la modifica resta senza verifica. Se tieni solo il tuo, sparisce il test arrivato su main e quel comportamento smette di essere controllato.",
  "recommendation": "both",
  "union": null,
  "check": "Dopo aver tolto i marker, esegui `npx vitest run plates.test.ts` e controlla che nell'output compaiano sia `main` sia `mine` e che siano verdi. Poi continua con `git add plates.test.ts && git rebase --continue`."
}
```
