# feedback Installer

## Purpose

Use this file when a user has extracted the feedback artifact into `.agents/feedback` and asked an agent to complete installation.

## Installation Steps

1. Confirm the current repository contains `.agents/feedback/AGENTS.md`, `.agents/feedback/AGENTS.final.md`, `.agents/feedback/templates/root-agents-hook.md`, `.agents/feedback/records/`, `.agents/feedback/schemas/`, and `.agents/feedback/tools/feedback-state.mjs`.
2. Locate the repository root instruction file. Prefer `AGENTS.md` at the repository root. If no root instruction file exists, create `AGENTS.md`.
3. Add or update the managed block from `.agents/feedback/templates/root-agents-hook.md`. Preserve all other root instruction content.
4. Run `node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback`.
5. Confirm the command exits `0`.
6. Replace `.agents/feedback/AGENTS.md` with the contents of `.agents/feedback/AGENTS.final.md`.
7. Report the root instruction file changed and the verification command output.

## Completion Criteria

- The root instruction file contains the `agents-feedback:start` and `agents-feedback:end` markers.
- `.agents/feedback/AGENTS.md` contains operational instructions, not installer instructions.
- `node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback` exits `0`.
