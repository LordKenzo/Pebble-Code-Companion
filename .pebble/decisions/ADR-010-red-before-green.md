## ADR-010: A test counts more if Pebble has seen it fail before passing
Status: proposed
Context: a green test doesn't prove that the code is correct. With a test that checks nothing (`assert.ok(true)` named "60 kg") the task would tick anyway. The checkbox would give a false sense of safety, and in a teaching tool that is the worst harm.
Decision: for every test named in `done when:`, Pebble remembers whether it has ever seen it red, in local state ignored by git (ADR-002).
- **Red, then green**: the condition holds in full.
- **Green without ever having been red**: the task ticks anyway, but with a warning: "green, but I've never seen it fail". The advice is to break the code for a moment to see the test turn red.
- **With `pebble.path.requireRedFirst`** (off by default) the warning becomes a block: the task stays open until the test has been seen failing.
- **The words are honest**: a ticked box means "your tests pass", not "the code is correct".
On top of that, the task's final review ("Review with Pebble") also checks the tests: whether each one checks what its name promises, and which case is missing.
Alternatives ruled out: code coverage (it says what was executed, not what was checked); mutation testing (expensive, and too much for a learner); always blocking (it punishes people who write the test after the code, which is a legitimate way to learn).
Consequences: `core/path` also receives the test history (seen red or not) and uses it in `evaluate`. Local state is lost when you change computer: the warning comes back until the test fails again. That's fine, because it's a help and not a rule.
