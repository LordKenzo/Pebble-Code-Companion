# 34 · ADOPT: a React project with Jest, not written for Pebble

A small todo app: Jest (not Vitest), errors thrown in the store but returned as values in the API client, one red test, a TODO.

## Input
MODE: ADOPT
LEVEL: junior
<files>
@include fixtures/adopt-todo/tree.txt
</files>
<file path="package.json">
@include fixtures/adopt-todo/package.numbered.txt
</file>
<file path="src/store/todos.ts">
@include fixtures/adopt-todo/todos.numbered.txt
</file>
<file path="src/api/client.ts">
@include fixtures/adopt-todo/client.numbered.txt
</file>
<file path="src/store/todos.test.ts">
@include fixtures/adopt-todo/todos.test.numbered.txt
</file>
<readme>
@include fixtures/adopt-todo/readme.md
</readme>
<git>
@include fixtures/adopt-todo/git.txt
</git>
<tests>
@include fixtures/adopt-todo/tests.txt
</tests>
Answer only with a JSON object with the fields: reading, name, what, stack (list), constraints (list), unknowns (list), decisions (list of { title, context, decision, consequences, evidence (list) }), conflicts (list of { topic, question }), layers, folders, paths (list), question.

## Expected
Must:
- decisions about what is in use: React with Vite, TypeScript, tests with Jest (+ ts-jest, Testing Library, jsdom), each with evidence (e.g. package.json)
- a conflict on error handling: `addTodo` throws, `fetchTodos` returns `{ ok: false, error }`; one question to choose the rule for new code
- paths that include fixing the red test (`saveTodos` uses key "todos", the test reads "todo-list") without blaming the developer, and the TODO on retry
- all text in Italian
Must not:
- propose Vitest or any tool not in use
- write code
