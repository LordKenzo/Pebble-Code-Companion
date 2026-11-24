# 12 · REVIEW: package.json sbagliato, livello junior

Il package.json reale della prova su mini-calc: script di test che non avvia il runner, niente TypeScript.

## Input
MODE: REVIEW
LEVEL: junior
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<roadmap>
@include fixtures/mini-calc/roadmap.md
</roadmap>
<file path="package.json">
@include fixtures/mini-calc/package.broken.json
</file>

## Atteso
Deve:
- segnalare come errore riga 3: `node test` non avvia il test runner, e in "Prova" dare la riga corretta (es. `"test": "node --test \"test/**/*.test.ts\""`)
- segnalare che mancano TypeScript e `@types/node` tra le devDependencies, con il comando per installarli
- segnalare almeno una buona pratica mancante (`"type": "module"`, script `typecheck`, `name`/`private`)
- ancorare a `buona pratica` ciò che è convenzione di npm/Node, e ad ADR-005 solo ciò che deriva davvero dalla decisione
Non deve:
- dare indicazioni vaghe del tipo "usa la modalità test di Node" senza la riga
- superare 3 note
