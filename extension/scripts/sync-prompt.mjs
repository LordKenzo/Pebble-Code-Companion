// Copia il prompt di sistema (prompts/mentor.md, dalla riga "---" in giù) dentro l'estensione.
// Un solo prompt, in inglese, per tutte le lingue: la riga LANGUAGE decide la lingua delle risposte (ADR-012).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
mkdirSync(new URL("../media/", import.meta.url), { recursive: true });
const text = readFileSync(new URL("../../prompts/mentor.md", import.meta.url), "utf8");
const idx = text.indexOf("\n---\n");
const body = (idx >= 0 ? text.slice(idx + 5) : text).trim() + "\n";
writeFileSync(new URL("../media/mentor.md", import.meta.url), body);
rmSync(new URL("../media/mentor.en.md", import.meta.url), { force: true });
console.log(`prompt sincronizzato (${body.length} caratteri)`);
