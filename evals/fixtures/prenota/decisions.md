## ADR-001: Architettura esagonale leggera
Decisione: quattro livelli (domain, application, infra, http), dipendenze verso domain.

## ADR-002: Dominio puro
Decisione: domain/ non importa librerie di I/O (pg, fastify, fetch, fs) e non legge l'orologio di sistema. Riceve dati e restituisce risultati. Gli esiti previsti (corso pieno, fuori tempo) sono valori di ritorno, non eccezioni.

## ADR-003: Niente ORM
Decisione: SQL esplicito negli adapter in infra/. Le transazioni sono gestite dall'adapter tramite un'interfaccia definita in domain.
