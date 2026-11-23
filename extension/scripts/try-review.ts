// Prova una review fuori da VS Code, sugli stessi fixture degli eval.
// Uso: npx esbuild scripts/try-review.ts --bundle --platform=node --outfile=out/try.js
//      node out/try.js <anthropic|openai|local> <modello> [fixture] [percorso] [livello]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reviewFile } from "../src/core/reviewFile";
import { createMentor, type ProviderId } from "../src/adapters/llm/factory";
import { resolvePrice } from "../src/core/cost";
import type { ExperienceLevel } from "../src/core/model";

const [provider = "local", model = "qwen3-coder:30b", fixture = "booking.v1.ts", path = "src/domain/booking.ts", level = "mid"] = process.argv.slice(2);
const fx = join(__dirname, "..", "..", "evals", "fixtures", "prenota");
const read = (f: string) => readFileSync(join(fx, f), "utf8");

const mentor = createMentor(
  {
    provider: provider as ProviderId,
    anthropicModel: provider === "anthropic" ? model : "claude-opus-5-5",
    anthropicEffort: "medium",
    openaiModel: model,
    localBaseUrl: process.env.PEBBLE_LOCAL_URL ?? "http://localhost:11434/v1",
    localModel: model,
  },
  process.env.PEBBLE_API_KEY,
);
const store = { load: async () => ({ bootstrap: read("bootstrap.md"), architecture: read("architecture.md"), decisions: [{ name: "decisions", content: read("decisions.md") }] }) };
const t0 = Date.now();
reviewFile(mentor, store, readFileSync(join(__dirname, "..", "media", "mentor.md"), "utf8"), {
  path, content: read(join("src", fixture)), languageId: "typescript",
}, level as ExperienceLevel, resolvePrice(model, provider === "local")).then((r) => {
  console.log(JSON.stringify(r, null, 2));
  console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)} s`);
}).catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
