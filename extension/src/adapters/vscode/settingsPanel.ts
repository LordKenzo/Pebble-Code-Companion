import * as vscode from "vscode";
import { DEFAULT_PRICES, formatUsd, type Price } from "../../core/cost";
import { LEVELS } from "../../core/model";
import { SETTINGS_TEXT, type Lang } from "../../core/i18n";
import type { MentorModel } from "../../core/ports";
import type { ProviderId } from "../llm/factory";

export interface SettingsState {
  provider: ProviderId;
  anthropicModel: string;
  anthropicEffort: string;
  openaiModel: string;
  localBaseUrl: string;
  localModel: string;
  experienceLevel: string;
  training: boolean;
  monthlyBudgetUsd: number;
  prices: Record<string, Price>;
  keys: Record<ProviderId, boolean>;
  monthSpend: string;
  monthReviews: number;
  language: string;
}

export interface SettingsDeps {
  state(): Promise<SettingsState>;
  /** Crea un client per il provider indicato, anche se il modello non è ancora impostato. */
  mentorFor(provider: ProviderId, model: string): Promise<MentorModel>;
  setKey(provider: ProviderId): Promise<void>;
  deleteKey(provider: ProviderId): Promise<void>;
  /** Lingua del pannello (ADR-012). */
  lang(): Lang;
}

type FromWebview =
  | { type: "ready" }
  | { type: "set"; key: string; value: unknown }
  | { type: "setPrice"; model: string; price: Price | null }
  | { type: "setKey" | "deleteKey"; provider: ProviderId }
  | { type: "check"; provider: ProviderId; model: string }
  | { type: "listModels"; provider: ProviderId }
  | { type: "command"; command: string };

/** Pannello di impostazioni di Pebble: scrive nelle impostazioni utente di VS Code. */
export class SettingsPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private deps: SettingsDeps) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    this.panel = vscode.window.createWebviewPanel("pebble.settings", SETTINGS_TEXT[this.deps.lang()].panelTitle, vscode.ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
    });
    this.panel.onDidDispose(() => (this.panel = undefined));
    this.panel.webview.onDidReceiveMessage((m: FromWebview) => void this.handle(m));
    this.panel.webview.html = html(this.panel.webview.cspSource, this.deps.lang());
  }

  /** Cambio di lingua: la pagina si ridisegna con i testi nuovi. */
  relocalize(): void {
    if (!this.panel) return;
    this.panel.title = SETTINGS_TEXT[this.deps.lang()].panelTitle;
    this.panel.webview.html = html(this.panel.webview.cspSource, this.deps.lang());
  }

  /** Da chiamare quando cambiano impostazioni, chiavi o spesa. */
  async refresh(): Promise<void> {
    if (this.panel) await this.post({ type: "state", state: await this.deps.state() });
  }

  private post(msg: unknown): Thenable<boolean> | undefined {
    return this.panel?.webview.postMessage(msg);
  }

  private async handle(m: FromWebview): Promise<void> {
    const config = vscode.workspace.getConfiguration("pebble");
    switch (m.type) {
      case "ready":
        return this.refresh();
      case "set":
        await config.update(m.key, m.value, vscode.ConfigurationTarget.Global);
        return;
      case "setPrice": {
        const prices = { ...config.get<Record<string, Price>>("prices", {}) };
        if (m.price) prices[m.model] = m.price;
        else delete prices[m.model];
        await config.update("prices", prices, vscode.ConfigurationTarget.Global);
        return;
      }
      case "setKey":
        await this.deps.setKey(m.provider);
        return this.refresh();
      case "deleteKey":
        await this.deps.deleteKey(m.provider);
        return this.refresh();
      case "check":
        try {
          await (await this.deps.mentorFor(m.provider, m.model)).check();
          await this.post({ type: "check", ok: true, message: SETTINGS_TEXT[this.deps.lang()].connectionOk(m.model) });
        } catch (err) {
          await this.post({ type: "check", ok: false, message: err instanceof Error ? err.message : String(err) });
        }
        return;
      case "listModels":
        try {
          const models = await (await this.deps.mentorFor(m.provider, "")).listModels();
          await this.post({ type: "models", provider: m.provider, models });
        } catch (err) {
          await this.post({ type: "models", provider: m.provider, models: [], error: err instanceof Error ? err.message : String(err) });
        }
        return;
      case "command":
        await vscode.commands.executeCommand(m.command);
        return;
    }
  }
}

