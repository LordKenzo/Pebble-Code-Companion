import { z } from "zod";
import { composeBootstrap } from "./bootstrap";
import { LEVEL_HINTS, numberLines } from "./context";
import { ADOPT_TEXT, languageLine, PATH_TEXT, type Lang } from "./i18n";
import type { ExperienceLevel } from "./model";
import { cleanTitle } from "./modes";

/**
 * Adottare un progetto già avviato (ADR-014): Pebble legge il codice e propone quello che c'è,
 * non quello che dovrebbe esserci. Il pregresso diventa il campo base, un passo 0 già chiuso.
 */

export interface AdoptFile {
  path: string;
  content?: string;
}

export interface TestSnapshot {
  total: number;
  passed: number;
  /** Nomi dei test rossi all'arrivo: non contano come lavoro dello sviluppatore. */
  red: string[];
}

export interface AdoptSnapshot {
  files: readonly AdoptFile[];
  readme?: string | null;
  /** Riassunto della storia git: numero di commit, data dell'ultimo, ultimi messaggi. */
  git?: string | null;
  tests?: TestSnapshot | null;
}

export const DetectedDecision = z.object({
  title: z.string().describe("Short title of a choice already made in the code, without a number"),
  context: z.string().describe("Why this choice matters in this project"),
  decision: z.string().describe("What the code does today, as a rule for new code"),
  consequences: z.string().describe("What it makes easier and harder"),
  evidence: z.array(z.string()).describe("1 to 3 files (optionally with line) where the choice shows, e.g. 'package.json › jest'"),
});

export const AdoptPlan = z.object({
  reading: z.string().describe("2-3 sentences: what the project does and how it is built, as read from the code"),
  name: z.string().describe("The project's name, from the manifest or the README"),
  what: z.string().describe("What the project does and for whom, 1-3 sentences, for the bootstrap"),
  stack: z.array(z.string()).describe("Languages, frameworks, test runner, build tools actually in use"),
  constraints: z.array(z.string()).describe("Rules the code already follows (conventions, versions, domain rules visible in the code)"),
  unknowns: z.array(z.string()).describe("1 to 4 open points for the developer: missing tests, unclear areas, TODOs"),
  decisions: z.array(DetectedDecision).describe("3 to 6 decisions already made in the code; never propose a different tool than the one in use"),
  conflicts: z
    .array(z.object({ topic: z.string(), question: z.string().describe("One question that lets the developer pick the rule for new code") }))
    .describe("At most 2: places where the code contradicts itself (two styles for the same thing). Empty if none"),
  layers: z.string().describe("Layers and dependencies as they are, in Markdown"),
  folders: z.string().describe("Folder tree as it is, one line per entry"),
  paths: z.array(z.string()).describe("2 to 4 possible next steps the code suggests: a missing test, a red test to fix, a TODO, a small feature. Each verifiable"),
  question: z.string().nullable().describe("At most one question that changes the work, or null"),
});
export type AdoptPlan = z.infer<typeof AdoptPlan>;

const block = (tag: string, body: string | null | undefined) => (body && body.trim() ? `<${tag}>\n${body.trim()}\n</${tag}>` : "");

export function buildAdoptMessage(s: AdoptSnapshot, level: ExperienceLevel, lang: Lang = "it"): string {
  const list = s.files.map((f) => f.path).join("\n");
  const contents = s.files
    .filter((f) => f.content !== undefined)
    .map((f) => `<file path="${f.path}">\n${numberLines(f.content!)}\n</file>`)
    .join("\n");
  const tests = s.tests
    ? [`${s.tests.passed}/${s.tests.total} green`, ...s.tests.red.map((n) => `✖ ${n}`)].join("\n")
    : "not run";
  return [
    "MODE: ADOPT",
    `LEVEL: ${level}`,
    block("files", list),
    contents,
    block("readme", s.readme),
    block("git", s.git),
    block("tests", tests),
    "Answer by filling in the schema. Describe the project as it is; no code.",
    LEVEL_HINTS[level],
    languageLine(lang),
  ]
    .filter(Boolean)
    .join("\n");
}

const pad = (n: number) => String(n).padStart(3, "0");
const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "");
const tree = (s: string) => s.replace(/^```\w*\n?|```$/g, "").trim();

