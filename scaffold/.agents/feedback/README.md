# feedback

This folder stores repository-local agent feedback records that identify workflow friction, missing instructions, setup problems, verification gaps, and completed improvements for future agent sessions.

## Installation

When this folder is first extracted from a release artifact, `AGENTS.md` is an installer entrypoint. Point an agent at `.agents/feedback/AGENTS.md` so it can read `INSTALL.md`, wire the root instruction hook, verify the scaffold, and convert `AGENTS.md` to operational mode.

After installation, `AGENTS.md` contains operational instructions copied from `AGENTS.final.md`.

## Contents

- `AGENTS.md` contains installer instructions before setup and operational instructions after setup.
- `AGENTS.final.md` contains operational instructions copied over `AGENTS.md` after installation succeeds.
- `INSTALL.md` contains the agent-assisted installation procedure.
- `records/` contains lifecycle folders for YAML feedback records.
- `schemas/` contains JSON schemas for IDE and agent contract validation.
- `templates/` contains YAML templates and the managed root hook.
- `tools/` contains portable helper scripts when installed.

## Boundaries

Do not store secrets, credentials, raw private logs, screenshots, generated artifacts, customer data, private tokens, private issue text, large logs, or general task notes here.

Promote durable rules to the repository's canonical `AGENTS.md`, `README.md`, docs, scripts, or tests.
