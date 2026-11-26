A **conflict** happens when two branches changed the same lines of a file, and Git can't tell on its own which version to keep, so it asks you.

**ours**: Your branch `feature/rounding` adds a test that checks a load is rounded down to a weight you can actually build with plates: asking for 84 kg should give a total of 82.5 kg.

**theirs**: `main` adds a test for a new feature, custom plates: asking for 30 kg when only 5 kg plates are available should put one 5 kg plate on each side.

**explanation**: These two changes don't conflict in meaning. They are two separate tests that happened to land on the same line. If you keep only `feature/rounding`, you lose the test for custom plates, so nothing checks that feature anymore. If you keep only `main`, you lose the test that proves your rounding works.

**recommendation**: `both`. Delete the three marker lines (`<<<<<<< HEAD`, `=======`, `>>>>>>> main`) and keep both `test(...)` lines, one after the other. You can leave a blank line between them, like the other tests in the file.

**union**: null

**check**: Run the tests (`node --test`) and make sure both pass. This also confirms that the merged `platesFor` in `src/core/plates.ts` does both jobs: it rounds down, and it accepts the second argument with the list of plates.
