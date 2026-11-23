# Percorso

Scritto a mano per provare la vista Percorso (roadmap di Pebble, fase 2, passo 2).
Per usarlo: copialo in mini-calc/.pebble/percorso.md.

## Passo 1 · Setup
- [ ] Installa TypeScript e i tipi di Node
  fare: npm install -D typescript @types/node
  fatto quando: file package.json
- [ ] Script test e typecheck
  fare: "test" con node --test, "typecheck" con tsc --noEmit (ADR-005)
  fatto quando: a mano
- [ ] Un primo test che passa
  fare: un test banale che si chiama "il runner funziona", solo per vedere partire il runner
  fatto quando: test "il runner funziona"

## Passo 2 · Dischi per lato
- [ ] Scrivi i test dei dischi
  fare: 20, 22,5, 60 e 142,5 kg, più uno sotto i 20 kg. Rossi all'inizio, è normale.
  fatto quando: file test/core/plates.test.ts
- [ ] Crea src/core/plates.ts
  fare: livello core, niente console né process (ADR-001), grammi interi (ADR-003)
  fatto quando: file src/core/plates.ts esporta platesFor
- [ ] Implementa platesFor
  fare: togli il bilanciere, dividi per due, scorri i dischi dal più pesante
  firma: platesFor(total: Grams): Result<PlateLoad>
  fatto quando: test "20 kg" "22,5 kg" "60 kg" "142,5 kg"
  fatto quando: nessun errore in src/core/plates.ts
- [ ] Caso sotto i 20 kg
  fare: solo bilanciere con avviso, mai dischi negativi (ADR-004)
  fatto quando: test "15 kg"
- [ ] Rileggi con Pebble
  fare: review del file finito, rispetto agli ADR e alle buone pratiche
  fatto quando: a mano

## Passo 3 · Arrotondamento
- [ ] Arrotonda per difetto al carico componibile
  fare: in grammi interi; 84,9 kg diventa 82,5 kg (ADR-003)
  fatto quando: test "84,9 kg" "85 kg"
