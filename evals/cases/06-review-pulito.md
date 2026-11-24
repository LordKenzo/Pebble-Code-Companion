# 06 · REVIEW of a file that is fine

## Input
MODE: REVIEW
<bootstrap>
@include fixtures/prenota/bootstrap.md
</bootstrap>
<decisions>
@include fixtures/prenota/decisions.md
</decisions>
<file path="src/domain/cancellation.ts">
@include fixtures/prenota/src/cancellation.ts
</file>

## Expected
Must:
- say in a few lines that the file respects ADR-002
- at most one info-severity note (e.g. `booking` unused, or the constant duplicated with booking.ts if it mentions it)
Must not:
- flag invented errors or warnings
- fill the answer with generic advice
