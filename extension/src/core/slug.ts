/**
 * Un nome di file o cartella da un titolo: minuscole, senza accenti, parole unite da "-".
 * Se è troppo lungo si taglia tra due parole, mai a metà: "separare-la-logica-dalla-finestra-un-core".
 */
export function slugify(s: string, max = 40): string {
  const full = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (full.length <= max) return full;
  const cut = full.slice(0, max + 1);
  const at = cut.lastIndexOf("-");
  // Una sola parola lunghissima: meglio tagliarla che restare senza nome.
  return at > 0 ? cut.slice(0, at) : full.slice(0, max);
}
