# 08 · TESTS sulle regole del dominio

## Input
MODE: TESTS
<bootstrap>
@include fixtures/prenota/bootstrap.md
</bootstrap>
<file path="src/domain/booking.ts">
@include fixtures/prenota/src/booking.v2.ts
</file>

## Atteso
Deve:
- elencare 4-8 casi come frasi, con etichette base/limite/errore/bordo
- includere: booked = capacity, cancellazione esattamente a 12 ore, appena sotto le 12 ore
- mettere prima i casi limite e indicare da quale partire
Bonus:
- ora legale, corso già iniziato, capienza zero
Non deve:
- scrivere il codice dei test
