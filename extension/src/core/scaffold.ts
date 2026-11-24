import { languageLine, SCAFFOLD_TEXT, type Lang } from "./i18n";
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
    .describe("Constants with literal values taken from the bootstrap (numbers, strings, lists of numbers)"),
  types: z.array(z.object({ doc: z.string().nullable(), declaration: z.string() })).describe("Dichiarazioni export type / export interface, senza logica"),
  functions: z
    .array(
      z.object({
        doc: z.string().nullable(),
        signature: z.string().describe("Only the signature: export function name(parameters): Type"),
        pseudocode: z.array(z.string()).describe("Pseudocode steps in the language given by LANGUAGE, one per line"),
        question: z.string().nullable().describe("A question to think about before writing, or null"),
      }),
    )
    .describe("Functions to write: signature and pseudocode, never the body"),
  exampleTest: z
    .object({ name: z.string(), body: z.string().describe("The test body, at most 12 lines") })
    .nullable()
    .describe("Only in test files: one first complete test, as an example of the style"),
  testCases: z.array(z.string()).describe("Only in test files: the names of the other tests to write, edge cases first"),
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

export function composeScaffold(s: Scaffold, path: string, lang: Lang = "it"): { text: string; dropped: string[] } {
  const T = SCAFFOLD_TEXT[lang];
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
    out.push(`  // ${T.todo}`);
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
        out.push(`// ${T.exampleTest}`);
        out.push(`test(${JSON.stringify(clean(s.exampleTest.name))}, () => {`);
        out.push(...lines.map((l) => (l.trim() ? `  ${l.replace(/^\s{0,2}/, "")}` : "")));
        out.push("});", "");
      }
    }
    for (const name of s.testCases.map(clean).filter(Boolean)) {
      out.push(usesNodeTest ? `test.todo(${JSON.stringify(name)});` : `// ${T.todoTest(name)}`);
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
  lang: Lang = "it",
): string {
  const taskBlock = task
    ? `<task>\n${[task.title, task.todo && `fare: ${task.todo}`, task.signature && `firma: ${task.signature}`, ...task.when.map((w) => `fatto quando: ${w}`)].filter(Boolean).join("\n")}\n</task>`
    : "";
  return [
    "MODE: SCAFFOLD",
    `LEVEL: ${level}`,
    projectBlocks(ctx),
    taskBlock,
    `<files>\n${files.map((f) => f.path).join("\n")}\n</files>`,
    files
      .filter((f) => f.content !== undefined)
      .map((f) => `<file path="${f.path}">\n${numberLines(f.content!)}\n</file>`)
      .join("\n"),
    stepSignatures.length ? `STEP_SIGNATURES:\n${stepSignatures.map((x) => `- ${x}`).join("\n")}` : "",
    `FILE_TO_PREPARE: ${path}${isTestFile(path) ? " (test file)" : ""}`,
    "Answer by filling in the schema.",
    languageLine(lang),
  ]
    .filter(Boolean)
    .join("\n");
}
