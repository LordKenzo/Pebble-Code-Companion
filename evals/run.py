#!/usr/bin/env python3
"""Runs Pebble's prompt evaluation cases with Claude Code in headless mode.

Usage:
    python3 evals/run.py                 # all cases
    python3 evals/run.py 05 07           # only the cases starting with these prefixes
    python3 evals/run.py --model opus    # a specific model

For each case: takes the "## Input" section, expands the "@include <path>" lines,
adds the LANGUAGE line as the extension does (en for cases ending in "-en", otherwise it)
unless the case already has one, sends it to the model with prompts/mentor.md as the
system prompt (no tools, no MCP, empty working folder) and saves the answer in
evals/runs/<date-time>/.
The automatic check only flags code blocks that are too long; the rest is judged
by hand against the case's "## Expected" section.
"""
import argparse
import datetime as dt
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVALS = ROOT / "evals"
PROMPT = ROOT / "prompts" / "mentor.md"
LANGUAGE_LINE = {
    "it": "LANGUAGE: it — write in Italian every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in Italian).",
    "en": "LANGUAGE: en — write in English every text, schema fields included; only if the developer's own message is in another language, answer them in that language (project files stay in English).",
}
MAX_CODE_LINES = 3


def system_prompt() -> str:
    text = PROMPT.read_text()
    _, sep, body = text.partition("\n---\n")
    return body.strip() if sep else text


def section(text: str, name: str) -> str:
    m = re.search(rf"^## {name}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    if not m:
        raise ValueError(f"missing '## {name}' section")
    return m.group(1).strip()


def expand(text: str) -> str:
    def repl(m: re.Match) -> str:
        return (EVALS / m.group(1).strip()).read_text().rstrip("\n")
    return re.sub(r"^@include (.+)$", repl, text, flags=re.M)


CONFIG_LANGS = {"json", "jsonc", "json5", "yaml", "yml", "toml", "ini", "env", "properties",
                "dockerfile", "gitignore", "ignore", "editorconfig"}
SHELL_LANGS = {"sh", "bash", "zsh", "shell", "console", "terminal", "powershell", "ps1"}
PLAIN_LANGS = {"", "text", "txt", "tree", "plaintext"}
LOOKS_LIKE_CODE = re.compile(r"[;{}]\s*$|=>|\bfunction\b|\breturn\b|\bconst\b|\blet\b|\bimport\b|\bdef\b|\bclass\b")
SHELL_SMUGGLING = re.compile(r"<<|\b(node|python3?|deno|bun|ruby|perl)\s+(-e|-c|--eval)\b")


MAX_SIGNATURE_LINES = 20
DECL_LANGS = {"ts", "typescript", "tsx", "mts", "cts"}
STATEMENT = [re.compile(x) for x in (
    r"\breturn\b", r"\b(if|for|while|switch|catch)\s*\(", r"\b(await|throw|yield)\b", r"\bnew\s+[A-Za-z_]", r"\bconsole\.",
    r"(?<!\bdeclare\s)\b(const|let|var)\s+[\w{[]", r"=>\s*\{", r"\)\s*(:\s*[^=;]+)?\{\s*[^}\s]", r"\)\s*(:\s*[^=;]+)?\{\s*$",
    r"^\s*(?:(?:private|public|protected|readonly|static)\s+)*[\w.]+\s*=(?![=>])",
)]


def is_signature_only(lang: str, body: str) -> bool:
    parts = lang.strip().lower().split()
    if not parts or parts[0] not in DECL_LANGS:
        return False
    lines = [l for l in (re.sub(r"//.*$", "", x) for x in body.splitlines()) if l.strip()]
    return len(lines) <= MAX_SIGNATURE_LINES and not any(p.search(l) for l in lines for p in STATEMENT)


def is_allowed_long_block(lang: str, body: str) -> bool:
    """Same rules as extension/src/core/policy.ts: zone A (configuration, commands), trees and zone B declarations pass."""
    parts = lang.strip().lower().split()
    l = parts[0] if parts else ""
    if l in CONFIG_LANGS or is_signature_only(lang, body):
        return True
    if l in SHELL_LANGS:
        return not SHELL_SMUGGLING.search(body)
    if l in PLAIN_LANGS:
        return not any(LOOKS_LIKE_CODE.search(line) for line in body.splitlines())
    return False


def longest_code_block(answer: str) -> int:
    """Lines of the longest code block. Configuration, commands, folder trees and declarations don't count."""
    longest = 0
    for lang, body in re.findall(r"```([^\n]*)\n(.*?)```", answer, re.S):
        if is_allowed_long_block(lang, body):
            continue
        longest = max(longest, len([l for l in body.splitlines() if l.strip()]))
    return longest


def run_case(case: Path, sysprompt_file: Path, workdir: Path, model: str | None) -> tuple[str, str, int]:
    message = expand(section(case.read_text(), "Input"))
    if not re.search(r"^LANGUAGE:", message, re.M):
        message += "\n" + LANGUAGE_LINE["en" if case.stem.endswith("-en") else "it"]
    cmd = ["claude", "-p", "--system-prompt-file", str(sysprompt_file), "--tools", "",
           "--strict-mcp-config", "--no-session-persistence"]
    if model:
        cmd += ["--model", model]
    res = subprocess.run(cmd, input=message, capture_output=True, text=True, cwd=workdir, timeout=600)
    answer = res.stdout.strip() if res.returncode == 0 else f"ERROR ({res.returncode}): {res.stderr.strip()}"
    return case.stem, answer, longest_code_block(answer)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("prefixes", nargs="*")
    ap.add_argument("--model")
    args = ap.parse_args()

    cases = sorted((EVALS / "cases").glob("*.md"))
    if args.prefixes:
        cases = [c for c in cases if any(c.name.startswith(p) for p in args.prefixes)]
    if not cases:
        sys.exit("no cases found")

    out = EVALS / "runs" / dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    out.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        sp = tmp / "system.md"
        sp.write_text(system_prompt())
        work = tmp / "work"
        work.mkdir()
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda c: run_case(c, sp, work, args.model), cases))

    summary = ["| Case | Longest code block | Check |", "|---|---|---|"]
    for name, answer, longest in results:
        (out / f"{name}.md").write_text(answer + "\n")
        flag = "ok" if longest <= MAX_CODE_LINES else f"⚠ over {MAX_CODE_LINES} lines"
        summary.append(f"| {name} | {longest} | {flag} |")
    (out / "_auto.md").write_text("\n".join(summary) + "\n")
    print(out)
    print("\n".join(summary))


if __name__ == "__main__":
    main()
