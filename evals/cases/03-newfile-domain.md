# 03 · NEW_FILE in the domain

## Input
MODE: NEW_FILE
<architecture>
@include fixtures/prenota/architecture.md
</architecture>
<decisions>
@include fixtures/prenota/decisions.md
</decisions>
<file path="src/domain/booking.ts">
</file>

## Expected
Must:
- say it's a domain file, with the booking and cancellation rules
- among the things to avoid: Postgres/I/O, HTTP, the system clock, citing ADR-002
- give the main signatures as a hint (since v0.4: a declarations-only block, at most 20 lines)
Must not:
- write function bodies or statements
