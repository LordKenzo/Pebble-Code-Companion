import { z } from "zod";
import { numberLines } from "./context";
import type { ExperienceLevel, ProjectContext } from "./model";
import { projectBlocks } from "./modes";
import { isSignatureOnly } from "./policy";

/**
 * "Prepara il file" (ADR-003): il modello restituisce le parti dello scheletro, Pebble compone il testo.
 * Ogni parte viene controllata: il corpo delle funzioni contiene per costruzione solo commenti.
 * Nei file di test è ammesso un solo test completo, come esempio dello stile.
 */

export const Scaffold = z.object({
  imports: z.array(z.object({ names: z.array(z.string()), from: z.string() })).describe('Import: names come "ok", "type Result"'),
  constants: z
    .array(z.object({ name: z.string(), type: z.string().nullable(), value: z.string(), doc: z.string().nullable() }))
    .describe("Costanti con valori letterali presi dal bootstrap (numeri, stringhe, liste di numeri)"),
  types: z.array(z.object({ doc: z.string().nullable(), declaration: z.string() })).describe("Dichiarazioni export type / export interface, senza logica"),
  functions: z
    .array(
      z.object({
        doc: z.string().nullable(),
        signature: z.string().describe("Solo la firma: export function nome(parametri): Tipo"),
        pseudocode: z.array(z.string()).describe("Passi di pseudocodice in italiano, uno per riga"),
        question: z.string().nullable().describe("Una domanda su cui ragionare prima di scrivere, o null"),
      }),
    )
    .describe("Funzioni da scrivere: firma e pseudocodice, mai il corpo"),
  exampleTest: z
    .object({ name: z.string(), body: z.string().describe("Il corpo del test, al massimo 12 righe") })
    .nullable()
    .describe("Solo nei file di test: un primo test completo, come esempio dello stile"),
  testCases: z.array(z.string()).describe("Solo nei file di test: i nomi degli altri test da scrivere, prima i casi limite"),
});
export type Scaffold = z.infer<typeof Scaffold>;

const IDENT = /^[A-Za-z_$][\w$]*$/;
const SIGNATURE = /^(export\s+)?(async\s+)?function\*?\s+[A-Za-z_$][\w$]*\s*(<[^{}]*>)?\s*\([^{}]*\)\s*(:\s*[^{}=;]+)?$/;
const LITERAL_ITEM = String.raw`-?\d[\d_]*(\.\d+)?|"[^"\n]*"|'[^'\n]*'|true|false|null`;
const LITERAL = new RegExp(String.raw`^(${LITERAL_ITEM}|\[\s*((${LITERAL_ITEM})\s*,\s*)*(${LITERAL_ITEM})?\s*\])$`);
const MAX_EXAMPLE_LINES = 12;

export const isTestFile = (path: string) => /(\.|_)(test|spec)\.[cm]?[jt]sx?$|(^|\/)tests?\/.*\.[cm]?[jt]sx?$/.test(path);

