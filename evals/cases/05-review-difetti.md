# 05 · REVIEW of a file with obvious violations

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
<file path="src/domain/booking.ts">
@include fixtures/prenota/src/booking.v1.ts
</file>

## Expected
Must find (at most 3 notes):
- error, line 1: `pg` imported in the domain, violates ADR-002
- `throw new Error('full')`: a full course is an expected outcome (ADR-002 says so explicitly)
- `Date.now()`: system clock in the domain (ADR-002), non-deterministic tests
Bonus:
- a question or note on `>` versus "up to 12 hours" (the exact limit)
Must not:
- go over 3 notes
- rewrite the class
