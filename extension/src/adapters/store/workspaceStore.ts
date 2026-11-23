import * as vscode from "vscode";
import type { ProjectContext } from "../../core/model";
import type { ProjectStore } from "../../core/ports";

const BOOTSTRAP_NAMES = ["bootstrap.md", "init.md"];

/** Legge bootstrap e .pebble/ dalla cartella di lavoro (ADR-002). */
export class WorkspaceStore implements ProjectStore {
  constructor(private root: vscode.Uri) {}

  get rootUri(): vscode.Uri {
    return this.root;
  }

  async load(): Promise<ProjectContext> {
    let bootstrap: string | null = null;
    for (const name of BOOTSTRAP_NAMES) {
      bootstrap = await this.read(vscode.Uri.joinPath(this.root, name));
      if (bootstrap) break;
    }
    const architecture = await this.read(vscode.Uri.joinPath(this.root, ".pebble", "architecture.md"));
    const roadmap = await this.read(vscode.Uri.joinPath(this.root, ".pebble", "roadmap.md"));
    const decisions: ProjectContext["decisions"] = [];
    const dir = vscode.Uri.joinPath(this.root, ".pebble", "decisions");
    try {
      const entries = await vscode.workspace.fs.readDirectory(dir);
      for (const [name, type] of entries.sort(([a], [b]) => a.localeCompare(b))) {
        if (type !== vscode.FileType.File || !name.endsWith(".md")) continue;
        const content = await this.read(vscode.Uri.joinPath(dir, name));
        if (content) decisions.push({ name: name.replace(/\.md$/, ""), content });
      }
    } catch {
      /* nessuna cartella decisions: va bene */
    }
    return { bootstrap, architecture, roadmap, decisions };
  }

  /** C'è già una cartella .pebble/ con le decisioni? */
  async hasPebble(): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(this.root, ".pebble"));
      return true;
    } catch {
      return false;
    }
  }

  /** Scrive i file generati (percorsi relativi alla radice). */
  async writeFiles(files: { path: string; content: string }[]): Promise<void> {
    for (const f of files) {
      await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(this.root, ...f.path.split("/")), new TextEncoder().encode(f.content));
    }
  }

  private async read(uri: vscode.Uri): Promise<string | null> {
    try {
      return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
    } catch {
      return null;
    }
  }
}
