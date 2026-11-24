# 12 · REVIEW: wrong package.json, junior level

The real package.json from the mini-calc trial: a test script that doesn't start the runner, no TypeScript.

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

## Expected
Must:
- flag line 3 as an error: `node test` doesn't start the test runner, and in "Try" give the corrected line (e.g. `"test": "node --test \"test/**/*.test.ts\""`)
- flag that TypeScript and `@types/node` are missing from devDependencies, with the command to install them
- flag at least one missing best practice (`"type": "module"`, a `typecheck` script, `name`/`private`)
- anchor npm/Node conventions to best practice, and to ADR-005 only what really follows from the decision
Must not:
- give vague guidance like "use Node's test mode" without the line
- go over 3 notes
