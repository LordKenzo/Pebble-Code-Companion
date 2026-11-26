ADR-001 · Swift e SwiftUI per un'app nativa macOS. Swift con SwiftUI, si lavora con Xcode. Versioni minime macOS 14 e Xcode 15, per SwiftData (ADR-005).
ADR-002 · Separare la logica dalla finestra: un pacchetto Swift chiamato SupportCore (regole e salvataggio, senza finestre) e l'app SwiftUI che lo usa. Il salvataggio passa da un protocol.
ADR-003 · Test con le librerie incluse nella toolchain di Swift, lanciati con 'swift test'. Nessuna libreria esterna.
ADR-004 · Errori gestiti con validazione e un enum di errori, mai crash.
ADR-005 · Salvataggio locale con SwiftData, dietro il protocol; prima un archivio in memoria per i test.
