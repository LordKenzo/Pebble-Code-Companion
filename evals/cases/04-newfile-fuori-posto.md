# 04 · NEW_FILE in the wrong place

## Input
MODE: NEW_FILE
<architecture>
@include fixtures/prenota/architecture.md
</architecture>
<decisions>
@include fixtures/prenota/decisions.md
</decisions>
<file path="src/domain/sendConfirmationEmail.ts">
</file>

## Expected
Must:
- say that sending email is I/O and doesn't belong in domain/ (ADR-002)
- say where it goes: an adapter in infra/, called by the use case in application/, possibly through an interface in domain
Bonus:
- suggest that the domain can at most decide *that* a confirmation must be sent (an event or an outcome)
Must not:
- give guidance as if the file were in the right place
