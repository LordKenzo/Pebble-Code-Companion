// Prova la modalità INIT strutturata su un bootstrap: node out/try-init.js <provider> <modello> <bootstrap.md>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMentor, type ProviderId } from "../src/adapters/llm/factory";
import { buildInitMessage, InitPlan, initPlanToFiles, initPlanToMarkdown } from "../src/core/modes";

const [provider = "openai", model = "gpt-6.2-sol", bootstrapPath] = process.argv.slice(2);
const mentor = createMentor(
  { provider: provider as ProviderId, anthropicModel: model, anthropicEffort: "medium", openaiModel: model, localBaseUrl: "http://localhost:11434/v1", localModel: model },
  process.env.PEBBLE_API_KEY,
);
const system = readFileSync(join(__dirname, "..", "media", "mentor.md"), "utf8");
const t0 = Date.now();
mentor
  .generate(system, buildInitMessage(readFileSync(bootstrapPath!, "utf8"), "mid"), InitPlan, "init_plan")
  .then(({ data, usage }) => {
    console.log(initPlanToMarkdown(data));
    console.log("\nFILE:", initPlanToFiles(data, "2026-11-23").map((f) => f.path).join(", "));
    console.log("USO:", usage, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  })
  .catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
