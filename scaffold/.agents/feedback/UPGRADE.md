# feedback Upgrade

## Purpose

Upgrade managed scaffold files while preserving shared records, ignored local content, and unrelated repository instructions.

## Staging Requirement

Never extract a new artifact directly over an existing `.agents/feedback`. Extract it into a temporary staging directory and ask an agent to read the staged `.agents/feedback/UPGRADE.md`.

## Preserved Content

- Preserve every file under the installed `records/` lifecycle folders.
- Preserve personal content under installed `local/`.
- Preserve unrelated root repository instructions.
- Do not rewrite existing records automatically.

## Managed Content

The release manages scaffold instruction files, schemas, templates, the state tool, `records/README.md`, `local/README.md`, and `local/.gitignore`. Repository-specific durable rules belong in normal repository files or ignored `local/AGENTS.md`.

## Upgrade Steps

1. Record the installed shared record paths and ignored local paths before changing managed files.
2. Copy managed files from the staged scaffold without replacing installed record files or personal local content.
3. Add or update only the bounded root hook from the staged `templates/root-agents-hook.md`.
4. Run the staged Node.js verification when Node.js 22 or newer is available.
5. Use the structural manual verification from staged `INSTALL.md` when Node.js is unavailable or older.
6. Confirm the preserved shared and local path sets are unchanged.
7. Install the staged `AGENTS.final.md` as the operational `.agents/feedback/AGENTS.md` only after verification succeeds.
8. Report managed files changed, preservation evidence, verification mode, and attention items.

## Failure Behavior

On failure, do not delete or rewrite records, do not delete personal local content, do not alter unrelated root instructions, and report the partial managed-file changes that need repair.
