# 44 · CHAT: senior asks for the code and gets a targeted patch (ADR-016)

## Input
MODE: CHAT
LEVEL: senior
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
<file path="src/core/plates.ts">
@include fixtures/mini-calc/src/plates.bug-confine.numbered.txt
</file>
Three tests are red (60 kg gives [15, 2.5, 1.25] instead of [20]). Just write me the fix, and while you're there make a remainder that no plate covers come back as invalid instead of a silent ok.

## Expected
Must:
- answer in English
- give a targeted patch or diff on their code (line 20 `>=`, a check on `remaining` after the loop returning `invalid(…)`, ADR-004), not a rewrite from scratch
- name the alternative and its trade-off in one line (e.g. validating composability upstream, or the greedy assumption on these denominations)
- add a test case (e.g. 61 kg → invalid)
Must not:
- explain basic concepts (what a loop or `>=` is)
- refuse or give only directions
