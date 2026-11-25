import type { SectionKind } from "../../core/sections";
import * as vscode from "vscode";
import { parseDiary } from "../../core/diary";
import { MAP_TEXT, type Lang } from "../../core/i18n";
import { buildMapModel, stepReviewQuestion } from "../../core/map";
import { parsePath } from "../../core/path";
import { parseRoadmap } from "../../core/plan";
import { DIARY_FILE } from "../store/diaryStore";

export interface MapActions {
  reviewStep(label: string, question: string): void;
  openPath(): void;
}

type FromView =
  | { type: "ready" }
  | { type: "review"; n: number; kind?: SectionKind }
  | { type: "open"; file: "diary" | "roadmap" }
  | { type: "path" }
  | { type: "plan" }
  | { type: "newPath"; kind: "feature" | "bug" };

const PEBBLE = ".pebble";

/** La mappa del sentiero in una scheda dell'editor (ADR-013). Si aggiorna quando cambiano roadmap, percorso o diario. */
export class MapPanel {
  private panel: vscode.WebviewPanel | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly lang: () => Lang,
    private readonly actions: MapActions,
  ) {
    if (root) {
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, `${PEBBLE}/{percorso,diario,roadmap}.md`));
      this.disposables.push(watcher, watcher.onDidChange(() => void this.refresh()), watcher.onDidCreate(() => void this.refresh()), watcher.onDidDelete(() => void this.refresh()));
    }
  }

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      void this.refresh();
      return;
    }
    const media = vscode.Uri.joinPath(this.extensionUri, "media");
    const panel = vscode.window.createWebviewPanel("pebble.map", MAP_TEXT[this.lang()].tab, vscode.ViewColumn.Active, {
      enableScripts: true,
      localResourceRoots: [media],
      retainContextWhenHidden: true,
    });
    panel.iconPath = vscode.Uri.joinPath(media, "pebble.svg");
    panel.webview.html = html(panel.webview.cspSource, panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "map.css")), panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "map.js")), this.lang());
    panel.webview.onDidReceiveMessage((m: FromView) => void this.onMessage(m));
    panel.onDidDispose(() => (this.panel = undefined));
    this.panel = panel;
  }

  /** Ridisegna con la lingua attuale (ADR-012). */
  relocalize(): void {
    if (!this.panel) return;
    this.panel.title = MAP_TEXT[this.lang()].tab;
    void this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.panel) return;
    const data = await this.load();
    const webview = this.panel.webview;
    const ghost = (mood: string) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", `ghost-${mood}.svg`)).toString();
    void webview.postMessage({ type: "model", model: data.model, T: MAP_TEXT[this.lang()], ghosts: { neutral: ghost("neutral"), happy: ghost("happy") } });
  }

  private async load() {
    const [roadmap, path, diary] = await Promise.all([this.read("roadmap.md"), this.read("percorso.md"), this.read(DIARY_FILE[1]!)]);
    const tasks = path ? parsePath(path).tasks : [];
    return { tasks, model: buildMapModel(roadmap ? parseRoadmap(roadmap) : [], tasks, parseDiary(diary)) };
  }

  private async onMessage(m: FromView): Promise<void> {
    if (m.type === "ready") return this.refresh();
    if (m.type === "path") return this.actions.openPath();
    if (m.type === "plan") return void vscode.commands.executeCommand("pebble.path.planNext");
    if (m.type === "newPath") return void vscode.commands.executeCommand(m.kind === "bug" ? "pebble.newBug" : "pebble.newFeature");
    if (m.type === "open" && this.root) {
      const name = m.file === "diary" ? DIARY_FILE[1]! : "roadmap.md";
      const uri = vscode.Uri.joinPath(this.root, PEBBLE, name);
      try {
        await vscode.workspace.fs.stat(uri);
        await vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.Beside });
      } catch {
        /* il file non c'è ancora: niente da aprire */
      }
      return;
    }
    if (m.type === "review") return this.reviewStep(m.n, m.kind);
  }

  /** "Rivedi il passo" (roadmap #12): dalla mappa o dalla card del passo chiuso nel pannello Percorso. */
  async reviewStep(n: number, kind: SectionKind = "step"): Promise<void> {
    const { tasks, model } = await this.load();
    const step = [...model.steps, ...model.paths].find((s) => s.n === n && s.kind === kind);
    if (!step) return;
    const { label, question } = stepReviewQuestion(step, tasks, this.lang());
    this.actions.reviewStep(label, question);
  }

  private async read(name: string): Promise<string | null> {
    if (!this.root) return null;
    try {
      return new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.root, PEBBLE, name)));
    } catch {
      return null;
    }
  }

  dispose(): void {
    this.panel?.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

function html(cspSource: string, css: vscode.Uri, js: vscode.Uri, lang: Lang): string {
  const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
</head><body><div id="root"></div>
<script nonce="${nonce}" src="${js}"></script>
</body></html>`;
}