/** Una riga di sintesi del campo base: file, test, storia. */
export function baseCampSummary(s: AdoptSnapshot, lang: Lang = "it"): string {
  const T = ADOPT_TEXT[lang];
  return [
    T.summaryFiles(s.files.length),
    s.tests ? T.summaryTests(s.tests.total, s.tests.passed) : T.summaryNoTests,
    s.git ? T.summaryCommits(s.git.split("\n")[0]!.trim()) : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** La proposta mostrata in chat, da confermare prima di salvarla. */
export function adoptPlanToMarkdown(p: AdoptPlan, s: AdoptSnapshot, lang: Lang = "it"): string {
  const T = ADOPT_TEXT[lang];
  const adrs = p.decisions
    .map((d, i) => `**ADR-${pad(i + 1)} · ${cleanTitle(d.title)}** · *${T.detectedStatus}*\n${d.decision}\n*${T.evidence}* ${d.evidence.map((e) => `\`${e}\``).join(", ")}`)
    .join("\n\n");
  const conflicts = p.conflicts.length ? `### ${T.conflictsTitle}\n${p.conflicts.map((c) => `- **${c.topic}**: ${c.question}`).join("\n")}` : "";
  const red = s.tests?.red.length ? `\n${s.tests.red.map((n) => `- ${T.redOnArrival(n).replace(/^> /, "")}`).join("\n")}` : "";
  return [
    p.reading,
    `### ${T.stackTitle}\n${p.stack.join(" · ")}`,
    `### ${T.decisionsTitle}\n${adrs}`,
    conflicts,
    `### ${T.baseCampTitle}\n${baseCampSummary(s, lang)}${red}`,
    `### ${T.pathsTitle}\n${p.paths.map((x, i) => `${i + 1}. ${x.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}`,
    p.question ? `**${T.question}** ${p.question}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** I file dell'adozione: bootstrap, architettura, ADR rilevati, roadmap con il campo base e il percorso con il passo 0 chiuso. */
export function adoptPlanToFiles(p: AdoptPlan, s: AdoptSnapshot, date: string, lang: Lang = "it"): { path: string; content: string }[] {
  const T = ADOPT_TEXT[lang];
  const header = T.generated(date);
  const summary = baseCampSummary(s, lang);
  const conflictLines = p.conflicts.map((c) => `${c.topic}: ${c.question}`);
  const files = [
    {
      path: "bootstrap.md",
      content: composeBootstrap(
        { name: p.name, what: p.what, example: "", stack: p.stack.join(", "), rules: p.constraints.join("\n"), unknowns: [...p.unknowns, ...conflictLines], otherUnknown: "" },
        lang,
      ),
    },
    {
      path: ".pebble/architecture.md",
      content: `${T.archTitle}\n\n${header}\n${T.reading}\n\n${p.reading}\n\n${T.layers}\n\n${p.layers}\n\n${T.folders}\n\n\`\`\`\n${tree(p.folders)}\n\`\`\`\n`,
    },
    {
      path: ".pebble/roadmap.md",
      content: `${T.roadmapTitle}\n\n${header}\n0. ${T.baseCampStep(summary)}\n${p.paths.map((x, i) => `${i + 1}. ${x.replace(/^\s*\d+[.)]\s*/, "")}`).join("\n")}\n${
        p.question ? `\n## ${T.question.replace(/:$/, "")}\n\n${p.question}\n` : ""
      }`,
    },
    {
      path: ".pebble/percorso.md",
      content: [
        T.pathTitle,
        "",
        T.baseCampSection,
        `- [x] ${T.baseCampTask}`,
        `  ${T.baseCampDo(summary)}`,
        `  ${PATH_TEXT[lang].keyDone}: ${PATH_TEXT[lang].condManual}`,
        ...(s.tests?.red ?? []).map((n) => T.redOnArrival(n)),
        "",
      ].join("\n"),
    },
  ];
  p.decisions.forEach((d, i) => {
    const id = `ADR-${pad(i + 1)}`;
    const title = cleanTitle(d.title);
    const L = lang === "it" ? { c: "Contesto:", d: "Decisione:", q: "Conseguenze:" } : { c: "Context:", d: "Decision:", q: "Consequences:" };
    files.push({
      path: `.pebble/decisions/${id}-${slug(title)}.md`,
      content: `## ${id}: ${title}\n${T.detectedStatus}\n${L.c} ${d.context}\n${L.d} ${d.decision}\n${L.q} ${d.consequences}\n${T.evidence} ${d.evidence.join("; ")}\n`,
    });
  });
  return files;
}