function html(csp: string, lang: Lang): string {
  const T = SETTINGS_TEXT[lang];
  const nonce = Math.random().toString(36).slice(2);
  const levels = {
    entry: ["Entry", T.levelEntry],
    junior: ["Junior", T.levelJunior],
    mid: ["Mid", T.levelMid],
    senior: ["Senior", T.levelSenior],
  };
  const builtinPrices = Object.fromEntries(
    Object.entries(DEFAULT_PRICES).map(([k, p]) => [k, T.perMillion(formatUsd(p.input), formatUsd(p.output))]),
  );

  return `<!doctype html><html lang="${T.htmlLang}"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${csp} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  body{font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);padding:20px 24px 48px;line-height:1.5;max-width:760px}
  h1{font-size:18px;font-weight:600;margin:0 0 4px}
  .lead{color:var(--vscode-descriptionForeground);margin:0 0 20px}
  section{border-top:1px solid var(--vscode-panel-border);padding:18px 0 6px}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--vscode-descriptionForeground);margin:0 0 12px;font-weight:600}
  .choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-bottom:14px}
  .choice{display:block;border:1px solid var(--vscode-panel-border);border-radius:6px;padding:10px 12px;cursor:pointer;background:var(--vscode-editor-background)}
  .choice:has(input:checked){border-color:var(--vscode-focusBorder);box-shadow:inset 0 0 0 1px var(--vscode-focusBorder)}
  .choice input{position:absolute;opacity:0;pointer-events:none}
  .choice b{display:block}
  .choice span{color:var(--vscode-descriptionForeground);font-size:12px}
  .choice:focus-within{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}
  .field{display:grid;grid-template-columns:180px minmax(0,1fr);gap:4px 14px;align-items:center;margin:0 0 12px}
  .field label{color:var(--vscode-foreground)}
  .field .help{grid-column:2;color:var(--vscode-descriptionForeground);font-size:12px}
  input[type=text],input[type=number],select{font:inherit;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border,transparent);border-radius:3px;padding:4px 8px;width:100%;box-sizing:border-box}
  input:focus,select:focus{outline:1px solid var(--vscode-focusBorder)}
  .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .row input{flex:1;min-width:140px}
  button{font:inherit;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;padding:5px 12px;border-radius:3px;cursor:pointer;white-space:nowrap}
  button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
  button:focus-visible{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}
  .status{font-size:12px;padding:6px 10px;border-radius:4px;margin:4px 0 12px}
  .status.ok{background:color-mix(in srgb,var(--vscode-testing-iconPassed) 15%,transparent);color:var(--vscode-foreground)}
  .status.err{background:color-mix(in srgb,var(--vscode-errorForeground) 15%,transparent);color:var(--vscode-foreground)}
  .pill{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid var(--vscode-panel-border)}
  .pill.on{border-color:var(--vscode-testing-iconPassed);color:var(--vscode-testing-iconPassed)}
  .muted{color:var(--vscode-descriptionForeground)}
  .prices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .prices label{font-size:12px;color:var(--vscode-descriptionForeground);display:flex;flex-direction:column;gap:2px}
  .check{display:flex;gap:8px;align-items:center;margin:6px 0}
  h3{font-size:13px;margin:16px 0 4px}
  .spend{display:flex;gap:16px;align-items:baseline;flex-wrap:wrap;margin-bottom:12px}
  .spend strong{font-size:20px;font-variant-numeric:tabular-nums}
  [hidden]{display:none!important}
  @media (max-width:520px){.field{grid-template-columns:1fr}.field .help{grid-column:1}}
</style></head><body>
<h1>${T.title}</h1>
<p class="lead">${T.lead}</p>

<section>
  <h2>${T.language}</h2>
  <div class="choices" role="radiogroup" aria-label="${T.language}">
    <label class="choice"><input type="radio" name="language" value="auto"><b>${T.langAuto}</b><span>${T.langAutoHelp}</span></label>
    <label class="choice"><input type="radio" name="language" value="it"><b>${T.langIt}</b><span>${T.langItHelp}</span></label>
    <label class="choice"><input type="radio" name="language" value="en"><b>${T.langEn}</b><span>${T.langEnHelp}</span></label>
  </div>
</section>

<section>
  <h2>${T.model}</h2>
  <div class="choices" role="radiogroup" aria-label="Provider">
    <label class="choice"><input type="radio" name="provider" value="anthropic"><b>Claude</b><span>${T.claudeHelp}</span></label>
    <label class="choice"><input type="radio" name="provider" value="openai"><b>OpenAI</b><span>${T.openaiHelp}</span></label>
    <label class="choice"><input type="radio" name="provider" value="local"><b>${T.local}</b><span>${T.localHelp}</span></label>
  </div>

  <div data-for="anthropic">
    <div class="field"><label for="anthropicModelSelect">${T.model}</label>
      <select id="anthropicModelSelect" data-model-for="anthropic.model" data-input="anthropicModel"></select>
      <input type="text" id="anthropicModel" data-key="anthropic.model" placeholder="${T.exactModel}" hidden>
      <span class="help" id="anthropicPrice"></span></div>
    <div class="field"><label for="anthropicEffort">${T.effort}</label>
      <select id="anthropicEffort" data-key="anthropic.effort">
        <option value="low">${T.effortLow}</option>
        <option value="medium">${T.effortMedium}</option>
        <option value="high">${T.effortHigh}</option>
        <option value="xhigh">${T.effortXhigh}</option>
      </select></div>
  </div>

  <div data-for="openai">
    <div class="field"><label for="openaiModelSelect">${T.model}</label>
      <div class="row"><select id="openaiModelSelect" data-model-for="openai.model" data-input="openaiModel"></select>
      <button class="secondary" data-list="openai">${T.refreshList}</button></div>
      <input type="text" id="openaiModel" data-key="openai.model" placeholder="${T.exactModelOpenai}" hidden>
      <span class="help" id="openaiListInfo"></span></div>
  </div>

  <div data-for="local">
    <div class="field"><label for="localBaseUrl">${T.serverUrl}</label>
      <input type="text" id="localBaseUrl" data-key="local.baseUrl">
      <span class="help">Ollama: http://localhost:11434/v1 · LM Studio: http://localhost:1234/v1</span></div>
    <div class="field"><label for="localModel">${T.model}</label>
      <div class="row"><select id="localModelSelect" aria-label="${T.installedModels}"></select>
      <button class="secondary" data-list="local">${T.refresh}</button></div>
      <span class="help" id="localListInfo">${T.localWarning}</span></div>
  </div>

  <div class="row"><button id="check">${T.checkConnection}</button></div>
  <div id="checkResult" class="status" hidden></div>
</section>

<section>
  <h2>${T.apiKeys}</h2>
  <div class="field"><label>Anthropic</label><div class="row"><span class="pill" id="key-anthropic"></span>
    <button class="secondary" data-setkey="anthropic">${T.set}</button><button class="secondary" data-delkey="anthropic">${T.remove}</button></div></div>
  <div class="field"><label>OpenAI</label><div class="row"><span class="pill" id="key-openai"></span>
    <button class="secondary" data-setkey="openai">${T.set}</button><button class="secondary" data-delkey="openai">${T.remove}</button></div></div>
  <div class="field"><label>${T.localServer}</label><div class="row"><span class="pill" id="key-local"></span>
    <button class="secondary" data-setkey="local">${T.set}</button><button class="secondary" data-delkey="local">${T.remove}</button></div>
    <span class="help">${T.localKeyHelp}</span></div>
</section>

<section>
  <h2>${T.levelTitle}</h2>
  <div class="choices" role="radiogroup" aria-label="${T.levelLabel}">
    ${LEVELS.map((l) => `<label class="choice"><input type="radio" name="level" value="${l}"><b>${levels[l][0]}</b><span>${levels[l][1]}</span></label>`).join("")}
  </div>
  <p class="muted">${T.levelNote}</p>
  <h3>${T.trainingTitle}</h3>
  <label class="check"><input type="checkbox" id="training" name="training"> ${T.trainingLabel}</label>
  <p class="muted">${T.trainingHelp}</p>
</section>

<section>
  <h2>${T.spend}</h2>
  <div class="spend"><strong id="monthSpend"></strong><span class="muted" id="monthReviews"></span>
    <button class="secondary" data-command="pebble.showSpend">${T.detail}</button></div>
  <div class="field"><label for="budget">${T.budget}</label>
    <input type="number" id="budget" min="0" step="1" data-key="monthlyBudgetUsd" data-number>
    <span class="help">${T.budgetHelp}</span></div>
  <div class="field" id="priceField"><label>${T.openaiPrice}</label>
    <div>
      <div class="prices">
        <label>Input $/M<input type="number" min="0" step="0.01" id="pIn"></label>
        <label>Output $/M<input type="number" min="0" step="0.01" id="pOut"></label>
        <label>Cache $/M<input type="number" min="0" step="0.01" id="pCache"></label>
      </div>
    </div>
    <span class="help" id="priceHelp"></span></div>
  <p class="muted">${T.spendNote}</p>
</section>


<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const BUILTIN = ${JSON.stringify(builtinPrices)};
  const ANTHROPIC_MODELS = ${JSON.stringify(Object.keys(DEFAULT_PRICES))};
  const OTHER = "__other__";
  const J = ${JSON.stringify(T.js)};
  let S = null;
  let openaiModels = [];
  let openaiRequested = false;

  /** Riempie un menu di modelli: il modello attuale è sempre presente, "Altro…" permette di scriverne uno. */
  function fillSelect(sel, models, current, emptyLabel) {
    if (document.activeElement === sel) return;
    const list = [...models];
    if (current && !list.includes(current)) list.unshift(current);
    sel.innerHTML = "";
    if (!current) sel.add(new Option(list.length ? J.chooseModel : emptyLabel, ""));
    list.forEach((id) => sel.add(new Option(id, id)));
    sel.add(new Option(J.other, OTHER));
    sel.value = current || "";
  }
  const $ = (id) => document.getElementById(id);
  const set = (key, value) => vscode.postMessage({ type: "set", key, value });

  function render() {
    document.querySelectorAll('input[name=provider]').forEach((r) => (r.checked = r.value === S.provider));
    document.querySelectorAll('input[name=level]').forEach((r) => (r.checked = r.value === S.experienceLevel));
    $("training").checked = !!S.training;
    document.querySelectorAll('input[name=language]').forEach((r) => (r.checked = r.value === S.language));
    document.querySelectorAll('[data-for]').forEach((el) => (el.hidden = el.dataset.for !== S.provider));
    fillSelect($("anthropicModelSelect"), ANTHROPIC_MODELS, S.anthropicModel, "");
    fillSelect($("openaiModelSelect"), openaiModels, S.openaiModel, J.pressRefreshList);
    if (S.provider === "openai" && S.keys.openai && !openaiRequested) {
      openaiRequested = true;
      $("openaiListInfo").textContent = J.loadingAccountModels;
      vscode.postMessage({ type: "listModels", provider: "openai" });
    }
    for (const [id, v] of [["anthropicModel", S.anthropicModel], ["anthropicEffort", S.anthropicEffort], ["openaiModel", S.openaiModel], ["localBaseUrl", S.localBaseUrl], ["budget", S.monthlyBudgetUsd]]) {
      if (document.activeElement !== $(id)) $(id).value = v;
    }
    $("anthropicPrice").textContent = BUILTIN[S.anthropicModel] ? J.price + BUILTIN[S.anthropicModel] : J.priceUnknown;
    const sel = $("localModelSelect");
    if (S.localModel && ![...sel.options].some((o) => o.value === S.localModel)) sel.add(new Option(S.localModel, S.localModel));
    if (!S.localModel && !sel.options.length) sel.add(new Option(J.pressRefreshLocal, ""));
    sel.value = S.localModel;
    for (const p of ["anthropic", "openai", "local"]) {
      const el = $("key-" + p);
      el.textContent = S.keys[p] ? J.keySet : J.keyNotSet;
      el.classList.toggle("on", S.keys[p]);
      document.querySelector('[data-delkey="' + p + '"]').hidden = !S.keys[p];
    }
    $("monthSpend").textContent = S.monthSpend;
    $("monthReviews").textContent = S.monthReviews + J.requestsThisMonth;
    const showPrice = S.provider === "openai" && S.openaiModel;
    $("priceField").hidden = !showPrice;
    if (showPrice) {
      const p = S.prices[S.openaiModel] || {};
      for (const [id, k] of [["pIn", "input"], ["pOut", "output"], ["pCache", "cacheRead"]]) {
        if (document.activeElement !== $(id)) $(id).value = p[k] ?? "";
      }
      $("priceHelp").textContent = S.prices[S.openaiModel]
        ? J.pricesFor.replace("{m}", S.openaiModel)
        : J.noPrice;
    }
  }

  function currentModel() {
    return S.provider === "anthropic" ? S.anthropicModel : S.provider === "openai" ? S.openaiModel : S.localModel;
  }

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "provider") { S.provider = t.value; render(); set("provider", t.value); $("checkResult").hidden = true; }
    else if (t.name === "level") set("experienceLevel", t.value);
    else if (t.name === "training") set("training", t.checked);
    else if (t.name === "language") set("language", t.value);
    else if (t.id === "localModelSelect") { if (t.value) set("local.model", t.value); }
    else if (t.dataset.modelFor) {
      const input = $(t.dataset.input);
      if (t.value === OTHER) { input.hidden = false; input.value = ""; input.focus(); }
      else { input.hidden = true; if (t.value) set(t.dataset.modelFor, t.value); }
    }
    else if (t.dataset.key) set(t.dataset.key, t.dataset.number !== undefined ? Number(t.value) || 0 : t.value.trim());
    else if (["pIn", "pOut", "pCache"].includes(t.id)) {
      const input = parseFloat($("pIn").value), output = parseFloat($("pOut").value), cache = parseFloat($("pCache").value);
      const price = isNaN(input) || isNaN(output) ? null : { input, output, ...(isNaN(cache) ? {} : { cacheRead: cache }) };
      vscode.postMessage({ type: "setPrice", model: S.openaiModel, price });
    }
  });

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "check") {
      const model = currentModel();
      const r = $("checkResult");
      r.hidden = false; r.className = "status";
      if (!model) { r.classList.add("err"); r.textContent = J.chooseModelFirst; return; }
      r.textContent = J.checking;
      vscode.postMessage({ type: "check", provider: S.provider, model });
    }
    if (b.dataset.list) { $(b.dataset.list + "ListInfo").textContent = J.loadingList; vscode.postMessage({ type: "listModels", provider: b.dataset.list }); }
    if (b.dataset.setkey) vscode.postMessage({ type: "setKey", provider: b.dataset.setkey });
    if (b.dataset.delkey) vscode.postMessage({ type: "deleteKey", provider: b.dataset.delkey });
    if (b.dataset.command) vscode.postMessage({ type: "command", command: b.dataset.command });
  });

  window.addEventListener("message", (e) => {
    const m = e.data;
    if (m.type === "state") { S = m.state; render(); }
    if (m.type === "check") { const r = $("checkResult"); r.hidden = false; r.className = "status " + (m.ok ? "ok" : "err"); r.textContent = m.message; }
    if (m.type === "models") {
      const info = $(m.provider + "ListInfo");
      if (m.error) { info.textContent = m.error; return; }
      if (m.provider === "local") {
        const sel = $("localModelSelect"); sel.innerHTML = "";
        if (!m.models.length) sel.add(new Option(J.noLocalModels, ""));
        else { if (!S.localModel) sel.add(new Option(J.chooseModel, "")); m.models.forEach((id) => sel.add(new Option(id, id))); }
        sel.value = S.localModel;
        info.textContent = m.models.length + J.localCount;
      } else {
        // Solo modelli di testo, senza le versioni datate (gpt-5-2025-08-07), dal più recente.
        openaiModels = m.models
          .filter((id) => /^(gpt|o\\d)/.test(id) && !/(audio|realtime|tts|transcribe|image|search|embedding|moderation|live)/.test(id) && !/-\\d{4}-\\d{2}-\\d{2}$/.test(id))
          .sort((a, b) => {
            const ga = a.startsWith("gpt"), gb = b.startsWith("gpt");
            return ga === gb ? b.localeCompare(a, undefined, { numeric: true }) : ga ? -1 : 1;
          });
        fillSelect($("openaiModelSelect"), openaiModels, S.openaiModel, J.noModelsFound);
        info.textContent = openaiModels.length + J.openaiCount;
      }
    }
  });

  vscode.postMessage({ type: "ready" });
</script></body></html>`;
}
