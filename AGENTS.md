# Project Instructions

- Windows commands use PowerShell 7 by default; Linux scripts use WSL2 Ubuntu.
- Do not use Bash heredocs in PowerShell. Put complex scripts in files.
- Windows and WSL must not share `node_modules` or Python virtual environments.
- Keep the 48-hour version small and understandable; avoid speculative defensive code.
- Do not add hashes or SHA-256 checks unless a specific requirement needs them.
- Diary entries stay in the browser. Send them to the AI service only after explicit user confirmation.
- The API must not persist diary content or log diary text, prompts, AI output, or authorization headers.
- Every AI conclusion must include an exact quote from a submitted entry. The server calculates quote positions and rejects missing quotes.
- Never present placeholder or mock output as a real AI result.

## Engineering entrypoint

Before starting an AI-related task, read the following in order:

1. `AGENTS.md`
2. `docs/engineering/PROJECT_BASELINE.md`
3. `docs/engineering/AI_PLAYBOOK.md`
4. The current GitHub Issue
5. `docs/engineering/CONTRACTS.md`, `docs/engineering/DECISIONS.md`, `docs/api-contract.md`, and the relevant source files

Every task needs one GitHub Issue with its goal, boundary, and acceptance criteria. If the baseline, contract, and source code conflict, stop and ask the user to decide. The `dev` branch is for integration; `main` is for the accepted demonstrable release. Feature branches merge through Pull Requests.

The engineering documents are the collaboration entrypoint. `docs/api-contract.md` remains the only authority for API fields and payloads; `docs/engineering/CONTRACTS.md` explains how that contract is maintained.
