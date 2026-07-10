# Agent Instructions for agents-feedback Scaffold Maintenance

## Summary

This repository maintains an agent-assisted `.agents/feedback` installer scaffold for other repositories. Read this file before changing scaffold instructions, schemas, templates, tools, tests, artifact tooling, or release documentation.

## Must-follow rules

- Maintain this repository as the source for the scaffold, not as an installed feedback folder.
- Keep the installed scaffold dependency-free.
- Keep target-repository setup limited to extracting `.agents/feedback` and pointing an agent at `.agents/feedback/AGENTS.md`.
- Require temporary staging before upgrading an existing `.agents/feedback` installation.
- Preserve committed shared records and ignored secret-free local additions as separate scopes.
- Do not add a changelog for implemented feedback records.
- Do not store secrets, credentials, raw private logs, customer data, private issue text, screenshots, large logs, or private tokens in examples, fixtures, or docs.
- Keep scaffold instructions short enough for agents to read completely.

## Must-read documents

- `README.md` explains project purpose, artifact installation, verification, and release scope.
- `CONTRIBUTING.md` defines contribution scope and verification expectations.
- `CHANGELOG.md` records public product releases only.
- `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md` define public repository support and conduct policy.
- `docs/specification.md` defines the installer scaffold contract, lifecycle, records, plans, script behavior, and safety rules.
- `docs/releases/README.md` defines release note file requirements and the draft release workflow.
- `docs/releases/v1.0.0.md` defines the v1 release body used for the draft GitHub Release.
- `docs/releases/v1.1.0.md` defines the v1.1.0 release body used for the draft GitHub Release.
- `scaffold/.agents/feedback/README.md` explains installed folder behavior when the scaffold exists.

## Agent Guidelines

Prefer small changes that preserve portability. If a proposed feature requires installed dependencies, background services, databases, or a target-repository package install, reject it for v1 or document it as a future extension.

Keep repository documentation aligned with scaffold behavior. When changing lifecycle states, record fields, plan fields, script output, installer behavior, or release artifact layout, update `docs/specification.md` in the same change.

Keep one record schema and one plan schema until a released installed base requires compatibility handling. Do not add schema dispatchers or automatic migration without evidence.

## Context

The project exists because many repositories lack a durable place for agents to record workflow friction that should improve future agent sessions. The scaffold is intentionally a folder-based protocol installed by agents rather than an application.

## References

- `scaffold/.agents/feedback/AGENTS.md` contains installer instructions used immediately after artifact extraction.
- `scaffold/.agents/feedback/AGENTS.final.md` contains operational instructions used after installation.
- `scaffold/.agents/feedback/tools/feedback-state.mjs` summarizes records when the scaffold exists.
