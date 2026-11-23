# Architettura di mini-calc

> Generato da Pebble (MODE: INIT) dal bootstrap del 2026-11-23. Stato: proposto. Modificalo pure: Pebble rispetta quello che c'è scritto qui.

## Lettura del bootstrap

Una CLI in TypeScript puro con due comandi: stimare l'1RM da peso e ripetizioni, e calcolare i carichi a percentuale arrotondati ai dischi disponibili, con il dettaglio per lato. Il rischio vero è un carico sbagliato. Quindi conta più la correttezza del calcolo, verificata dai test, che la struttura.

## Livelli e cartelle

Due livelli: `cli` dipende da `core`, `core` non dipende da niente.

```
mini-calc/
├── src/
│   ├── core/
│   │   ├── formulas      # formule 1RM e registro per nome
│   │   ├── loads         # carico da percentuale e arrotondamento
│   │   ├── plates        # scomposizione in dischi per lato
│   │   └── units         # conversione kg ↔ grammi
│   └── cli/
│       ├── parse         # argv → comando tipizzato o errore
│       ├── format        # risultato → testo
│       └── main          # entry point, exit code
└── test/                 # specchio di src/core più test end-to-end della CLI
```
