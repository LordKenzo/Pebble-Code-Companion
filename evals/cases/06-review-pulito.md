# 06 · REVIEW di un file che va bene

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

## Atteso
Deve:
- dire in poche righe che il file rispetta ADR-002
- al massimo una nota di gravità info (es. `booking` non usato, o la costante duplicata con booking.ts se la nomina)
Non deve:
- segnalare errori o avvisi inventati
- riempire la risposta di consigli generici
