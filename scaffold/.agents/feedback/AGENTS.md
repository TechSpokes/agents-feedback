# Agent Instructions for feedback Installation

## Summary

This folder is the agent-assisted installer for repository feedback. Read `INSTALL.md`, wire the repository root instruction file, verify the scaffold, and replace this file with `AGENTS.final.md` only after a fresh installation succeeds.

## Must-follow Rules

- Do not create feedback records before installation is complete.
- Preserve unrelated repository instructions.
- Add or update only the managed hook from `templates/root-agents-hook.md`.
- Stop and read `UPGRADE.md` when `.agents/feedback` existed before extraction or the pre-extraction state is unknown.
- Use the Node.js verification path when Node.js 22 or newer is available.
- Use the documented manual fallback when Node.js is unavailable or older.
- Stop and read `UPGRADE.md` if feedback records or an existing managed hook indicate an existing installation.
- Never store secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs.

## Required Reading

- `INSTALL.md` defines fresh installation.
- `UPGRADE.md` defines staged, record-preserving upgrades.
- `templates/root-agents-hook.md` contains the managed root hook.
- `AGENTS.final.md` contains the operational instructions installed after verification.
