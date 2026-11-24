## ADR-008: Tasks tick themselves from local signals: editor errors and TAP tests
Status: proposed
Context: a task must close when the tests and the compiler confirm it, without calling the model and without being tied to a single language.
Decision:
- **Compile errors**: read from VS Code with `vscode.languages.getDiagnostics()`. The language server has already computed them.
- **Tests**: Pebble runs a configurable command (`pebble.path.testCommand`, default `node --test --test-reporter=tap`, or Vitest when detected in `package.json`) and reads the TAP output. Each test is linked to a task by the name given in `done when:`.
- **When**: on save, with a delay of about 1 second, and with the "Check the path" command.
`core/path` contains a pure function `evaluate(tasks, signals)`: a test that goes red again reopens the task.
Alternatives ruled out: reading results from VS Code's Testing API (still experimental for tests run by other extensions); running `tsc` on every save (slow, and the editor already has the errors); asking the model whether the task is done (costly and unreliable).
Consequences: it works with any runner that produces TAP (node:test, Vitest, Jest and pytest with a plugin). Tests run on save must be fast: if the command exceeds a time limit, Pebble says so and falls back to manual checking.
