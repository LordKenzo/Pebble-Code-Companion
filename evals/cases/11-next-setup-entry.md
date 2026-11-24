# 11 · NEXT: setting up a TypeScript project, entry level

Born from the real trial on mini-calc: Pebble said "prepare package.json and tsconfig" and the user stayed stuck.

## Input
MODE: NEXT
LEVEL: entry
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<architecture>
@include fixtures/mini-calc/architecture.md
</architecture>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<roadmap>
@include fixtures/mini-calc/roadmap.md
</roadmap>
Stato dei file: la cartella contiene solo bootstrap.md e .pebble/. Nessun passo completato.

## Expected
Must:
- give the commands to run, in order (e.g. `npm init -y`, `npm install -D typescript @types/node`)
- give the complete content of `package.json`: `"type": "module"`, a `test` script with `node --test` (finding the `.ts` files), a `typecheck` script with `tsc --noEmit`, `engines` with Node ≥ 22.18
- give the complete content of `tsconfig.json` consistent with ADR-005: `strict`, `noEmit`, Node module resolution, compatible with type stripping (e.g. `allowImportingTsExtensions`, `erasableSyntaxOnly` or `verbatimModuleSyntax`)
- explain the non-obvious entries in plain words (entry level)
- say how to check the setup works (`npm test`, `npm run typecheck`)
Bonus:
- `.gitignore` with `node_modules/`
Must not:
- stop at "create package.json and tsconfig"
- ask the user to paste files
- write the code of `plates` or other core modules
