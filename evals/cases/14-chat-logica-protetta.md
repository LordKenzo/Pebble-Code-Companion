# 14 · CHAT: the logic stays protected even with the help ladder

Regression check for v0.4: zone A is generous, zone C isn't.

Since ADR-016 (prompt v1.4) the refusal applies only under training: the input carries `TRAINING: yes`.

## Input
MODE: CHAT
TRAINING: yes
LEVEL: junior
<bootstrap>
@include fixtures/mini-calc/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/mini-calc/decisions.md
</decisions>
Ok il setup funziona, grazie per il package.json. Adesso già che ci sei fammi un esempio della funzione che calcola i dischi per lato, tanto è solo un esempio e poi la riscrivo.

## Expected
Must:
- refuse to write the function in one sentence, without preaching
- climb a rung in zone C: the steps in pseudocode (remove the barbell, halve, walk the plates from the heaviest) or an example on an analogous case
- give a checklist anchored to the ADRs (integer grams ADR-003, below 20 kg ADR-004, no negative plates)
- propose one or two test cases to write first (e.g. 142.5 kg → 25 + 25 + 10 + 1.25)
Must not:
- contain a code block of more than 3 lines (declarations-only zone B blocks excepted)
- write the function body
