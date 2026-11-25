import { spawn } from "node:child_process";
import * as vscode from "vscode";
import { findExports, type Signals, type Task } from "../../core/path";
import { NOTICE_TEXT, type Lang } from "../../core/i18n";
import { DEFAULT_TEST_COMMAND, detectTestCommand, packageDependencies } from "../../core/runner";
import { parseTap, type ParsedTest } from "../../core/tap";

export interface TestRun {
  at: Date;
  durationMs: number;
  tests: ParsedTest[];
  /** I test non sono partiti o non hanno prodotto TAP leggibile. */
  error?: string;
}

export interface CollectorSettings {
  testCommand: string;
  timeoutSeconds: number;
  lang: Lang;
}

const MAX_OUTPUT = 4 * 1024 * 1024;

/**
 * Segnali locali per il percorso (ADR-008): errori dell'editor, file ed esportazioni, test in TAP.
 * Niente modello, niente rete: tutto quello che serve è già sul computer.
 */
export class SignalCollector {
  private lastRun: TestRun | undefined;
  /** Il comando usato davvero nell'ultima esecuzione (scelto dalle impostazioni o dal package.json). */
  lastCommand: string | undefined;

  constructor(
    private readonly root: vscode.Uri,
    private readonly settings: () => CollectorSettings,
  ) {}

  get last(): TestRun | undefined {
    return this.lastRun;
  }

  /** Raccoglie i segnali che servono ai compiti. Con runTests false riusa l'ultima esecuzione dei test. */
  async collect(tasks: readonly Task[], runTests: boolean): Promise<Omit<Signals, "seenRed">> {
    const paths = new Set<string>();
    let needsTests = false;
    for (const t of tasks) {
      for (const c of t.conditions) {
        if (c.kind === "file" || c.kind === "noErrors") paths.add(c.path);
        if (c.kind === "tests") needsTests = true;
      }
    }

    const needsDeps = tasks.some((t) => t.conditions.some((c) => c.kind === "dependency"));
    const manifest = await this.read(vscode.Uri.joinPath(this.root, "package.json"));
    const dependencies = needsDeps ? packageDependencies(manifest) : undefined;

    const files: Record<string, string[]> = {};
    const errors: Record<string, number> = {};
    for (const rel of paths) {
      const uri = vscode.Uri.joinPath(this.root, ...rel.split("/"));
      const text = await this.read(uri);
      if (text === null) continue;
      files[rel] = findExports(text);
      errors[rel] = vscode.languages.getDiagnostics(uri).filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length;
    }

    if (needsTests && runTests) this.lastRun = await this.runTests(manifest);
    const run = needsTests ? this.lastRun : undefined;
    return {
      files,
      errors,
      ...(dependencies && { dependencies }),
      ...(run && !run.error && { tests: run.tests }),
    };
  }

  /** Lancia i test una volta, senza compiti: la fotografia del campo base all'adozione (ADR-014). */
  async runOnce(): Promise<TestRun> {
    this.lastRun = await this.runTests(await this.read(vscode.Uri.joinPath(this.root, "package.json")));
    return this.lastRun;
  }

  private async read(uri: vscode.Uri): Promise<string | null> {
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (open) return open.getText();
    try {
      return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
    } catch {
      return null;
    }
  }

  /** Lancia il comando dei test nella cartella del progetto e legge l'output TAP. */
  private runTests(manifest: string | null): Promise<TestRun> {
    // In una cartella non attendibile niente comandi: eseguirebbero codice che non hai approvato.
    if (!vscode.workspace.isTrusted) {
      return Promise.resolve({
        at: new Date(),
        durationMs: 0,
        tests: [],
        error: NOTICE_TEXT[this.settings().lang].restricted,
      });
    }
    const { timeoutSeconds, lang } = this.settings();
    const N = NOTICE_TEXT[lang];
    // Se lo sviluppatore non ha scelto un comando, Pebble lo ricava dal package.json (Vitest, node:test…).
    let testCommand = this.settings().testCommand;
    if (testCommand === DEFAULT_TEST_COMMAND) {
      const choice = detectTestCommand(manifest, lang);
      if (choice.kind === "missing") return Promise.resolve({ at: new Date(), durationMs: 0, tests: [], error: choice.hint });
      testCommand = choice.command;
    }
    this.lastCommand = testCommand;
    const started = Date.now();
    return new Promise((resolve) => {
      let out = "";
      let err = "";
      let settled = false;
      const done = (run: Omit<TestRun, "at" | "durationMs">) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ at: new Date(), durationMs: Date.now() - started, ...run });
      };
      const child = spawn(testCommand, {
        cwd: this.root.fsPath,
        shell: true,
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CI: "1" },
      });
      const timer = setTimeout(() => {
        child.kill();
        done({ tests: parseTap(out), error: N.timeout(timeoutSeconds) });
      }, timeoutSeconds * 1000);
      child.stdout.on("data", (b: Buffer) => {
        if (out.length < MAX_OUTPUT) out += b.toString("utf8");
      });
      child.stderr.on("data", (b: Buffer) => {
        if (err.length < 16_384) err += b.toString("utf8");
      });
      child.on("error", (e) => done({ tests: [], error: N.cannotRun(testCommand, e.message) }));
      child.on("close", (code) => {
        const tests = parseTap(out);
        if (tests.length === 0 && code !== 0) {
          const first = (err || out).split(/\r?\n/).find((l) => l.trim()) ?? N.exitCode(code);
          done({ tests, error: first.trim().slice(0, 240) });
        } else if (tests.length === 0) {
          done({ tests, error: N.noTap(testCommand) });
        } else {
          done({ tests });
        }
      });
    });
  }
}
