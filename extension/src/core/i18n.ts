/**
 * Pebble multilingua (ADR-012): oggi italiano e inglese, scelti con pebble.language.
 * Ogni catalogo ha la stessa forma per tutte le lingue: TypeScript segnala una frase mancante.
 * Per aggiungere una lingua: un valore in LANGS e una voce in ogni catalogo.
 */
export const LANGS = ["it", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** "auto" segue la lingua dell'interfaccia di VS Code; tutto ciò che non è italiano diventa inglese. */
export function resolveLang(setting: string | undefined, uiLanguage: string): Lang {
  if (setting && (LANGS as readonly string[]).includes(setting)) return setting as Lang;
  return uiLanguage.toLowerCase().startsWith("it") ? "it" : "en";
}

const q = (xs: readonly string[]) => xs.map((x) => `"${x}"`).join(", ");

// ---------- percorso: motivi, condizioni spiegate (core/path) ----------

const pathIt = {
  noStep: "Senza passo",
  manual: "si spunta a mano",
  invalid: (raw: string) => `condizione non riconosciuta: ${raw}`,
  testsNotRun: "test non ancora lanciati",
  testMissing: (names: string[]) => `test non trovato: ${q(names)}`,
  testRed: (names: string[]) => `test rosso: ${q(names)}`,
  neverRed: (names: string[]) => `verde, ma non l'ho mai visto fallire: ${q(names)}. Rompi il codice un momento e guarda se il test se ne accorge.`,
  filesNotChecked: "file non ancora controllati",
  fileMissing: (p: string) => `manca ${p}`,
  fileNoExport: (p: string, xs: string[]) => `${p} non esporta ${xs.join(", ")}`,
  errorsNotChecked: "errori non ancora controllati",
  errorsIn: (n: number, p: string) => `${n} ${n === 1 ? "errore" : "errori"} in ${p}`,
  depsNotChecked: "dipendenze non ancora controllate",
  depMissing: (xs: string[]) => `manca la dipendenza ${xs.join(", ")} (npm install -D ${xs.join(" ")})`,
  // condizioni in breve, per il dettaglio del compito e il contesto del modello
  descTests: (names: string[]) => (names.length === 1 ? `passa un test che si chiama "${names[0]}"` : `passano i test che si chiamano ${q(names)}`),
  descFile: (p: string, xs: string[]) => (xs.length ? `${p} esporta ${xs.join(", ")}` : `esiste ${p}`),
  descNoErrors: (p: string) => `nessun errore in ${p}`,
  descDependency: (xs: string[]) => `${xs.join(", ")} tra le dipendenze`,
  descManual: "a mano",
  descInvalid: (raw: string) => `non riconosciuta: ${raw}`,
  // "Cosa mi aspetto"
  expTests1: (name: string) => `Un test verde che si chiama "${name}" (basta che il nome contenga queste parole).`,
  expTestsN: (names: string[]) => `${names.length} test verdi, uno per caso, con questi nomi: ${q(names)} (basta che il nome li contenga).`,
  expFileExports: (p: string, xs: string[]) => `Il file ${p}, che esporta ${xs.join(", ")}.`,
  expFile: (p: string) => `Il file ${p} (basta che esista).`,
  expNoErrors: (p: string) => `Nessun errore di TypeScript in ${p}: niente sottolineature rosse nell'editor.`,
  expDependency1: (n: string) => `${n} installato nel progetto, cioè presente in package.json.`,
  expDependencyN: (xs: string[]) => `${xs.join(", ")} installati nel progetto, cioè presenti in package.json.`,
  expManual: "Lo spunti tu, quando ti sembra fatto.",
  expInvalid: (raw: string) => `Questa condizione in percorso.md non la capisco: "${raw}". Scrivila come test "nome", file percorso, nessun errore in percorso, dipendenza nome oppure a mano.`,
  // riassunto accanto al titolo
  sumManual: "a mano",
  sumTests: (n: number) => `${n} test`,
  sumFile: "file",
  sumNoErrors: "0 errori",
  sumDependency: "dipendenze",
  sumInvalid: "condizione da correggere",
  // chiavi scritte da Pebble in percorso.md
  keyTodo: "fare",
  keySignature: "firma",
  keyDone: "fatto quando",
  condManual: "a mano",
  stepWord: "Passo",
  pathTitle: "Percorso",
};

const pathEn: typeof pathIt = {
  noStep: "No step",
  manual: "ticked by hand",
  invalid: (raw) => `unrecognised condition: ${raw}`,
  testsNotRun: "tests not run yet",
  testMissing: (names) => `test not found: ${q(names)}`,
  testRed: (names) => `red test: ${q(names)}`,
  neverRed: (names) => `green, but I have never seen it fail: ${q(names)}. Break the code for a moment and see whether the test notices.`,
  filesNotChecked: "files not checked yet",
  fileMissing: (p) => `${p} is missing`,
  fileNoExport: (p, xs) => `${p} does not export ${xs.join(", ")}`,
  errorsNotChecked: "errors not checked yet",
  errorsIn: (n, p) => `${n} ${n === 1 ? "error" : "errors"} in ${p}`,
  depsNotChecked: "dependencies not checked yet",
  depMissing: (xs) => `missing dependency ${xs.join(", ")} (npm install -D ${xs.join(" ")})`,
  descTests: (names) => (names.length === 1 ? `a test named "${names[0]}" passes` : `the tests named ${q(names)} pass`),
  descFile: (p, xs) => (xs.length ? `${p} exports ${xs.join(", ")}` : `${p} exists`),
  descNoErrors: (p) => `no errors in ${p}`,
  descDependency: (xs) => `${xs.join(", ")} among the dependencies`,
  descManual: "by hand",
  descInvalid: (raw) => `unrecognised: ${raw}`,
  expTests1: (name) => `A green test named "${name}" (the name just needs to contain these words).`,
  expTestsN: (names) => `${names.length} green tests, one per case, with these names: ${q(names)} (the names just need to contain them).`,
  expFileExports: (p, xs) => `The file ${p}, exporting ${xs.join(", ")}.`,
  expFile: (p) => `The file ${p} (it just needs to exist).`,
  expNoErrors: (p) => `No TypeScript errors in ${p}: no red squiggles in the editor.`,
  expDependency1: (n) => `${n} installed in the project, that is listed in package.json.`,
  expDependencyN: (xs) => `${xs.join(", ")} installed in the project, that is listed in package.json.`,
  expManual: "You tick it yourself, when it feels done.",
  expInvalid: (raw) => `I don't understand this condition in percorso.md: "${raw}". Write it as test "name", file path, no errors in path, dependency name, or manual.`,
  sumManual: "by hand",
  sumTests: (n) => `${n} ${n === 1 ? "test" : "tests"}`,
  sumFile: "file",
  sumNoErrors: "0 errors",
  sumDependency: "dependencies",
  sumInvalid: "condition to fix",
  keyTodo: "do",
  keySignature: "signature",
  keyDone: "done when",
  condManual: "manual",
  stepWord: "Step",
  pathTitle: "Path",
};

export const PATH_TEXT: Record<Lang, typeof pathIt> = { it: pathIt, en: pathEn };

// ---------- scheletri dei file (core/scaffold) ----------

const scaffoldIt = {
  todo: "TODO(tu) Pseudocodice: trasformalo in codice, una riga alla volta.",
  exampleTest: "Un primo test completo, come esempio dello stile. Gli altri li scrivi tu.",
  todoTest: (name: string) => `TODO(tu) test: ${name}`,
};
const scaffoldEn: typeof scaffoldIt = {
  todo: "TODO(you) Pseudocode: turn it into code, one line at a time.",
  exampleTest: "A first complete test, as an example of the style. You write the others.",
  todoTest: (name) => `TODO(you) test: ${name}`,
};
export const SCAFFOLD_TEXT: Record<Lang, typeof scaffoldIt> = { it: scaffoldIt, en: scaffoldEn };

// ---------- bootstrap (core/bootstrap) ----------

const bootstrapIt = {
  defaultName: "Il mio progetto",
  title: (name: string) => `# ${name} — bootstrap`,
  what: "## Cosa devo fare",
  whatMissing: "_Da scrivere: cosa deve fare il progetto e per chi._",
  example: "Esempio d'uso che immagino:",
  constraints: "## Vincoli",
  constraintsMissing: "- _Da scrivere: linguaggio, piattaforma, regole che non si possono sbagliare._",
  unknowns: "## Non so ancora",
  unknownDefault: "Da dove cominciare",
  unknownStack: "Quale linguaggio e piattaforma usare",
  common: ["Come strutturare le cartelle", "Che test runner usare", "Come gestire gli errori e i casi anomali", "Quali librerie servono davvero", "Da dove cominciare"],
  guide: `# Nome del progetto — bootstrap

<!-- Scrivi con parole tue: non serve che sia perfetto. Pebble lo legge e ti propone come impostare il progetto. -->

## Cosa devo fare
<!-- Cosa deve fare il progetto e per chi, in poche righe. Se puoi, un esempio d'uso concreto. -->

## Vincoli
<!-- Linguaggio e piattaforma, librerie obbligatorie o vietate, e soprattutto le regole del dominio che non si possono sbagliare. -->
-

## Non so ancora
<!-- I dubbi: è proprio qui che Pebble ti aiuta di più. -->
- Come strutturare le cartelle
- Da dove cominciare
`,
};
const bootstrapEn: typeof bootstrapIt = {
  defaultName: "My project",
  title: (name) => `# ${name} — bootstrap`,
  what: "## What I want to build",
  whatMissing: "_To write: what the project should do, and for whom._",
  example: "How I imagine using it:",
  constraints: "## Constraints",
  constraintsMissing: "- _To write: language, platform, rules that must not go wrong._",
  unknowns: "## What I don't know yet",
  unknownDefault: "Where to start",
  unknownStack: "Which language and platform to use",
  common: ["How to structure the folders", "Which test runner to use", "How to handle errors and edge cases", "Which libraries are really needed", "Where to start"],
  guide: `# Project name — bootstrap

<!-- Write it in your own words: it does not need to be perfect. Pebble reads it and suggests how to set the project up. -->

## What I want to build
<!-- What the project should do and for whom, in a few lines. If you can, a concrete example of use. -->

## Constraints
<!-- Language and platform, required or forbidden libraries, and above all the domain rules that must not go wrong. -->
-

## What I don't know yet
<!-- Your doubts: this is exactly where Pebble helps the most. -->
- How to structure the folders
- Where to start
`,
};
export const BOOTSTRAP_TEXT: Record<Lang, typeof bootstrapIt> = { it: bootstrapIt, en: bootstrapEn };

/** Riga per i messaggi al modello: in quale lingua scrivere ogni testo, anche i campi dello schema. */
export const languageLine = (lang: Lang) =>
  lang === "it" ? "LINGUA: it — scrivi ogni testo in italiano, compresi i campi dello schema." : "LINGUA: en — write every text in English, including the schema fields.";

// ---------- la vista Percorso (media/path.js) ----------
// Stringhe con segnaposto {nome}: la webview riceve dati, non funzioni. Possono contenere HTML fidato.

const viewIt = {
  header: "Pebble · percorso",
  ofTotal: "{done} di {total}",
  position: "passo {num} di {total}",
  positionShort: "passo {num}",
  otherSteps: "Altri passi",
  showStep: "Mostra {name}",
  openInPath: "Apri nel percorso",
  markTodo: "Segna da fare",
  markDone: "Segna come fatto",
  stillOpen: "Ancora aperto: {reason}",
  expectTitle: "Cosa mi aspetto",
  testsGreenOf: "{passed} test verdi su {total}",
  toDo: "da fare",
  missingHint: "Pebble cerca un test il cui <b>nome</b> contiene quelle parole: è il testo tra virgolette in <code>test('…', …)</code>. {found} Rinomina il test e salva.",
  missingFound: "Ora i tuoi test si chiamano: {names}.",
  missingNone: "Non ho ancora trovato nessun test: controlla il comando in fondo al pannello.",
  prepareFile: "Prepara il file",
  prepareFileTitle: "Firme e pseudocodice in {path}",
  stepDone: "Passo fatto",
  nextStep: "Prossimo: <b>Passo {n} · {title}</b>. Pebble lo scompone in compiti partendo dal codice com'è adesso, e ti mostra la proposta prima di scriverla.",
  preparingStep: "Pebble sta preparando il passo {n}…",
  preparingStepShort: "Pebble sta preparando il passo…",
  prepareStep: "Prepara il passo {n}",
  checkNow: "Verifica ora",
  running: "Sto lanciando i test e guardando il compilatore…",
  testsFailed: "I test non sono partiti: {error}.",
  command: "Comando:",
  changeCommand: "Cambia comando",
  checkedAt: "Verificato alle {at} · {count}{red}. Le caselle si spuntano quando test e compilatore lo confermano.",
  testCount1: "1 test",
  testCountN: "{n} test",
  redOne: ", <span class=\"r\">1 rosso</span>",
  redMany: ", <span class=\"r\">{n} rossi</span>",
  allGreen: ", tutti verdi",
  neverChecked: "Le caselle si spuntano quando test e compilatore lo confermano: salva un file o {verify}. Puoi anche spuntarle tu.",
  noTasksTitle: "Il percorso non ha ancora compiti",
  noTasksText: "Aggiungi una riga <code>- [ ] titolo</code> sotto un passo <code>## …</code> in <code>.pebble/percorso.md</code>.",
  openPathFile: "Apri percorso.md",
  // sentiero d'avvio
  startHeader: "Pebble · si parte",
  startIntro: "Tre sassolini per partire. Pebble ti guida e ti propone, il codice lo scrivi tu.",
  stage1Title: "Racconta il progetto",
  stage1Todo: "Un <code>bootstrap.md</code>: cosa vuoi costruire, i vincoli, cosa non sai ancora.",
  stage1Done: "Il tuo <code>bootstrap.md</code> c'è.",
  openBootstrap: "Apri bootstrap.md",
  answerQuestions: "Rispondi a qualche domanda",
  writeItMyself: "Lo scrivo io nel file",
  stage2Title: "Pebble propone il piano",
  stage2Text: "Decisioni, architettura e roadmap in <code>.pebble/</code>. Le leggi, le discuti e le salvi tu.",
  proposePlan: "Proponi il piano",
  stage3Title: "Il primo passo",
  stage3Text: "Pebble scompone il passo 1 della roadmap in compiti piccoli, ognuno con quello che si aspetta.",
  tryNow: "Preferisci provare subito?",
  createExample: "Crea un percorso di esempio",
  // procedura guidata
  wizardTitle: "Racconta il progetto",
  wizardCount: "{i} di {n}",
  forExample: "Per esempio: {x}",
  back: "Indietro",
  cancel: "Annulla",
  next: "Avanti",
  nextOrSkip: "Avanti (o salta)",
  createBootstrap: "Crea bootstrap.md",
  otherPlaceholder: "Altro: scrivilo qui",
  otherDoubts: "Altri dubbi, uno per riga",
  questions: [
    { key: "name", kind: "line", title: "Come si chiama il progetto?", help: "Un nome di lavoro va benissimo, lo puoi cambiare quando vuoi.", example: "mini-calc" },
    { key: "what", kind: "text", title: "Cosa vuoi costruire, e per chi?", help: "Poche righe, con parole tue. È la cosa più importante.", example: "Un programma da riga di comando che aiuta a caricare il bilanciere in palestra." },
    { key: "example", kind: "text", optional: true, title: "Come lo useresti? Un esempio concreto", help: "Un comando, una schermata, un'azione. Una riga per esempio.", example: "mini-calc 1rm 100 5 → massimale stimato" },
    { key: "stack", kind: "chips", title: "Con quale linguaggio, su quale piattaforma?", help: "Se non lo sai, va bene: diventa uno dei dubbi da chiarire.", options: ["TypeScript su Node", "Python", "Web app con React", "Swift per iOS", "Non lo so ancora"] },
    { key: "rules", kind: "text", optional: true, title: "Ci sono regole che non si possono sbagliare?", help: "Le regole del dominio: è lì che un errore costa di più. Una per riga.", example: "Bilanciere da 20 kg; dischi da 25 a 1,25 kg, in coppia" },
    { key: "unknowns", kind: "checks", title: "Cosa non sai ancora?", help: "I dubbi sono il punto di partenza: è proprio lì che Pebble ti aiuta di più." },
    { key: "level", kind: "levels", title: "Quanta esperienza hai?", help: "Cambia come Pebble ti spiega le cose. Puoi modificarlo nelle impostazioni." },
  ] as { key: string; kind: string; title: string; help: string; example?: string; optional?: boolean; options?: string[] }[],
  levels: [
    ["entry", "Sto imparando", "spiegazioni semplici, ogni termine spiegato"],
    ["junior", "Ho scritto qualcosa", "il perché, con il nome dei principi"],
    ["mid", "Sono autonomo", "il giusto, senza ripetere l'ovvio"],
    ["senior", "Sono esperto", "asciutto: bug, decisioni, compromessi"],
  ] as [string, string, string][],
};

const viewEn: typeof viewIt = {
  header: "Pebble · path",
  ofTotal: "{done} of {total}",
  position: "step {num} of {total}",
  positionShort: "step {num}",
  otherSteps: "Other steps",
  showStep: "Show {name}",
  openInPath: "Open in path",
  markTodo: "Mark as to do",
  markDone: "Mark as done",
  stillOpen: "Still open: {reason}",
  expectTitle: "What I expect",
  testsGreenOf: "{passed} of {total} tests green",
  toDo: "to do",
  missingHint: "Pebble looks for a test whose <b>name</b> contains those words: it is the text in quotes in <code>test('…', …)</code>. {found} Rename the test and save.",
  missingFound: "Right now your tests are named: {names}.",
  missingNone: "I haven't found any test yet: check the command at the bottom of the panel.",
  prepareFile: "Prepare the file",
  prepareFileTitle: "Signatures and pseudocode in {path}",
  stepDone: "Step done",
  nextStep: "Next: <b>Step {n} · {title}</b>. Pebble breaks it into tasks from the code as it is now, and shows you the proposal before writing it.",
  preparingStep: "Pebble is preparing step {n}…",
  preparingStepShort: "Pebble is preparing the step…",
  prepareStep: "Prepare step {n}",
  checkNow: "Check now",
  running: "Running the tests and reading the compiler…",
  testsFailed: "The tests did not run: {error}.",
  command: "Command:",
  changeCommand: "Change command",
  checkedAt: "Checked at {at} · {count}{red}. Boxes tick themselves when tests and compiler agree.",
  testCount1: "1 test",
  testCountN: "{n} tests",
  redOne: ", <span class=\"r\">1 red</span>",
  redMany: ", <span class=\"r\">{n} red</span>",
  allGreen: ", all green",
  neverChecked: "Boxes tick themselves when tests and compiler agree: save a file or {verify}. You can also tick them yourself.",
  noTasksTitle: "The path has no tasks yet",
  noTasksText: "Add a line <code>- [ ] title</code> under a step <code>## …</code> in <code>.pebble/percorso.md</code>.",
  openPathFile: "Open percorso.md",
  startHeader: "Pebble · getting started",
  startIntro: "Three pebbles to get going. Pebble guides you and makes proposals, you write the code.",
  stage1Title: "Tell Pebble about the project",
  stage1Todo: "A <code>bootstrap.md</code>: what you want to build, your constraints, what you don't know yet.",
  stage1Done: "Your <code>bootstrap.md</code> is there.",
  openBootstrap: "Open bootstrap.md",
  answerQuestions: "Answer a few questions",
  writeItMyself: "I'll write it in the file",
  stage2Title: "Pebble proposes the plan",
  stage2Text: "Decisions, architecture and roadmap in <code>.pebble/</code>. You read them, discuss them and save them.",
  proposePlan: "Propose the plan",
  stage3Title: "The first step",
  stage3Text: "Pebble breaks step 1 of the roadmap into small tasks, each saying what it expects.",
  tryNow: "Rather try it right away?",
  createExample: "Create an example path",
  wizardTitle: "Tell Pebble about the project",
  wizardCount: "{i} of {n}",
  forExample: "For example: {x}",
  back: "Back",
  cancel: "Cancel",
  next: "Next",
  nextOrSkip: "Next (or skip)",
  createBootstrap: "Create bootstrap.md",
  otherPlaceholder: "Other: type it here",
  otherDoubts: "Other doubts, one per line",
  questions: [
    { key: "name", kind: "line", title: "What is the project called?", help: "A working name is fine, you can change it whenever you like.", example: "mini-calc" },
    { key: "what", kind: "text", title: "What do you want to build, and for whom?", help: "A few lines, in your own words. This is the most important part.", example: "A command-line tool that helps load the barbell at the gym." },
    { key: "example", kind: "text", optional: true, title: "How would you use it? A concrete example", help: "A command, a screen, an action. One line per example.", example: "mini-calc 1rm 100 5 → estimated one-rep max" },
    { key: "stack", kind: "chips", title: "Which language, on which platform?", help: "If you don't know, that's fine: it becomes one of the doubts to clear up.", options: ["TypeScript on Node", "Python", "Web app with React", "Swift for iOS", "I don't know yet"] },
    { key: "rules", kind: "text", optional: true, title: "Are there rules that must not go wrong?", help: "The domain rules: that's where a mistake costs the most. One per line.", example: "20 kg barbell; plates from 25 to 1.25 kg, in pairs" },
    { key: "unknowns", kind: "checks", title: "What don't you know yet?", help: "Doubts are the starting point: this is exactly where Pebble helps the most." },
    { key: "level", kind: "levels", title: "How much experience do you have?", help: "It changes how Pebble explains things. You can change it in the settings." },
  ],
  levels: [
    ["entry", "I'm learning", "simple explanations, every term explained"],
    ["junior", "I've written some code", "the why, with the principles named"],
    ["mid", "I'm autonomous", "just enough, without repeating the obvious"],
    ["senior", "I'm experienced", "terse: bugs, decisions, trade-offs"],
  ],
};

export const VIEW_TEXT: Record<Lang, typeof viewIt> = { it: viewIt, en: viewEn };

// ---------- notifiche del percorso, dei segnali e del test runner ----------

const noticeIt = {
  noRoadmap: "Pebble: manca .pebble/roadmap.md. Lancia «Pebble: Leggi il bootstrap e proponi il piano».",
  closeStepFirst: "Pebble: chiudi prima i compiti del passo corrente, poi preparo il prossimo.",
  preparingStep: (n: number, title: string) => `Pebble prepara il passo ${n} · ${title}…`,
  stepHasDone: (n: number) => `Pebble: il passo ${n} ha già compiti fatti, non lo riscrivo.`,
  droppedConditions: (n: number) => `(${n} condizioni scartate perché scritte male)`,
  question: (q: string) => `Domanda: ${q}`,
  stepProposal: (k: number, n: number, title: string, extra: string) => `Pebble propone ${k} compiti per il passo ${n} · ${title}. ${extra}`,
  accept: "Accetta",
  reviewEdit: "Revisiona e modifica",
  discard: "Scarta",
  stepAdded: (n: number) => `Pebble: passo ${n} aggiunto al percorso.`,
  stepFailed: (e: string) => `Pebble non è riuscito a preparare il passo: ${e}`,
  diffStepTitle: (n: number) => `Percorso: attuale ↔ passo ${n} proposto da Pebble`,
  openFolderFirst: "Pebble: apri prima la cartella di un progetto.",
  bootstrapExists: "bootstrap.md esiste già. Lo sostituisco con le tue risposte?",
  replace: "Sostituisci",
  bootstrapGuideWritten: "Pebble: scrivi il bootstrap con parole tue, poi premi «Proponi il piano».",
  bootstrapWritten: "Pebble: ecco il tuo bootstrap. Ritoccalo se vuoi, poi premi «Proponi il piano».",
  whichFile: "Quale file preparo?",
  fileHasCode: (rel: string) => `Pebble: ${rel} contiene già codice e non lo sovrascrivo. Se sei bloccato, metti il cursore su una riga e premi ⌥P.`,
  preparingFile: (rel: string) => `Pebble prepara ${rel}…`,
  droppedParts: (n: number) => ` Ho scartato ${n} ${n === 1 ? "parte che conteneva" : "parti che contenevano"} logica.`,
  fileProposal: (rel: string, note: string) => `Pebble propone lo scheletro di ${rel}: firme e pseudocodice, il codice lo scrivi tu.${note}`,
  createFile: "Crea il file",
  diffFileTitle: (rel: string) => `${rel}: scheletro proposto da Pebble`,
  fileFailed: (e: string) => `Pebble non è riuscito a preparare il file: ${e}`,
  pathChanged: "Pebble: il percorso è cambiato mentre lo spuntavi. Ho ricaricato la vista, riprova.",
  reviewInEditor: (what: string) => `${what}, non ancora salvato. Modificalo come vuoi e salva (⌘S / Ctrl+S) per confermare; per scartarlo annulla (⌘Z) o chiudi senza salvare.`,
  stepInEditor: "Il nuovo passo è nel percorso",
  skeletonInEditor: "Lo scheletro è nell'editor",
  // segnali e test runner
  restricted: "la cartella è in modalità con restrizioni, quindi non lancio i test. Considerala attendibile (Gestisci attendibilità dell'area di lavoro) e riprova",
  timeout: (s: number) => `i test non sono finiti entro ${s} secondi`,
  cannotRun: (cmd: string, e: string) => `non riesco a lanciare "${cmd}": ${e}`,
  exitCode: (code: number | null) => `uscito con codice ${code}`,
  noTap: (cmd: string) => `"${cmd}" non ha prodotto risultati in formato TAP`,
  jest: "il progetto usa Jest, che non produce TAP da solo: installa jest-tap-reporter e imposta pebble.path.testCommand",
  noRunner: "nel progetto non c'è ancora un test runner: per esempio npm install -D vitest",
};

const noticeEn: typeof noticeIt = {
  noRoadmap: "Pebble: .pebble/roadmap.md is missing. Run “Pebble: Read the bootstrap and propose the plan”.",
  closeStepFirst: "Pebble: finish the tasks of the current step first, then I'll prepare the next one.",
  preparingStep: (n, title) => `Pebble is preparing step ${n} · ${title}…`,
  stepHasDone: (n) => `Pebble: step ${n} already has completed tasks, I won't rewrite it.`,
  droppedConditions: (n) => `(${n} ${n === 1 ? "condition" : "conditions"} dropped because badly written)`,
  question: (q) => `Question: ${q}`,
  stepProposal: (k, n, title, extra) => `Pebble proposes ${k} tasks for step ${n} · ${title}. ${extra}`,
  accept: "Accept",
  reviewEdit: "Review and edit",
  discard: "Discard",
  stepAdded: (n) => `Pebble: step ${n} added to the path.`,
  stepFailed: (e) => `Pebble could not prepare the step: ${e}`,
  diffStepTitle: (n) => `Path: current ↔ step ${n} proposed by Pebble`,
  openFolderFirst: "Pebble: open a project folder first.",
  bootstrapExists: "bootstrap.md already exists. Replace it with your answers?",
  replace: "Replace",
  bootstrapGuideWritten: "Pebble: write the bootstrap in your own words, then press “Propose the plan”.",
  bootstrapWritten: "Pebble: here is your bootstrap. Touch it up if you like, then press “Propose the plan”.",
  whichFile: "Which file should I prepare?",
  fileHasCode: (rel) => `Pebble: ${rel} already contains code and I won't overwrite it. If you're stuck, put the cursor on a line and press Alt+P.`,
  preparingFile: (rel) => `Pebble is preparing ${rel}…`,
  droppedParts: (n) => ` I dropped ${n} ${n === 1 ? "part that contained" : "parts that contained"} logic.`,
  fileProposal: (rel, note) => `Pebble proposes the skeleton of ${rel}: signatures and pseudocode, you write the code.${note}`,
  createFile: "Create the file",
  diffFileTitle: (rel) => `${rel}: skeleton proposed by Pebble`,
  fileFailed: (e) => `Pebble could not prepare the file: ${e}`,
  pathChanged: "Pebble: the path changed while you were ticking it. I reloaded the view, try again.",
  reviewInEditor: (what) => `${what}, not saved yet. Edit it as you like and save (⌘S / Ctrl+S) to confirm; to discard it, undo (⌘Z) or close without saving.`,
  stepInEditor: "The new step is in the path",
  skeletonInEditor: "The skeleton is in the editor",
  restricted: "the folder is in Restricted Mode, so I won't run the tests. Trust it (Manage Workspace Trust) and try again",
  timeout: (s) => `the tests did not finish within ${s} seconds`,
  cannotRun: (cmd, e) => `I can't run "${cmd}": ${e}`,
  exitCode: (code) => `exited with code ${code}`,
  noTap: (cmd) => `"${cmd}" produced no results in TAP format`,
  jest: "the project uses Jest, which doesn't output TAP on its own: install jest-tap-reporter and set pebble.path.testCommand",
  noRunner: "the project has no test runner yet: for example npm install -D vitest",
};

export const NOTICE_TEXT: Record<Lang, typeof noticeIt> = { it: noticeIt, en: noticeEn };

/** Esempio di percorso, scritto quando il progetto non ne ha ancora uno. */
export const EXAMPLE_PATH: Record<Lang, string> = {
  it: `# Percorso

Una sezione per passo della roadmap, un compito per riga (ADR-007).
Sotto ogni compito: fare, firma, fatto quando. Le righe che Pebble non riconosce restano dove sono.

## Passo 1 · Setup
- [ ] Installa TypeScript e i tipi di Node
  fare: \`npm install -D typescript @types/node\`
  fatto quando: dipendenza typescript @types/node
- [ ] Un primo test che passa
  fare: un test banale che si chiama "il runner funziona", per verificare che il runner parta
  fatto quando: test "il runner funziona"
`,
  en: `# Path

One section per roadmap step, one task per line (ADR-007).
Under each task: do, signature, done when. Lines Pebble doesn't recognise stay where they are.

## Step 1 · Setup
- [ ] Install TypeScript and the Node types
  do: \`npm install -D typescript @types/node\`
  done when: dependency typescript @types/node
- [ ] A first passing test
  do: a trivial test named "the runner works", to check the test runner starts
  done when: test "the runner works"
`,
};

// ---------- il fumetto sulla riga (adapters/vscode/helpBalloon) ----------

const helpIt = {
  rungs: { 1: "Domanda", 2: "Direzione precisa", 3: "Esempio analogo", 4: "La riga esatta" } as Record<1 | 2 | 3 | 4, string>,
  label: (bar: string, rung: number, name: string) => `Pebble · ${bar} · gradino ${rung} di 4 · ${name}`,
  thinking: "_Ci penso…_",
  you: "Tu",
  prompt: "Rispondi a Pebble…",
  placeholder: "Scrivi la tua risposta alla domanda, poi premi Rispondi",
  noEditor: "Pebble: metti il cursore su una riga del tuo codice, poi premi Alt+P (⌥P su Mac).",
  atTop: "Pebble: sei già alla riga esatta. Se serve, chiedimi perché conta o un approfondimento.",
  line: (n: number) => `riga ${n}`,
  red: (n: number) => `${n} test ross${n === 1 ? "o" : "i"}`,
  concept: "Concetto",
  more: "Più concreto",
  why: "Perché conta?",
  deep: "Approfondisci",
  gotIt: "Ho capito",
  orReply: "_Oppure rispondi alla domanda qui sotto._",
  failed: (e: string) => `Non sono riuscito a rispondere: ${e}\n\nControlla provider e chiave in **Pebble: Impostazioni**, poi riprova.`,
};
const helpEn: typeof helpIt = {
  rungs: { 1: "Question", 2: "Precise direction", 3: "Analogous example", 4: "The exact line" },
  label: (bar, rung, name) => `Pebble · ${bar} · rung ${rung} of 4 · ${name}`,
  thinking: "_Thinking…_",
  you: "You",
  prompt: "Reply to Pebble…",
  placeholder: "Type your answer to the question, then press Reply",
  noEditor: "Pebble: put the cursor on a line of your code, then press Alt+P (Option+P on a Mac).",
  atTop: "Pebble: you're already at the exact line. If useful, ask me why it matters or for a deep dive.",
  line: (n) => `line ${n}`,
  red: (n) => `${n} red ${n === 1 ? "test" : "tests"}`,
  concept: "Concept",
  more: "More concrete",
  why: "Why it matters",
  deep: "Deep dive",
  gotIt: "Got it",
  orReply: "_Or answer the question below._",
  failed: (e) => `I couldn't answer: ${e}\n\nCheck the provider and key in **Pebble: Settings**, then try again.`,
};
export const HELP_TEXT: Record<Lang, typeof helpIt> = { it: helpIt, en: helpEn };
