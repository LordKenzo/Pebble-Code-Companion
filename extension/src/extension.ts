import { DiaryWriter } from "./adapters/store/diaryStore";
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
import { EXT_TEXT, resolveLang, type Lang } from "./core/i18n";

const secretKey = (p: ProviderId) => `pebble.apiKey.${p}`;

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection("pebble");
  const panel = new ReviewPanel(() => lang());
  const ledger = new SpendLedger(context.globalState);

  const config = () => vscode.workspace.getConfiguration("pebble");
  /** Lingua di Pebble (ADR-012): "auto" segue la lingua di VS Code. */
  const lang = (): Lang => resolveLang(config().get<string>("language", "auto"), vscode.env.language);
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
    status.text = `$(milestone) Pebble · ${level()} · ${formatUsd(m.costUsd, lang())}`;
    status.tooltip = EXT_TEXT[lang()].statusTooltip(m.reviews, formatUsd(m.costUsd, lang()), budget > 0 ? formatUsd(budget, lang()) : "", m.unpriced);
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
      lang: lang(),
    };
  };

  const providerNames = (): Record<ProviderId, string> => ({
    anthropic: "Anthropic (Claude)",
    openai: "OpenAI",
    local: EXT_TEXT[lang()].localServer,
  });

  /** Chiede e salva la chiave API; se il provider non è indicato, lo chiede. */
  const askKey = async (provider?: ProviderId): Promise<void> => {
    let id = provider;
    if (!id) {
      const current = settings().provider;
      const pick = await vscode.window.showQuickPick(
        (["anthropic", "openai", "local"] as ProviderId[])
          .map((p) => ({ label: providerNames()[p], id: p }))
          .sort((a, b) => (a.id === current ? -1 : b.id === current ? 1 : 0)),
        { placeHolder: EXT_TEXT[lang()].whichProvider },
      );
      id = pick?.id;
    }
    if (!id) return;
    const key = await vscode.window.showInputBox({
      prompt: EXT_TEXT[lang()].keyPrompt(providerNames()[id]),
      password: true,
      ignoreFocusOut: true,
    });
    if (key === undefined) return;
    if (key.trim()) {
      await context.secrets.store(secretKey(id), key.trim());
      void vscode.window.showInformationMessage(EXT_TEXT[lang()].keySaved(providerNames()[id]));
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
        language: c.get<string>("language", "auto"),
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
    lang,
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
  }, lang);
  session = new MentorSession(chatView, diagnostics, {
    note: (event) => diary.append(event),
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
          .showWarningMessage(EXT_TEXT[lang()].overBudget(formatUsd(spent, lang()), formatUsd(budget, lang())), EXT_TEXT[lang()].showSpend)
          .then((a) => a && vscode.commands.executeCommand("pebble.showSpend"));
      }
    },
    setting: (key, fallback) => config().get(key, fallback),
    workspaceState: context.workspaceState,
    lang,
  }, proposals);

  // Diario del sentiero (ADR-013): lo scrive Pebble dagli eventi che vede già, senza modello.
  let pathViewRef: PathView | undefined;
  const diary = new DiaryWriter(vscode.workspace.workspaceFolders?.[0]?.uri, lang, () => pathViewRef?.currentStepHeading() ?? null);

  // Vista "Percorso": i compiti di .pebble/percorso.md (ADR-007).
  const pathView = new PathView(context.extensionUri, vscode.workspace.workspaceFolders?.[0]?.uri, context.workspaceState, () => ({
    testCommand: config().get("path.testCommand", "node --test --test-reporter=tap"),
    timeoutSeconds: config().get("path.testTimeoutSeconds", 60),
    verifyOnSave: config().get("path.verifyOnSave", true),
    requireRedFirst: config().get("path.requireRedFirst", false),
    lang: lang(),
  }), {
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
    proposals,
  }, diary);
  pathViewRef = pathView;

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
    lang,
    note: (event) => diary.append(event),
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
    vscode.commands.registerCommand("pebble.path.planNext", () => pathView.planNext()),
    vscode.commands.registerCommand("pebble.scaffoldFile", () => pathView.scaffold()),
    vscode.commands.registerCommand("pebble.start", () => vscode.commands.executeCommand(`${PathView.id}.focus`)),
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
      const labels: Record<ExperienceLevel, string> = EXT_TEXT[lang()].levels;
      const pick = await vscode.window.showQuickPick(
        LEVELS.map((l) => ({ label: labels[l], id: l, picked: l === level() })),
        { placeHolder: EXT_TEXT[lang()].currentLevel(level()) },
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
      const ok = await vscode.window.showWarningMessage(EXT_TEXT[lang()].resetSpend, { modal: true }, EXT_TEXT[lang()].reset);
      if (ok !== EXT_TEXT[lang()].reset) return;
      await ledger.reset();
      refreshStatus();
      void settingsPanel.refresh();
      void vscode.commands.executeCommand("pebble.showSpend");
    }),

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("pebble")) return;
      refreshStatus();
      void settingsPanel.refresh();
      // Cambio di lingua: il pannello si ridisegna subito nella lingua nuova (ADR-012).
      if (e.affectsConfiguration("pebble.language")) {
        void pathView.refresh();
        chatView.relocalize();
        settingsPanel.relocalize();
      }
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
