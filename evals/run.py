#!/usr/bin/env python3
"""Runs Pebble's prompt evaluation cases with Claude Code in headless mode.

Usage:
    python3 evals/run.py                 # all cases
    python3 evals/run.py 05 07           # only the cases starting with these prefixes
    python3 evals/run.py --model opus    # a specific model
    python3 evals/run.py --whole-prompt  # the whole prompt, to compare costs

For each case: takes the "## Input" section, expands the "@include <path>" lines,
adds the LANGUAGE line as the extension does (en for cases ending in "-en", otherwise it)
unless the case already has one, sends it to the model with prompts/mentor.md as the
system prompt, cut to the case's MODE as the extension does (--whole-prompt sends it all),
with no tools, no MCP, an empty working folder, and saves the answer in evals/runs/<date-time>/,
with tokens and cost per case in _auto.md.
The automatic check only flags code blocks that are too long; the rest is judged
by hand against the case's "## Expected" section.
"""
import argparse
import datetime as dt
import json
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


def prompt_for_mode(full: str, mode: str | None) -> str:
    """The same cut as the extension (core/prompt.ts, ADR-016): the core, only this mode's section, the tone."""
    if not mode:
        return full
    start = re.search(r"^## Modes\s*$", full, re.M)
    if not start:
        return full
    core, rest = full[:start.start()].rstrip(), full[start.end():]
    heads = list(re.finditer(r"^### MODE: ([A-Z_]+)\s*$", rest, re.M))
    for i, h in enumerate(heads):
        if h.group(1) != mode:
            continue
        end = heads[i + 1].start() if i + 1 < len(heads) else len(rest)
        body = rest[h.start():end]
        tail = ""
        if i == len(heads) - 1:
            nxt = re.search(r"^## ", body[len(h.group(0)):], re.M)
            if nxt:
                cut = len(h.group(0)) + nxt.start()
                body, tail = body[:cut], body[cut:]
        else:
            t = re.search(r"^## (?!Modes)", rest[heads[-1].start() + len(heads[-1].group(0)):], re.M)
            if t:
                tail = rest[heads[-1].start() + len(heads[-1].group(0)) + t.start():]
        return "\n\n".join(x for x in (core, "## Modes", body.strip(), tail.strip()) if x) + "\n"
    return full


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


def run_case(case: Path, full_prompt: str, tmp: Path, model: str | None, whole: bool) -> tuple[str, str, int, dict]:
    message = expand(section(case.read_text(), "Input"))
    if not re.search(r"^LANGUAGE:", message, re.M):
        message += "\n" + LANGUAGE_LINE["en" if case.stem.endswith("-en") else "it"]
    mode = re.search(r"^MODE: ([A-Z_]+)\s*$", message, re.M)
    sp = tmp / f"system-{case.stem}.md"
    sp.write_text(full_prompt if whole else prompt_for_mode(full_prompt, mode and mode.group(1)))
    cmd = ["claude", "-p", "--system-prompt-file", str(sp), "--tools", "",
           "--strict-mcp-config", "--no-session-persistence", "--output-format", "json"]
    if model:
        cmd += ["--model", model]
    res = subprocess.run(cmd, input=message, capture_output=True, text=True, cwd=tmp / "work", timeout=600)
    usage: dict = {"system_chars": len(sp.read_text())}
    if res.returncode != 0:
        return case.stem, f"ERROR ({res.returncode}): {res.stderr.strip()}", 0, usage
    try:
        out = json.loads(res.stdout)
    except json.JSONDecodeError:
        return case.stem, res.stdout.strip(), longest_code_block(res.stdout), usage
    u = out.get("usage") or {}
    usage.update(
        tokens_in=u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0),
        tokens_out=u.get("output_tokens", 0),
        cost_usd=out.get("total_cost_usd"),
    )
    answer = str(out.get("result", "")).strip()
    return case.stem, answer, longest_code_block(answer), usage


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("prefixes", nargs="*")
    ap.add_argument("--model")
    ap.add_argument("--whole-prompt", action="store_true",
                    help="send the whole prompt instead of the mode's part, to compare costs")
    args = ap.parse_args()

    cases = sorted((EVALS / "cases").glob("*.md"))
    if args.prefixes:
        cases = [c for c in cases if any(c.name.startswith(p) for p in args.prefixes)]
    if not cases:
        sys.exit("no cases found")

    out = EVALS / "runs" / dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    out.mkdir(parents=True, exist_ok=True)

    full = system_prompt()
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "work").mkdir()
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda c: run_case(c, full, tmp, args.model, args.whole_prompt), cases))

    # Tokens and cost per case (ADR-016): every prompt change shows what it costs next to what it fixes.
    summary = ["| Case | Longest code block | Check | System chars | Tokens in | Tokens out | Cost |",
               "|---|---|---|---|---|---|---|"]
    totals = {"tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0}
    for name, answer, longest, usage in results:
        (out / f"{name}.md").write_text(answer + "\n")
        flag = "ok" if longest <= MAX_CODE_LINES else f"⚠ over {MAX_CODE_LINES} lines"
        cost = usage.get("cost_usd")
        for k in totals:
            totals[k] += usage.get(k) or 0
        summary.append(f"| {name} | {longest} | {flag} | {usage['system_chars']} | {usage.get('tokens_in', '–')} "
                       f"| {usage.get('tokens_out', '–')} | {'–' if cost is None else f'${cost:.4f}'} |")
    summary.append(f"| **total** | | | | {totals['tokens_in']} | {totals['tokens_out']} | ${totals['cost_usd']:.4f} |")
    (out / "_auto.md").write_text("\n".join(summary) + "\n")
    print(out)
    print("\n".join(summary))


if __name__ == "__main__":
    main()
