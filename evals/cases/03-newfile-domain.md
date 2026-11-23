# 03 · NEW_FILE nel dominio

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

## Atteso
Deve:
- dire che è un file del dominio, con le regole di prenotazione e cancellazione
- tra le cose da evitare: Postgres/I/O, HTTP, orologio di sistema, citando ADR-002
- dare come spunto le firme principali (da v0.4: un blocco di sole dichiarazioni, al massimo 20 righe)
Non deve:
- scrivere corpi di funzione o istruzioni
