# feedback Installer

## Purpose

Use this file after the release artifact has been extracted into a repository that does not already contain an installed `.agents/feedback` scaffold.

## Existing Installation Check

Stop and follow `UPGRADE.md` when the root instruction surface already contains `agents-feedback:start` or any YAML record already exists under `records/`. Existing installations must use staged extraction; never extract a new artifact directly over them.

## Installation Steps

1. Confirm `AGENTS.md`, `AGENTS.final.md`, `INSTALL.md`, `UPGRADE.md`, `README.md`, `records/`, `schemas/`, `templates/`, `local/`, and `tools/feedback-state.mjs` exist.
2. Confirm lifecycle folders exist under `records/` for `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`.
3. Locate the repository root instruction surface. Prefer root `AGENTS.md`; create it when no equivalent exists.
4. Add or update only the managed block from `templates/root-agents-hook.md`. Preserve unrelated content and ensure exactly one managed block remains.
5. Check `node --version`.
6. Run `node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback --active --brief --shared-only` when Node.js 22 or newer is available.
7. Require exit code `0`. Report attention items without treating them as installation failure.
8. Manually verify the managed files, lifecycle folders, local boundary, and root hook when Node.js is unavailable or older than 18.
9. Replace `.agents/feedback/AGENTS.md` with `.agents/feedback/AGENTS.final.md` only after verification succeeds.
10. Report the root instruction file changed, verification mode, and any attention items.

## Failure Behavior

On failure, keep installer `AGENTS.md`, preserve records and local content, preserve unrelated root instructions, and report the failed check and any managed files already changed.

## Completion Criteria

- The root instruction surface contains exactly one managed feedback block.
- `.agents/feedback/AGENTS.md` contains operational instructions.
- Automated verification exits `0` or the documented manual structure check passes.
