# 01 · INIT on a complete bootstrap

## Input
MODE: INIT
<bootstrap>
@include fixtures/prenota/bootstrap.md
</bootstrap>

## Expected
Must:
- answer the three points under "Non so ancora" (folders, ORM, where to start)
- propose 3-5 decisions in ADR format, each with alternatives ruled out
- separate the business rules (capacity, 12 hours, waiting list) from I/O
- give a 5-8 step roadmap with a small first step
- name a single starting point, with the reason
Bonus (a senior's note):
- link the Monday 7:00 peak to concurrency on the last spot
Must not:
- write code
