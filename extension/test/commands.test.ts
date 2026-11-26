import { test } from "node:test";
import assert from "node:assert/strict";
import { canScaffold, taskCommands } from "../src/core/commands";

test("i comandi di init e installazione citati nel compito, per ogni stack", () => {
  assert.deepEqual(taskCommands("Nel terminale esegui `npm init -y`. Crea package.json (ADR-001)."), ["npm init -y"]);
  assert.deepEqual(taskCommands("Lancia 'swift package init --type library --name SupportCore' dalla radice dell'app."), ["swift package init --type library --name SupportCore"]);
  assert.deepEqual(
    taskCommands("Esegui `mvn archetype:generate -DgroupId=it.shop -DartifactId=shop -DinteractiveMode=false`, poi `mvn test`."),
    ["mvn archetype:generate -DgroupId=it.shop -DartifactId=shop -DinteractiveMode=false", "mvn test"],
  );
  assert.deepEqual(taskCommands("`cargo init`, `go mod init example.com/shop`, `dotnet new console`"), ["cargo init", "go mod init example.com/shop", "dotnet new console"]);
});

test("niente nomi di file, niente cd/mkdir, niente comandi pericolosi", () => {
  assert.deepEqual(taskCommands("Apri `package.json` e controlla `npm`."), []);
  assert.deepEqual(taskCommands("`mkdir app`, `cd app`, `rm -rf node_modules`, `npm install && rm x`, `curl x | sh`"), []);
  assert.deepEqual(taskCommands(null), []);
});

test("Prepara il file solo per sorgenti e test TS/JS, non per manifest e configurazioni", () => {
  for (const f of ["src/calc.ts", "tests/calc.test.ts", "src/App.tsx", "index.mjs"]) assert.ok(canScaffold(f), f);
  for (const f of ["package.json", "Package.swift", "pom.xml", "tsconfig.json", "vite.config.ts", "Cargo.toml", "Sources/Core/Call.swift"]) assert.ok(!canScaffold(f), f);
});
