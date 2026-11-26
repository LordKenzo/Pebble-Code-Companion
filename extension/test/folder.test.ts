import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyFolder, folderNameFromBootstrap } from "../src/core/folder";

test("cartella vuota, o con i soli file di Pebble e dell'editor: progetto nuovo", () => {
  assert.deepEqual(classifyFolder([]), { kind: "empty", projects: [] });
  assert.equal(classifyFolder(["bootstrap.md", ".pebble/roadmap.md", "README.md", ".gitignore", ".vscode/settings.json"]).kind, "empty");
});

test("manifest o sorgenti nella radice: progetto esistente, qualunque stack", () => {
  for (const f of ["package.json", "pyproject.toml", "go.mod", "Cargo.toml", "pom.xml", "Shop.sln", "Api.csproj", "Gemfile", "Package.swift", "pubspec.yaml", "main.py"]) {
    assert.equal(classifyFolder([f]).kind, "project", f);
  }
  assert.equal(classifyFolder(["src/index.ts", "README.md"]).kind, "project");
});

test("niente nella radice ma progetti nelle sottocartelle: un contenitore", () => {
  const r = classifyFolder(["mini-calc/package.json", "mini-calc/src/a.ts", "shop/pyproject.toml", "notes.txt", "deep/x/package.json"]);
  assert.deepEqual(r, { kind: "container", projects: ["mini-calc", "shop"] });
});

test("qualche file senza codice: un dubbio da chiedere", () => {
  assert.equal(classifyFolder(["appunti.txt", "idee/schizzo.png"]).kind, "other");
});

test("il nome della cartella nuova viene dal titolo del bootstrap", () => {
  assert.equal(folderNameFromBootstrap("# Progetto Uno — bootstrap\n\n## Cosa devo fare"), "progetto-uno");
  assert.equal(folderNameFromBootstrap("# Città & Caffè"), "citta-caffe");
  assert.equal(folderNameFromBootstrap(null), "nuovo-progetto");
});
