# Roadmap

> Generato da Pebble (MODE: INIT) dal bootstrap del 2026-11-23. Stato: proposto. Modificalo pure: Pebble rispetta quello che c'è scritto qui.

1. **Setup**: `package.json`, `tsconfig` in modalità strict, script `test` e `typecheck`, un test banale che passa.
2. **Dischi per lato**: per un carico già componibile restituisce i dischi. Test su 20, 22,5, 60, 142,5 kg e su un carico sotto i 20.
3. **Arrotondamento**: da un target qualsiasi al carico componibile per difetto, in grammi. Test sui valori al limite (ad esempio 84,9 e 85).
4. **Carichi da percentuali**: un massimale più una lista di percentuali danno target, carico reale e dischi.
5. **Formule**: Epley e Brzycki dietro il registro, test con valori noti e con 1 ripetizione (che deve restituire il peso stesso).
6. **CLI**: parsing di `1rm` e `carichi`, messaggi d'errore ed exit code.
7. **Test end-to-end**: il processo viene lanciato con argomenti reali e si verifica l'output.

## Da dove partire

Fai il passo 1, poi scrivi subito i test di `plates`. È il punto dove un errore finisce direttamente sul bilanciere, ed è una funzione pura facile da verificare a mano.

Domanda: i dischi sono davvero illimitati per taglio, o in palestra ne hai un numero preciso (ad esempio solo due da 25)? Nel secondo caso l'algoritmo di `plates` cambia.
