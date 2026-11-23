# Architettura

Livelli: domain (puro) ← application (casi d'uso) ← infra (Postgres, orologio) / http (route).
Le dipendenze puntano verso domain.

src/
  domain/       regole, tipi, errori
  application/  casi d'uso: prenota, cancella
  infra/        adapter Postgres, orologio, email
  http/         route e validazione input
