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
