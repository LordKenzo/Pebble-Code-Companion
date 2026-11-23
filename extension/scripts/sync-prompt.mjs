// Copia il prompt di sistema (prompts/mentor.md, dalla riga "---" in giù) dentro l'estensione.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const src = readFileSync(new URL("../../prompts/mentor.md", import.meta.url), "utf8");
const idx = src.indexOf("\n---\n");
const body = (idx >= 0 ? src.slice(idx + 5) : src).trim() + "\n";
mkdirSync(new URL("../media/", import.meta.url), { recursive: true });
writeFileSync(new URL("../media/mentor.md", import.meta.url), body);
console.log(`prompt sincronizzato (${body.length} caratteri)`);
