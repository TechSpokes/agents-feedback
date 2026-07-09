# Agent Instructions for feedback - Installer Mode

## Summary

This folder is an agent-assisted installer for repository feedback. Read `INSTALL.md`, wire the target repository root instruction file, verify the scaffold, then replace this file with `AGENTS.final.md`.

## Must-follow rules

- Do not create feedback records before installation is complete.
- Preserve existing target repository instructions when editing the root instruction file.
- Add or update only the managed feedback hook from `templates/root-agents-hook.md`.
- Run the installation verification steps in `INSTALL.md`.
- Replace this file with `AGENTS.final.md` only after verification succeeds.
- Never put secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs in feedback records.

## Required Reading

- `INSTALL.md` defines the installation procedure.
- `templates/root-agents-hook.md` contains the managed root hook.
- `AGENTS.final.md` contains the operational instructions that replace this installer file.
