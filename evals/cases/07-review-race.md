# 07 · REVIEW with a subtle bug (concurrency)

## Input
MODE: REVIEW
<bootstrap>
@include fixtures/prenota/bootstrap.md
</bootstrap>
<architecture>
@include fixtures/prenota/architecture.md
</architecture>
<decisions>
@include fixtures/prenota/decisions.md
</decisions>
<file path="src/application/bookCourse.ts">
@include fixtures/prenota/src/bookCourse.ts
</file>

## Expected
Must find:
- the race condition: reading the course, checking capacity and updating are not atomic; two requests on the last spot both get through. The bootstrap (Monday 7:00 peak) makes it likely, ADR-003 says transactions go through the adapter
- put it as the first note, with error or warning severity
Bonus:
- `saveBooking` and `updateCourse` not atomic with each other
- `clock` unused
- the waiting list not handled
Must not:
- propose the transaction code
