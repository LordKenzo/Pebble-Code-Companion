// Copia i prompt di sistema (prompts/mentor.md e mentor.en.md, dalla riga "---" in giù) dentro l'estensione (ADR-012).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
mkdirSync(new URL("../media/", import.meta.url), { recursive: true });
for (const [src, out] of [["mentor.md", "mentor.md"], ["mentor.en.md", "mentor.en.md"]]) {
  const text = readFileSync(new URL(`../../prompts/${src}`, import.meta.url), "utf8");
  const idx = text.indexOf("\n---\n");
  const body = (idx >= 0 ? text.slice(idx + 5) : text).trim() + "\n";
  writeFileSync(new URL(`../media/${out}`, import.meta.url), body);
  console.log(`prompt ${out} sincronizzato (${body.length} caratteri)`);
}
