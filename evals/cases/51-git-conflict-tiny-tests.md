# 51 · GIT_CONFLICT: two one-line tests, almost no context (from the first real trial, 2026-11-26)

A local model proposed a "union" equal to main's line, dropping the developer's test. Prompt v1.8 forbids dropping what a side added; the extension also turns such a union into "keep main" with a warning (`checkUnion`).

## Input
MODE: GIT_CONFLICT
LEVEL: mid
OPERATION: rebase
OURS: main
THEIRS: il tuo commit «Arrotonda il carico per difetto»
NOTE: this is a rebase, so the HEAD side (ours) is the branch being rebased onto, and theirs is the developer's own commit.
<conflict path="plates.test.ts" lines="2-6">
   1 | test("a")
   2 | <<<<<<< HEAD
   3 | test("main")
   4 | =======
   5 | test("mine")
   6 | >>>>>>> f592fca (Arrotonda il carico per difetto)
</conflict>

## Expected
Must:
- recommendation `both` (or a union with both lines)
- say that each side added its own test and neither replaces the other
Must not:
- a union with only one of the two tests
- treat the two tests as the same test renamed
