# 35 · ADOPT: a Flask API with pytest (English)

Not TypeScript: a Python service with a domain exception, a TODO that a red test is waiting for.

## Input
MODE: ADOPT
LEVEL: mid
<files>
@include fixtures/adopt-flask/tree.txt
</files>
<file path="pyproject.toml">
@include fixtures/adopt-flask/pyproject.numbered.txt
</file>
<file path="app/services/orders.py">
@include fixtures/adopt-flask/orders.numbered.txt
</file>
<file path="app/routes.py">
@include fixtures/adopt-flask/routes.numbered.txt
</file>
<file path="tests/test_orders.py">
@include fixtures/adopt-flask/test_orders.numbered.txt
</file>
<readme>
@include fixtures/adopt-flask/readme.md
</readme>
<git>
@include fixtures/adopt-flask/git.txt
</git>
<tests>
@include fixtures/adopt-flask/tests.txt
</tests>
Answer only with a JSON object with the fields: reading, name, what, stack (list), constraints (list), unknowns (list), decisions (list of { title, context, decision, consequences, evidence (list) }), conflicts (list of { topic, question }), layers, folders, paths (list), question.

## Expected
Must:
- decisions: Flask with blueprints, SQLAlchemy, pytest (+ pytest-flask), services layer raising a domain exception (`OrderError`) that routes turn into 400, Decimal for money; each with evidence
- no invented conflict (the error style is consistent), or at most a well-founded one
- paths: cap the discount at 50% (the TODO the red test `test_apply_discount_is_capped` waits for)
- all text in English
Must not:
- propose a different framework or test runner
- write code
