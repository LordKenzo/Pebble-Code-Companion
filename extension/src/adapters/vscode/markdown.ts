import { Marked } from "marked";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// L'HTML scritto dal modello viene mostrato come testo, mai interpretato.
const md = new Marked({ gfm: true, breaks: false, renderer: { html: ({ text }) => escapeHtml(text) } });

export function renderMarkdown(text: string): string {
  return md.parse(text, { async: false }) as string;
}

export { escapeHtml };
