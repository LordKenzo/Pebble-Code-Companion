import * as vscode from "vscode";
import { createMentor, type ProviderId, type ProviderSettings } from "./adapters/llm/factory";
import type { Effort } from "./adapters/llm/claude";
import { ChatView } from "./adapters/vscode/chatView";
import { MentorSession } from "./adapters/vscode/mentorSession";
import { PathView } from "./adapters/vscode/pathView";
import { HelpBalloon } from "./adapters/vscode/helpBalloon";
import { ReviewPanel } from "./adapters/vscode/panel";
import { ProposalDocs } from "./adapters/vscode/proposals";
import { SpendLedger } from "./adapters/vscode/spendLedger";
import { SettingsPanel } from "./adapters/vscode/settingsPanel";
import { formatUsd, resolvePrice, type Price } from "./core/cost";
import { LEVELS, type ExperienceLevel } from "./core/model";

const secretKey = (p: ProviderId) => `pebble.apiKey.${p}`;

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection("pebble");
  const panel = new ReviewPanel();
  const ledger = new SpendLedger(context.globalState);

  const config = () => vscode.workspace.getConfiguration("pebble");
  const level = (): ExperienceLevel => {
    const v = config().get<string>("experienceLevel", "mid");
    return (LEVELS as readonly string[]).includes(v) ? (v as ExperienceLevel) : "mid";
  };

  // Barra di stato: livello e spesa del mese. Clic = riepilogo della spesa.
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = "pebble.openChat";
  const refreshStatus = () => {
    const m = ledger.monthTotal();
    const budget = config().get<number>("monthlyBudgetUsd", 0);
    const over = budget > 0 && m.costUsd >= budget;
    status.text = `$(milestone) Pebble · ${level()} · ${formatUsd(m.costUsd)}`;
    status.tooltip = `Pebble: ${m.reviews} richieste a Pebble questo mese, spesa stimata ${formatUsd(m.costUsd)}${
      budget > 0 ? ` su ${formatUsd(budget)} di budget` : ""
    }${m.unpriced ? ` (+${m.unpriced} senza prezzo)` : ""}. Clic per aprire il mentor.`;
    status.backgroundColor = over ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined;
    status.show();
  };
  refreshStatus();

  const settings = (): ProviderSettings => {
    const c = config();
    return {
      provider: c.get<ProviderId>("provider", "anthropic"),
      anthropicModel: c.get("anthropic.model", "claude-opus-5-5"),
      anthropicEffort: c.get<Effort>("anthropic.effort", "medium"),
      openaiModel: c.get("openai.model", ""),
      localBaseUrl: c.get("local.baseUrl", "http://localhost:11434/v1"),
      localModel: c.get("local.model", ""),
    };
  };

  const PROVIDER_NAMES: Record<ProviderId, string> = {
    anthropic: "Anthropic (Claude)",
    openai: "OpenAI",
    local: "server locale",
  };

  /** Chiede e salva la chiave API; se il provider non è indicato, lo chiede. */
  const askKey = async (provider?: ProviderId): Promise<void> => {
    let id = provider;
    if (!id) {
      const current = settings().provider;
      const pick = await vscode.window.showQuickPick(
        (["anthropic", "openai", "local"] as ProviderId[])
          .map((p) => ({ label: PROVIDER_NAMES[p], id: p }))
          .sort((a, b) => (a.id === current ? -1 : b.id === current ? 1 : 0)),
        { placeHolder: "Per quale provider?" },
      );
      id = pick?.id;
    }
    if (!id) return;
    const key = await vscode.window.showInputBox({
      prompt: `Chiave API per ${PROVIDER_NAMES[id]}. Resta nel portachiavi di VS Code, non nei file del progetto.`,
      password: true,
      ignoreFocusOut: true,
    });
    if (key === undefined) return;
    if (key.trim()) {
      await context.secrets.store(secretKey(id), key.trim());
      void vscode.window.showInformationMessage(`Pebble: chiave per ${PROVIDER_NAMES[id]} salvata.`);
    } else {
      await context.secrets.delete(secretKey(id));
    }
  };

  const settingsPanel = new SettingsPanel({
    state: async () => {
      const c = config();
      const s = settings();
      const keys = {
        anthropic: !!(await context.secrets.get(secretKey("anthropic"))),
        openai: !!(await context.secrets.get(secretKey("openai"))),
        local: !!(await context.secrets.get(secretKey("local"))),
      };
      const m = ledger.monthTotal();
      return {
        ...s,
        experienceLevel: level(),
        monthlyBudgetUsd: c.get<number>("monthlyBudgetUsd", 0),
        prices: c.get<Record<string, Price>>("prices", {}),
        keys,
        monthSpend: formatUsd(m.costUsd),
        monthReviews: m.reviews,
      };
    },
    mentorFor: async (provider, model) => {
      // Per elencare i modelli serve un client anche se il modello non è ancora scelto.
      const m = model || "?";
      const s = { ...settings(), provider, anthropicModel: m, openaiModel: m, localModel: m };
      return createMentor(s, await context.secrets.get(secretKey(provider)));
    },
    setKey: (provider) => askKey(provider),
    deleteKey: async (provider) => {
      await context.secrets.delete(secretKey(provider));
    },
  });

  const loadSystemPrompt = async (): Promise<string> => {
    const uri = vscode.Uri.joinPath(context.extensionUri, "media", "mentor.md");
    return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
  };

  const prices = () => config().get<Record<string, Price>>("prices", {});

  // Testi proposti da Pebble (es. un ADR aggiornato), mostrati nella vista di confronto.
  const proposals = new ProposalDocs();
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ProposalDocs.scheme, proposals));

  // Pannello laterale: la conversazione con il mentor.
  let session!: MentorSession;
  const chatView = new ChatView({
    ready: () => void session.start(),
    send: (text) => void session.send(text),
    action: (id) => void session.action(id),
  });
  session = new MentorSession(chatView, diagnostics, {
    mentor: async () => {
      const s = settings();
      return createMentor(s, await context.secrets.get(secretKey(s.provider)));
    },
    level,
    systemPrompt: loadSystemPrompt,
    priceFor: (m) => resolvePrice(m.model, settings().provider === "local", prices()),
    record: async (entry) => {
      await ledger.record(entry);
      refreshStatus();
      void settingsPanel.refresh();
      const budget = config().get<number>("monthlyBudgetUsd", 0);
      const spent = ledger.monthTotal().costUsd;
      if (budget > 0 && spent >= budget && spent - (entry.costUsd ?? 0) < budget) {
        void vscode.window
          .showWarningMessage(`Pebble: hai superato il budget mensile (${formatUsd(spent)} su ${formatUsd(budget)}).`, "Mostra la spesa")
          .then((a) => a && vscode.commands.executeCommand("pebble.showSpend"));
      }
    },
    setting: (key, fallback) => config().get(key, fallback),
    workspaceState: context.workspaceState,
  }, proposals);

  // Vista "Percorso": i compiti di .pebble/percorso.md (ADR-007).
  const pathView = new PathView(context.extensionUri, vscode.workspace.workspaceFolders?.[0]?.uri, context.workspaceState, () => ({
    testCommand: config().get("path.testCommand", "node --test --test-reporter=tap"),
    timeoutSeconds: config().get("path.testTimeoutSeconds", 60),
    verifyOnSave: config().get("path.verifyOnSave", true),
    requireRedFirst: config().get("path.requireRedFirst", false),
  }));

  // Il fumetto sulla riga (ADR-009): stesso modello e stesso registro della spesa della conversazione.
  const help = new HelpBalloon(context.extensionUri, vscode.workspace.workspaceFolders?.[0]?.uri, {
    mentor: async () => {
      const s = settings();
      return createMentor(s, await context.secrets.get(secretKey(s.provider)));
    },
    systemPrompt: loadSystemPrompt,
    level,
    priceFor: (m) => resolvePrice(m.model, settings().provider === "local", prices()),
    record: async (entry) => {
      await ledger.record(entry);
      refreshStatus();
      void settingsPanel.refresh();
    },
    helpContext: (path) => pathView.helpContext(path),
  });

  context.subscriptions.push(
    diagnostics,
    pathView,
    help,
    vscode.commands.registerCommand("pebble.helpHere", () => help.helpHere()),
    vscode.commands.registerCommand("pebble.help.reply", (r: vscode.CommentReply) => help.reply(r)),
    vscode.commands.registerCommand("pebble.help.up", (a) => help.up(a)),
    vscode.commands.registerCommand("pebble.help.why", (a) => help.why(a)),
    vscode.commands.registerCommand("pebble.help.deep", (a) => help.deep(a)),
    vscode.commands.registerCommand("pebble.help.close", (a) => help.close(a)),
    vscode.window.registerWebviewViewProvider(PathView.id, pathView),
    vscode.commands.registerCommand("pebble.path.reveal", (line: number) => pathView.reveal(line)),
    vscode.commands.registerCommand("pebble.path.refresh", () => pathView.refresh()),
    vscode.commands.registerCommand("pebble.path.verify", () => pathView.verify(true)),
    vscode.commands.registerCommand("pebble.path.open", () => pathView.reveal(0)),
    vscode.commands.registerCommand("pebble.path.createExample", () => pathView.createExample()),

    vscode.window.registerWebviewViewProvider(ChatView.id, chatView, { webviewOptions: { retainContextWhenHidden: true } }),

    vscode.commands.registerCommand("pebble.reviewFile", () => session.review()),
    vscode.commands.registerCommand("pebble.openChat", () => chatView.reveal()),
    vscode.commands.registerCommand("pebble.init", async () => {
      await chatView.reveal();
      await session.init();
    }),
    vscode.commands.registerCommand("pebble.next", async () => {
      await chatView.reveal();
      await session.text("NEXT");
    }),
    vscode.commands.registerCommand("pebble.tests", async () => {
      await chatView.reveal();
      await session.text("TESTS");
    }),
    vscode.commands.registerCommand("pebble.clearChat", () => session.send("/clear")),

    // Un file nuovo: Pebble dice che ruolo ha nell'architettura.
    vscode.workspace.onDidCreateFiles((e) => {
      for (const f of e.files) void session.newFile(f);
    }),

    vscode.commands.registerCommand("pebble.setApiKey", () => askKey()),

    status,

    vscode.commands.registerCommand("pebble.setLevel", async () => {
      const labels: Record<ExperienceLevel, string> = {
        entry: "Entry · sto imparando a programmare",
        junior: "Junior · programmo, ma ho poca esperienza di progetto",
        mid: "Mid · sono autonomo",
        senior: "Senior · solo bug, ADR e trade-off, niente ovvietà",
      };
      const pick = await vscode.window.showQuickPick(
        LEVELS.map((l) => ({ label: labels[l], id: l, picked: l === level() })),
        { placeHolder: `Livello attuale: ${level()}` },
      );
      if (pick) await config().update("experienceLevel", pick.id, vscode.ConfigurationTarget.Global);
    }),

    vscode.commands.registerCommand("pebble.showSpend", () =>
      panel.show({
        kind: "spend",
        data: ledger.data(),
        currentMonth: ledger.monthTotal().costUsd,
        budget: config().get<number>("monthlyBudgetUsd", 0),
      }),
    ),

    vscode.commands.registerCommand("pebble.resetSpend", async () => {
      const ok = await vscode.window.showWarningMessage("Azzerare il conteggio della spesa di Pebble?", { modal: true }, "Azzera");
      if (ok !== "Azzera") return;
      await ledger.reset();
      refreshStatus();
      void settingsPanel.refresh();
      void vscode.commands.executeCommand("pebble.showSpend");
    }),

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("pebble")) return;
      refreshStatus();
      void settingsPanel.refresh();
    }),

    context.secrets.onDidChange((e) => {
      if (e.key.startsWith("pebble.")) void settingsPanel.refresh();
    }),

    vscode.commands.registerCommand("pebble.clearReview", () => {
      const uri = vscode.window.activeTextEditor?.document.uri;
      if (uri) diagnostics.delete(uri);
      else diagnostics.clear();
    }),

    vscode.commands.registerCommand("pebble.openSettings", () => settingsPanel.show()),

    // Le note valgono per la versione rivista: se il file cambia, le righe non corrispondono più.
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length && diagnostics.has(e.document.uri)) diagnostics.delete(e.document.uri);
    }),
  );

  void revealOnFirstOpen(context);
}

export function deactivate(): void {}

/** La prima volta che un progetto con bootstrap.md viene aperto, mostra il pannello di Pebble. */
async function revealOnFirstOpen(context: vscode.ExtensionContext): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;
  const key = `pebble.revealed:${folder.uri.toString()}`;
  if (context.workspaceState.get(key)) return;
  for (const name of ["bootstrap.md", "init.md"]) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder.uri, name));
      await context.workspaceState.update(key, true);
      await vscode.commands.executeCommand("pebble.openChat");
      return;
    } catch {
      /* file assente: prova il prossimo */
    }
  }
}
