// Genera i fantasmini colorati da quelli del Mentor (azzurri): uno per fantasmino, come nel banner.
// Roadmap pesca, Suggeritore ⌥P verde, Git lilla. Si rilancia con `node scripts/ghost-tints.mjs` quando cambia un disegno.
import { readFileSync, writeFileSync } from "node:fs";

const MENTOR = { stop: "#b6d9ec", glow: "#5fd0ff", stroke: "#5d9cbf" };
const TINTS = {
  roadmap: { stop: "#f9cdb0", glow: "#ffa36b", stroke: "#c98a5e" },
  assist: { stop: "#bfe8cc", glow: "#5fe08f", stroke: "#5fa877" },
  git: { stop: "#d8ccf4", glow: "#b69cff", stroke: "#9c88d8" },
};
const MOODS = ["neutral", "thinking", "happy", "worried"];

for (const mood of MOODS) {
  const src = readFileSync(new URL(`../media/ghost-${mood}.svg`, import.meta.url), "utf8");
  for (const [name, t] of Object.entries(TINTS)) {
    const out = src
      .replaceAll(MENTOR.stop, t.stop)
      .replaceAll(MENTOR.glow, t.glow)
      .replaceAll(MENTOR.stroke, t.stroke)
      .replace(/<!--[^>]*-->/, `<!-- Fantasmino ${name}, ${mood}: generato da ghost-${mood}.svg (scripts/ghost-tints.mjs). -->`);
    writeFileSync(new URL(`../media/ghost-${mood}-${name}.svg`, import.meta.url), out);
  }
}
console.log(`fantasmini colorati: ${MOODS.length * Object.keys(TINTS).length}`);
