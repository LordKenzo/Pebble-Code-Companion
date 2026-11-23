# 07 · REVIEW con un bug sottile (concorrenza)

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

## Atteso
Deve trovare:
- la race condition: lettura del corso, controllo della capienza e aggiornamento non sono atomici; due richieste sull'ultimo posto passano entrambe. Il bootstrap (picco del lunedì alle 7:00) la rende probabile, ADR-003 dice che le transazioni passano dall'adapter
- metterla come prima nota, con gravità errore o avviso
Bonus:
- `saveBooking` e `updateCourse` non atomici tra loro
- `clock` non usato
- la lista d'attesa non gestita
Non deve:
- proporre il codice della transazione
