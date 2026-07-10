# feedback

This folder provides a repository-local learning loop for coding agents and maintainers. It stores sanitized observations that can reduce repeated setup, tooling, workflow, documentation, and verification friction.

You normally interact with this folder by asking an agent to inspect or capture relevant feedback. Manual record editing is optional.

## Start Here

During fresh setup, the agent reads `AGENTS.md` and follows `INSTALL.md`. After verification, `AGENTS.md` becomes the operational instruction file.

For an existing installation, the agent follows the staged procedure in `UPGRADE.md`. Those two procedure files are authoritative for agent installation and upgrade behavior.

## First Use

Ask an agent to read repository instructions and inspect active feedback relevant to the next substantial or unfamiliar task.

When Node.js 22 or newer is available, humans and agents can run:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief
```

## Shared and Local Content

Shared records live under `records/` and are normally committed. Ignored per-clone additions live under `local/` and remain secret-free.

Agents inspect relevant active feedback before substantial or unfamiliar work. Durable lessons move into normal repository instructions, docs, scripts, tests, or code before feedback is completed.

## Contents

- `AGENTS.md` contains installer instructions before setup and operational instructions after setup.
- `AGENTS.final.md` contains operational instructions.
- `INSTALL.md` defines fresh installation.
- `UPGRADE.md` defines staged upgrades.
- `records/` contains shared lifecycle folders.
- `local/` contains the ignored per-clone boundary.
- `schemas/` contains the sole record and plan contracts.
- `templates/` contains YAML templates and the managed root hook.
- `tools/` contains the dependency-free state helper.

## Boundaries

This folder is not long-term memory, a general task tracker, canonical project documentation, or a project changelog.

Never store secrets, credentials, raw private logs, screenshots, generated artifacts, customer data, private tokens, private issue text, or large logs.
