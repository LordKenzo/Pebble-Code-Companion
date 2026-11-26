import * as vscode from "vscode";
import { detectLanguages, isLevel, levelFor, levelsLine, readProfile, type LevelProfile } from "../../core/level";
import type { ExperienceLevel } from "../../core/model";

const KEY = "pebble.level.v1";
const IGNORE = "**/{node_modules,dist,out,build,.git,bin,obj,target,vendor,.venv,venv}/**";

/**
 * Il livello per progetto e per linguaggio (roadmap #23), nello stato locale di VS Code per questa cartella.
 * Senza un profilo salvato vale `pebble.experienceLevel`, che resta il livello di partenza per i progetti nuovi.
 */
export class LevelStore {
  private languages: string[] | undefined;
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changed.event;

  constructor(private state: vscode.Memento) {}

  private fallback(): ExperienceLevel {
    const v = vscode.workspace.getConfiguration("pebble").get<string>("experienceLevel", "mid");
    return isLevel(v) ? v : "mid";
  }

  profile(): LevelProfile {
    return readProfile(this.state.get(KEY), this.fallback());
  }

  /** Il livello per il file su cui si lavora, o quello del progetto. */
  levelFor(path?: string | null): ExperienceLevel {
    return levelFor(this.profile(), path);
  }

  /** "LEVELS: …" per il modello, o null quando tutti i linguaggi hanno il livello del progetto. */
  line(): string | null {
    return levelsLine(this.profile());
  }

  /** Il livello del progetto; diventa anche quello di partenza per i progetti nuovi. */
  async setProject(level: ExperienceLevel): Promise<void> {
    await this.state.update(KEY, { ...this.profile(), project: level });
    await vscode.workspace.getConfiguration("pebble").update("experienceLevel", level, vscode.ConfigurationTarget.Global);
    this.changed.fire();
  }

  /** Il livello per un linguaggio; null torna al livello del progetto. */
  async setLanguage(language: string, level: ExperienceLevel | null): Promise<void> {
    const p = this.profile();
    const byLanguage = { ...p.byLanguage };
    if (level && level !== p.project) byLanguage[language] = level;
    else delete byLanguage[language];
    await this.state.update(KEY, { ...p, byLanguage });
    this.changed.fire();
  }

  /** I linguaggi presenti nella cartella, dal più usato; calcolati una volta per sessione. */
  async detect(): Promise<string[]> {
    if (this.languages) return this.languages;
    const files = await vscode.workspace.findFiles("**/*.*", IGNORE, 3000);
    this.languages = detectLanguages(files.map((f) => f.path));
    return this.languages;
  }

  dispose(): void {
    this.changed.dispose();
  }
}