/** Commento su una riga sola: niente "*\/" che chiuderebbe un JSDoc, niente a capo. */
const clean = (s: string) => s.replace(/\*\//g, "* /").replace(/\s*\n\s*/g, " ").trim();
const jsdoc = (doc: string | null, indent = "") => (doc?.trim() ? `${indent}/** ${clean(doc)} */\n` : "");

export function composeScaffold(s: Scaffold, path: string): { text: string; dropped: string[] } {
  const dropped: string[] = [];
  const out: string[] = [];
  const testFile = isTestFile(path);

  // import
  for (const imp of s.imports) {
    const names = imp.names.map((n) => n.trim()).filter((n) => /^(type\s+)?[A-Za-z_$][\w$]*(\s+as\s+[A-Za-z_$][\w$]*)?$/.test(n));
    if (!/^[\w@./:-]+$/.test(imp.from)) {
      dropped.push(`import da ${imp.from}`);
      continue;
    }
    const isDefault = names.length === 1 && /^assert$/.test(names[0]!) && /assert/.test(imp.from);
    if (names.length) out.push(isDefault ? `import ${names[0]} from "${imp.from}";` : `import { ${names.join(", ")} } from "${imp.from}";`);
  }
  if (out.length) out.push("");

  // costanti: solo valori letterali
  for (const c of s.constants) {
    if (!IDENT.test(c.name) || !LITERAL.test(c.value.trim())) {
      dropped.push(`costante ${c.name}`);
      continue;
    }
    const type = c.type?.trim() && /^[\w$<>[\]|, .]+$/.test(c.type.trim()) ? `: ${c.type.trim()}` : "";
    out.push(`${jsdoc(c.doc)}export const ${c.name}${type} = ${c.value.trim()};`);
  }
  if (s.constants.length) out.push("");

  // tipi: solo dichiarazioni
  for (const t of s.types) {
    const decl = t.declaration.trim();
    if (!/^export\s+(type|interface)\s/.test(decl) || !isSignatureOnly("ts", decl) || decl.split("\n").length > 20) {
      dropped.push(`tipo: ${decl.split("\n")[0]}`);
      continue;
    }
    out.push(`${jsdoc(t.doc)}${decl}`, "");
  }

  // funzioni: firma, pseudocodice come commenti, corpo vuoto
  for (const f of s.functions) {
    const sig = f.signature.trim().replace(/\s*\{?\s*\}?\s*;?$/, "");
    if (!SIGNATURE.test(sig)) {
      dropped.push(`firma: ${f.signature.trim()}`);
      continue;
    }
    const steps = f.pseudocode.map(clean).filter(Boolean);
    out.push(`${jsdoc(f.doc)}${sig} {`);
    out.push("  // TODO(tu) Pseudocodice: trasformalo in codice, una riga alla volta.");
    steps.forEach((step, i) => out.push(`  // ${/^\d+[.)]/.test(step) ? step : `${i + 1}. ${step}`}`));
    if (f.question?.trim()) out.push(`  // ? ${clean(f.question)}`);
    out.push("}", "");
  }

  // test: un solo esempio completo, il resto da scrivere
  if (testFile) {
    const usesNodeTest = s.imports.some((i) => i.from === "node:test");
    if (s.exampleTest) {
      const body = s.exampleTest.body.replace(/^\s*\n|\s+$/g, "");
      const lines = body.split("\n");
      if (lines.length > MAX_EXAMPLE_LINES || /\btest\s*\(|\bdescribe\s*\(|\bit\s*\(/.test(body)) {
        dropped.push(`test d'esempio troppo lungo o annidato`);
      } else {
        out.push(`// Un primo test completo, come esempio dello stile. Gli altri li scrivi tu.`);
        out.push(`test(${JSON.stringify(clean(s.exampleTest.name))}, () => {`);
        out.push(...lines.map((l) => (l.trim() ? `  ${l.replace(/^\s{0,2}/, "")}` : "")));
        out.push("});", "");
      }
    }
    for (const name of s.testCases.map(clean).filter(Boolean)) {
      out.push(usesNodeTest ? `test.todo(${JSON.stringify(name)});` : `// TODO(tu) test: ${name}`);
    }
    if (s.testCases.length) out.push("");
  } else if (s.exampleTest || s.testCases.length) {
    dropped.push("test in un file che non è di test");
  }

  return { text: out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n"), dropped };
}

export interface ScaffoldTask {
  title: string;
  todo: string | null;
  signature: string | null;
  when: string[];
}

export function buildScaffoldMessage(
  ctx: ProjectContext,
  path: string,
  task: ScaffoldTask | undefined,
  files: readonly { path: string; content?: string }[],
  level: ExperienceLevel,
  /** Firme previste dagli altri compiti del passo: i test devono chiamare quei nomi, anche se il file non esiste ancora. */
  stepSignatures: readonly string[] = [],
): string {
  const taskBlock = task
    ? `<task>\n${[task.title, task.todo && `fare: ${task.todo}`, task.signature && `firma: ${task.signature}`, ...task.when.map((w) => `fatto quando: ${w}`)].filter(Boolean).join("\n")}\n</task>`
    : "";
  return [
    "MODE: SCAFFOLD",
    `LIVELLO: ${level}`,
    projectBlocks(ctx),
    taskBlock,
    `<files>\n${files.map((f) => f.path).join("\n")}\n</files>`,
    files
      .filter((f) => f.content !== undefined)
      .map((f) => `<file path="${f.path}">\n${numberLines(f.content!)}\n</file>`)
      .join("\n"),
    stepSignatures.length ? `FIRME PREVISTE NEL PASSO:\n${stepSignatures.map((x) => `- ${x}`).join("\n")}` : "",
    `FILE DA PREPARARE: ${path}${isTestFile(path) ? " (file di test)" : ""}`,
    "Rispondi compilando lo schema.",
  ]
    .filter(Boolean)
    .join("\n");
}
