**Concept:** a merge conflict means Git found two changes to the same lines and can't decide which to keep, so it asks you.

**Sides:** `feature/rounding` (your branch) and `main`.

**What each side wanted:**
- **feature/rounding** added a test checking that 84 kg rounds down to 82.5 kg.
- **main** added a test checking that custom plates work: 30 kg with 5 kg plates gives `[5_000]` per side.

**Do they exclude each other?** No. They test different things and don't contradict each other. If you keep only one side, you lose a test that someone wrote on purpose.

**Recommendation:** `both`. Keep both tests, one after the other.

**Check:** after resolving, run the test suite. Both new tests should appear and pass, and the file should contain no `<<<<<<<`, `=======` or `>>>>>>>` lines.
