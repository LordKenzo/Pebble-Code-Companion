import type { TestResult } from "./path";

/**
 * Legge l'output TAP di un runner di test (ADR-008): node --test --test-reporter=tap, Vitest, Jest e pytest
 * con un plugin. Restituisce solo i test veri: le suite (describe) e i test saltati o "todo" non contano.
 * I test annidati hanno il nome completo, "suite > test", così "fatto quando" può citarne una parte.
 */
export interface ParsedTest extends TestResult {
  /** Messaggio d'errore di un test rosso, per il fumetto: "atteso 85, ricevuto 84". */
  detail?: string;
}

const RESULT = /^(\s*)(not ok|ok)\b\s*\d*\s*(?:-\s*)?(.*)$/;
const SUBTEST = /^(\s*)# Subtest: (.*)$/;
const MAX_DETAIL = 600;

export function parseTap(output: string): ParsedTest[] {
  const lines = output.split(/\r?\n/);
  const stack: { indent: number; name: string }[] = [];
  const results: ParsedTest[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const sub = SUBTEST.exec(line);
    if (sub) {
      const indent = sub[1]!.length;
      while (stack.length && stack[stack.length - 1]!.indent >= indent) stack.pop();
      stack.push({ indent, name: unescape(sub[2]!.trim()) });
      continue;
    }
    const res = RESULT.exec(line);
    if (!res) continue;

    const indent = res[1]!.length;
    const { name, directive } = splitDirective(res[3]!);
    const yaml = readYaml(lines, i + 1, indent);
    i = yaml.end;
    if (directive === "skip" || directive === "todo") continue;
    if (yaml.fields.type === "suite") continue;

    const parents = stack.filter((s) => s.indent < indent).map((s) => s.name);
    const full = [...parents, name].filter(Boolean).join(" > ");
    const test: ParsedTest = { name: full, ok: res[2] === "ok" };
    if (!test.ok) {
      const detail = describeFailure(yaml.fields);
      if (detail) test.detail = detail;
    }
    results.push(test);
  }
  return results;
}

/** "84,9 kg \# diventa 82,5 # SKIP motivo" → nome senza escape e direttiva. */
function splitDirective(raw: string): { name: string; directive: "skip" | "todo" | null } {
  const m = /^(.*?)(?:^|(?<!\\)\s)#\s*(SKIP|TODO)\b.*$/i.exec(raw);
  const name = unescape((m ? m[1]! : raw).trim());
  return { name, directive: m ? (m[2]!.toLowerCase() as "skip" | "todo") : null };
}

const unescape = (s: string) => s.replace(/\\#/g, "#").replace(/\\\\/g, "\\");

/** Il blocco YAML dopo un risultato: tra "---" e "...", più rientrato della riga del risultato. */
function readYaml(lines: string[], from: number, indent: number): { fields: Record<string, string>; end: number } {
  const fields: Record<string, string> = {};
  if (!/^\s*---\s*$/.test(lines[from] ?? "") || leading(lines[from]!) <= indent) return { fields, end: from - 1 };
  const base = leading(lines[from]!);
  let i = from + 1;
  let key: string | null = null;
  let block: string[] = [];
  const flush = () => {
    if (key !== null && block.length) fields[key] = dedent(block).trimEnd();
    key = null;
    block = [];
  };
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^\s*\.\.\.\s*$/.test(line) && leading(line) === base) break;
    const kv = line.trim() && leading(line) === base ? /^\s*([\w-]+):\s?(.*)$/.exec(line) : null;
    if (kv) {
      flush();
      const value = kv[2]!;
      if (/^[|>][-+]?$/.test(value) || value === "") {
        key = kv[1]!; // valore su più righe (blocco) o mappa annidata
      } else {
        fields[kv[1]!] = value.replace(/^'(.*)'$/, "$1").replace(/^"(.*)"$/, "$1");
      }
    } else if (key !== null) {
      block.push(line);
    }
  }
  flush();
  return { fields, end: i };
}

function describeFailure(f: Record<string, string>): string | undefined {
  const parts: string[] = [];
  if (f.error) parts.push(f.error);
  if (f.expected !== undefined || f.actual !== undefined) {
    const flat = (v: string | undefined) => (v ?? "").split("\n").map((l) => l.trim()).filter(Boolean).join(", ");
    if (!f.error?.includes("!==") && !f.error?.includes("+ actual")) parts.push(`atteso ${flat(f.expected)}, ricevuto ${flat(f.actual)}`);
  }
  const text = parts.join("\n").trim();
  return text ? (text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL)}…` : text) : undefined;
}

const leading = (s: string) => s.length - s.trimStart().length;

function dedent(block: string[]): string {
  const widths = block.filter((l) => l.trim()).map(leading);
  const min = widths.length ? Math.min(...widths) : 0;
  return block.map((l) => l.slice(min)).join("\n");
}
