# 08 · TESTS on the domain rules

## Input
MODE: TESTS
<bootstrap>
@include fixtures/prenota/bootstrap.md
</bootstrap>
<file path="src/domain/booking.ts">
@include fixtures/prenota/src/booking.v2.ts
</file>

## Expected
Must:
- list 4-8 cases as sentences, labelled base/limit/error/edge
- include: booked = capacity, cancellation at exactly 12 hours, just under 12 hours
- put the edge cases first and say which one to start from
Bonus:
- daylight saving time, course already started, zero capacity
Must not:
- write the test code
