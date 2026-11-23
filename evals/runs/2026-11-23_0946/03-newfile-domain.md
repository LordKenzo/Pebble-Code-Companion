**Ruolo**
Cuore del dominio prenotazioni, livello `domain` (`ADR-001`). Qui vivono le regole che dicono se una prenotazione o una cancellazione è ammessa. È il file che i casi d'uso in `application/` (prenota, cancella) interrogano prima di toccare il database.

**Dovrebbe**
- Definire i tipi del dominio: la prenotazione e i dati del corso necessari a decidere, come capienza, posti occupati e orario di inizio. `ADR-002`
- Esporre funzioni pure che, dato uno stato e un istante, restituiscono un esito. Per esempio: posso prenotare? posso cancellare? `ADR-002`
- Modellare gli esiti previsti come un tipo unione discriminato (ok / corso pieno / fuori tempo / già prenotato…), così il chiamante è costretto a gestirli tutti. `ADR-002`
- Restare piccolo. Se iniziano a convivere regole del corso e regole della prenotazione, valuta di spostarle in un `course.ts` separato. `ADR-001`

**Non dovrebbe**
- Chiamare `new Date()` o `Date.now()`. L'istante corrente entra come parametro, e lo fornisce l'adapter orologio in `infra/`. `ADR-002`
- Importare `pg`, `fastify`, `fetch`, `fs` o qualunque cosa faccia I/O, nemmeno per i tipi. `ADR-002`
- Lanciare eccezioni per corso pieno o fuori tempo. Le eccezioni restano per i casi davvero imprevisti, come le violazioni di invarianti. `ADR-002`
- Contenere SQL o la logica di transazione. Al massimo può definire l'interfaccia della transazione, ma meglio tenerla in un file dedicato come `domain/ports.ts`, così `booking.ts` resta solo regole. `ADR-003`

**Spunto**
```ts
function canBook(course: CourseSnapshot, userId: UserId, now: Date): BookingDecision
```

**Domanda**
La regola "fuori tempo" è una finestra fissa prima dell'inizio del corso (per esempio 2 ore) o cambia da corso a corso? Se cambia, il limite deve far parte di `CourseSnapshot` e non essere una costante nel file.
