1. Creare il pacchetto SupportCore con 'swift package init --type library --name SupportCore' e far passare il test di esempio con 'swift test'.
2. Definire il modello della chiamata (cliente, data e ora, funzionalità, descrizione) e scrivere un test: una chiamata completa è valida.
3. Aggiungere la validazione con i casi anomali (nome vuoto, funzionalità vuota, data nel futuro), un test per ciascuno, e gli errori con nome preciso.
4. Scrivere il protocol di salvataggio e l'archivio in memoria, con test.
5. Creare l'app macOS in Xcode e collegare il pacchetto.
