## ADR-001: Calcolo puro separato dalla CLI
Stato: proposto
Contesto: il calcolo è la parte pericolosa e va testato senza passare dal terminale.
Decisione: un modulo `core` con sole funzioni pure (niente `process`, niente `console`) e un modulo `cli` che legge gli argomenti, chiama il core e stampa il risultato. La dipendenza va solo da cli a core.
Alternative scartate: un file unico, dove parsing e calcolo si mescolano e i test devono simulare `argv`; più livelli (servizi, repository), che sono troppi per un progetto senza I/O.
Conseguenze: core testabile in isolamento. Serve un po' di disciplina per non far trapelare logica nella CLI.

## ADR-002: Formule come funzioni con firma comune e registro per nome
Stato: proposto
Contesto: Epley, Brzycki e altre formule devono essere intercambiabili.
Decisione: ogni formula è una funzione con lo stesso tipo (peso e ripetizioni in ingresso, 1RM in uscita). Un registro le associa a un nome scelto con un'opzione della CLI, con un default.
Alternative scartate: classi con il pattern strategy, inutili senza stato; uno `switch` nella CLI, che sposta la scelta fuori dal core.
Conseguenze: per aggiungere una formula basta una funzione e una voce nel registro. I test si possono scrivere una volta e far girare su tutte le formule.

## ADR-003: Arrotondamento per difetto, aritmetica in grammi interi
Stato: proposto
Contesto: le percentuali producono decimali e il carico va reso componibile. Scegliere tra difetto e valore più vicino è una scelta di sicurezza.
Decisione: si arrotonda sempre per difetto al multiplo componibile più vicino, che oggi è 2,5 kg totali (1,25 per lato). Internamente si lavora in grammi interi e si converte in kg solo nell'output.
Alternative scartate: arrotondare al più vicino, che può superare la percentuale prevista (in palestra è meglio un chilo in meno); usare i float in kg, perché errori come 0,1 + 0,2 portano a carichi "quasi" componibili.
Conseguenze: i carichi non superano mai il target. L'output deve mostrare sia il target sia il carico reale, così la differenza è visibile.

## ADR-004: Casi anomali come risultati espliciti, non eccezioni silenziose
Stato: proposto
Contesto: carichi sotto i 20 kg, input non validi, ripetizioni troppe perché la stima sia affidabile. La scomposizione dei dischi richiede anche un'ipotesi sull'inventario.
Decisione: il core restituisce un risultato con un esito: ok, ok con avviso, oppure non valido. Sotto i 20 kg l'esito è «solo bilanciere» con avviso, mai dischi negativi. Gli input non validi (peso ≤ 0, ripetizioni non intere o ≤ 0, percentuali fuori da 1–100) danno un errore. Oltre 10 ripetizioni c'è un avviso di stima poco affidabile. La CLI traduce gli esiti in messaggi e in exit code diverso da 0 per gli errori. I dischi sono illimitati per taglio; i carichi operativi previsti sono inferiori a 999 kg.
Alternative scartate: lanciare eccezioni dal core, che rende il flusso meno leggibile e i test meno espliciti; ignorare i casi anomali, che produce output fuorvianti; gestire un inventario finito, che non corrisponde al requisito attuale.
Conseguenze: ogni anomalia è testabile come valore e la scomposizione non deve tenere conto della disponibilità dei dischi. I tipi di ritorno diventano un po' più ricchi.

## ADR-005: Test runner nativo `node:test`
Stato: proposto
Contesto: servono test e il vincolo è non usare framework.
Decisione: `node:test` con `node:assert`. I file `.ts` girano direttamente grazie al type stripping di Node (versione 22.18+ o 24 LTS).
Alternative scartate: Jest, che con TypeScript richiede configurazione pesante; Vitest, ottimo ma è una dipendenza che qui non serve.
Conseguenze: zero dipendenze di runtime per i test. Il type stripping vieta `enum` e parameter properties: usa union di stringhe. `tsc --noEmit` resta il controllo dei tipi.

