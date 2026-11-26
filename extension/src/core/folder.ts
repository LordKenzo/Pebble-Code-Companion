/**
 * Che cosa è la cartella aperta, prima di cominciare: un progetto esistente da adottare, un contenitore di progetti
 * (es. ~/dev), una cartella vuota per un progetto nuovo, o un dubbio. Logica pura sui percorsi relativi dei file.
 */
import { slugify } from "./slug";

export type FolderKind = "empty" | "project" | "container" | "other";

/** I file che dicono "qui c'è un progetto", per gli stack più comuni. */
const MANIFEST = /^(package\.json|deno\.jsonc?|pyproject\.toml|requirements[\w-]*\.txt|setup\.py|Pipfile|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|[^/]+\.(csproj|fsproj|sln)|Gemfile|composer\.json|Package\.swift|pubspec\.yaml|CMakeLists\.txt|mix\.exs)$/;
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|rb|php|cs|vue|svelte|dart|c|cpp|h)$/;
/** File che non fanno di una cartella un progetto: quelli di Pebble, dell'editor, di git, i README. */
const NOISE = /^(bootstrap\.md|init\.md|readme(\.\w+)?|license(\.\w+)?|\.gitignore|\.gitattributes|\.ds_store|\.editorconfig)$|^\.(pebble|vscode|idea|git)\//i;

export interface FolderInfo {
  kind: FolderKind;
  /** Contenitore: le sottocartelle che sembrano progetti, in ordine alfabetico. */
  projects: string[];
}

export function classifyFolder(paths: readonly string[]): FolderInfo {
  const files = paths.map((p) => p.replace(/\\/g, "/").replace(/^\.\//, "")).filter((p) => p && !NOISE.test(p));
  if (!files.length) return { kind: "empty", projects: [] };
  const rootFiles = files.filter((p) => !p.includes("/"));
  const isCodeAtRoot = rootFiles.some((p) => MANIFEST.test(p) || SOURCE.test(p)) || files.some((p) => p.startsWith("src/") && SOURCE.test(p));
  if (isCodeAtRoot) return { kind: "project", projects: [] };
  // Una sottocartella è un progetto se ha un manifest subito dentro.
  const projects = [...new Set(files.filter((p) => p.split("/").length === 2 && MANIFEST.test(p.split("/")[1]!)).map((p) => p.split("/")[0]!))].sort();
  if (projects.length) return { kind: "container", projects };
  if (files.some((p) => SOURCE.test(p))) return { kind: "project", projects: [] };
  return { kind: "other", projects: [] };
}

/** Un nome di cartella dal titolo del bootstrap: "# Progetto Uno — bootstrap" → "progetto-uno". */
export function folderNameFromBootstrap(bootstrap: string | null | undefined): string {
  const title = /^#\s+(.+)$/m.exec(bootstrap ?? "")?.[1] ?? "";
  const name = slugify(title.replace(/\s*[—–-]\s*bootstrap\s*$/i, ""));
  return name || "nuovo-progetto";
}
