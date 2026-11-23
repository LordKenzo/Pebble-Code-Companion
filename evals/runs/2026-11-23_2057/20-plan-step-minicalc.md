**Lettura.** Nel messaggio mancano la riga `PASSO DA PREPARARE` e l'elenco `<files>`, e il percorso è vuoto. Quindi presumo che sia il **passo 1**: il progetto compila, un primo test passa e c'è il modulo `units`. Su `units` poggia tutta l'aritmetica in grammi (ADR-003). Ho messo l'impostazione del progetto prima dei test, perché senza di essa i test non girano.

---

### 1. Imposta il progetto

**todo:** crea le cartelle, il `package.json` e il `tsconfig.json` per far girare i `.ts` direttamente con `node:test` (ADR-005). Se chiedi a Node di eseguire i `.ts`, li legge togliendo i tipi: questo è il type stripping.

```sh
mkdir -p mini-calc/src/core mini-calc/src/cli mini-calc/test/core
cd mini-calc
npm init -y
npm install -D typescript @types/node
```

```json
{
  "name": "mini-calc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit",
    "check": "npm run typecheck && npm test"
  }
}
```
- `type: module`: usa gli import ES, come si aspetta il type stripping.
- `engines`: è la versione minima che esegue i `.ts` senza flag (ADR-005).
- glob tra virgolette: così lo espande Node e non la shell, quindi funziona anche su zsh.

Quando sostituisci il file, tieni il blocco `devDependencies` che ha scritto npm.

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```
- `allowImportingTsExtensions`: Node vuole `import … from "./units.ts"` con l'estensione.
- `erasableSyntaxOnly`: segnala `enum` e parameter properties, che il type stripping non supporta (ADR-005).
- `verbatimModuleSyntax`: obbliga a scrivere `import type`, che Node altrimenti non saprebbe rimuovere.

**doneWhen:** `file package.json` · `file tsconfig.json`

### 2. Scrivi i test di units

**todo:** in `test/core/units.test.ts` scrivi questi casi, partendo da quelli limite (ADR-003, bootstrap › Vincoli):
- "kgToGrams: 0.1 + 0.2 kg diventa 300 esatti" (limite)
- "kgToGrams: 1.25 kg diventa 1250" (limite, il disco più piccolo)
- "kgToGrams: 2.5 kg diventa 2500"
- "kgToGrams: 0 kg diventa 0" (bordo)
- "gramsToKg: 1250 diventa 1.25 kg"
- "andata e ritorno su tutti i dischi" (25 … 1.25 kg)

Usa `assert.strictEqual`, che confronta in modo esatto. È il principio della testabilità: ogni regola del bootstrap diventa un caso verificabile.

**doneWhen:** `file test/core/units.test.ts`

### 3. Implementa la conversione

**todo:** in `src/core/units.ts` scrivi due funzioni pure (ADR-001), che non leggono né stampano niente. Il risultato in grammi deve essere sempre un intero, anche quando l'input in kg porta decimali "sporchi" (ADR-003).

```ts
export type Grams = number; // sempre intero
export function kgToGrams(kg: number): Grams;
export function gramsToKg(grams: Grams): number;
```

**doneWhen:** `test "300 esatti" "diventa 1250" "diventa 2500" "0 kg diventa 0" "diventa 1.25 kg" "andata e ritorno"` · `file src/core/units.ts esporta kgToGrams`

### 4. Controlla i tipi

**todo:** lancia `npm run check`. Deve passare sia `tsc` sia `node --test`. Se `tsc` segnala un `import` senza `.ts` o senza `type`, è la configurazione del compito 1 che sta facendo il suo lavoro.

**doneWhen:** `nessun errore in src/core/units.ts` · `nessun errore in test/core/units.test.ts`

### 5. Rileggi con Pebble

**todo:** apri `units.ts` e chiedi una review. Controlleremo che nessun valore in kg con decimali arrivi oltre questo modulo.

**doneWhen:** `a mano`

---

Il passo 1 della tua roadmap è davvero «impalcatura + units», o avevi pianificato di partire da un altro modulo?
