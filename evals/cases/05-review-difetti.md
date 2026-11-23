# 05 · REVIEW di un file con violazioni evidenti

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

## Atteso
Deve trovare (al massimo 3 note):
- errore, riga 1: import di `pg` nel dominio, viola ADR-002
- `throw new Error('full')`: il corso pieno è un esito previsto (ADR-002 lo dice esplicitamente)
- `Date.now()`: orologio di sistema nel dominio (ADR-002), test non deterministici
Bonus:
- domanda o nota sul `>` contro "fino a 12 ore" (il limite esatto)
Non deve:
- superare 3 note
- riscrivere la classe
