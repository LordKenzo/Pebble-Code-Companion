## ADR-005: Model provider behind an interface, Claude as the first implementation
Status: accepted (updated 2026-11-23)
Context: the bootstrap names Claude as first choice and the key provided by the user. Models and prices change fast.
Decision: the core defines a minimal interface (send context and mode, receive the answer). The Claude adapter is the first. The key lives in VS Code's SecretStorage, never in files or settings. The stable context (system prompt, ADRs, architecture) goes at the head of the request to benefit from prompt caching.
Alternatives ruled out: direct provider calls scattered through the code (impossible to change model); our own proxy (costs and handling of users' data, premature).
Consequences: evals must run on the same adapter, so models can be compared. The user's code is sent to the provider: the documentation must say so clearly.

Update 2026-11-23: besides Claude, the extension supports OpenAI and local models (Ollama, LM Studio, llama.cpp) through a single OpenAI-compatible adapter with a configurable address. First trial: `qwen3-coder:30b` locally finds the obvious violations (case 05) but not the race condition (case 07). Local is good for privacy and zero cost, Claude for the "senior" notes.
