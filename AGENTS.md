# Agent Instructions for agents-feedback Scaffold Maintenance

## Summary

This repository maintains a portable `.agents/feedback` scaffold for other repositories. Read this file before changing scaffold instructions, schemas, templates, tools, tests, or release documentation.

## Must-follow rules

- Maintain this repository as the source for the scaffold, not as an installed feedback folder.
- Keep the installed scaffold dependency-free.
- Keep target-repository setup limited to copying `.agents/feedback` and adding one instruction hook.
- Do not add a changelog for implemented feedback records.
- Do not store secrets, credentials, raw private logs, customer data, or private tokens in examples, fixtures, or docs.
- Keep scaffold instructions short enough for agents to read completely.

## Must-read documents

- `README.md` explains project purpose, installation modes, verification, and release scope.
- `CONTRIBUTING.md` defines contribution scope and verification expectations.
- `docs/specification.md` defines the scaffold contract, lifecycle, records, plans, script behavior, and safety rules.
- `docs/release-v1.md` defines the v1 release scope and approval-gated publishing steps.
- `scaffold/.agents/feedback/README.md` explains installed folder behavior when the scaffold exists.

## Agent guidelines

Prefer small changes that preserve portability. If a proposed feature requires dependencies, background services, databases, or a target-repository package install, reject it for v1 or document it as a future extension.

Keep repository documentation aligned with scaffold behavior. When changing lifecycle states, record fields, plan fields, or script output, update `docs/specification.md` in the same change.

## Context

The project exists because many repositories lack a durable place for agents to record workflow friction that should improve future agent sessions. The scaffold is intentionally a folder-based protocol rather than an application.

## References

- `scaffold/.agents/feedback/AGENTS.md` contains bootstrap instructions used during installation.
- `scaffold/.agents/feedback/AGENTS.final.md` contains operational instructions used after installation.
- `scaffold/.agents/feedback/tools/feedback-state.mjs` summarizes records when the scaffold exists.
