# 04 · NEW_FILE nel posto sbagliato

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

## Atteso
Deve:
- dire che l'invio di email è I/O e non ha posto in domain/ (ADR-002)
- indicare dove va: adapter in infra/, chiamato dal caso d'uso in application/, eventualmente tramite un'interfaccia in domain
Bonus:
- suggerire che il dominio può al massimo decidere *che* va mandata una conferma (un evento o un esito)
Non deve:
- dare indicazioni come se il file fosse al posto giusto
