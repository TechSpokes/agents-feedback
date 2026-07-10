# feedback

This folder provides a repository-local learning loop for coding agents and maintainers. It stores sanitized observations that can reduce repeated setup, tooling, workflow, documentation, and verification friction.

## Installation

For a fresh repository, extract the release artifact at the repository root and point an agent to `.agents/feedback/AGENTS.md`.

The release artifact is the `.zip` file. The similarly named `.zip.sha256` file is optional verification metadata and is not extracted.

For an existing installation, never extract directly over `.agents/feedback`. Extract into a temporary staging directory and point an agent to the staged `UPGRADE.md`.

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
