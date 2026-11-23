// Prova una modalità in testo libero: node out/try-text.js <provider> <modello> <NEXT|TESTS|NEW_FILE|CHAT> <cartella progetto> [file] [domanda]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createMentor, type ProviderId } from "../src/adapters/llm/factory";
import { buildTextMessage, decisionFile, TextAnswer, type TextMode } from "../src/core/modes";

const [provider, model, mode, root, file, question] = process.argv.slice(2);
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const dec = join(root, ".pebble", "decisions");
const ctx = {
  bootstrap: read(join(root, "bootstrap.md")),
  architecture: read(join(root, ".pebble", "architecture.md")),
  roadmap: read(join(root, ".pebble", "roadmap.md")),
  decisions: existsSync(dec) ? readdirSync(dec).sort().map((n) => ({ name: n, content: readFileSync(join(dec, n), "utf8") })) : [],
};
const mentor = createMentor(
  { provider: provider as ProviderId, anthropicModel: model, anthropicEffort: "medium", openaiModel: model, localBaseUrl: "http://localhost:11434/v1", localModel: model },
  process.env.PEBBLE_API_KEY,
);
const msg = buildTextMessage(mode as TextMode, ctx, "mid", { file: file ? { path: file, content: read(join(root, file)) ?? "" } : undefined, question });
mentor.generate(readFileSync(join(__dirname, "..", "media", "mentor.md"), "utf8"), msg, TextAnswer, "answer")
  .then(({ data, usage }) => {
    console.log(data.answer);
    for (const c of data.decisionChanges) {
      const f = decisionFile(c, ctx.decisions.map((d) => ({ name: d.name.replace(/\.md$/, "") })));
      console.log(`\n--- PROPOSTA ${f.isNew ? "NUOVA" : "MODIFICA"} → ${f.path}\nmotivo: ${c.reason}\n${f.content}`);
    }
    console.log("USO:", JSON.stringify(usage));
  })
  .catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
