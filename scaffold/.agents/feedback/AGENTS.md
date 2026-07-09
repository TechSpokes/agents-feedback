# Agent Instructions for feedback - Bootstrap Mode

## Summary

This folder has not been fully wired into the target repository yet. Read the full file, add the root instruction hook, then replace this file with `AGENTS.final.md`.

## Must-follow rules

- Do not create feedback records before installation wiring is complete.
- Add the hook from `templates/root-agents-hook.md` to the target repository's root `AGENTS.md` or equivalent agent instruction surface.
- Preserve any existing target repository instructions when adding the hook.
- Replace this file with `AGENTS.final.md` only after the hook is present.
- Do not include secrets, credentials, raw private logs, customer data, or private tokens in feedback records.

## Must-read documents

- `README.md` explains installed folder purpose and boundaries.
- `templates/root-agents-hook.md` provides the root instruction hook.
- `AGENTS.final.md` provides the operational instructions that replace this bootstrap file.

## Agent guidelines

Prefer the smallest reliable hook. If the target repository already has root `AGENTS.md`, add a short section there.

If the target repository has no root instruction file, ask before creating one unless the user explicitly requested automatic installation.

## Context

Agents usually discover instructions from their current working directory. A folder under `.agents/feedback` is clean, but it is not reliably discoverable from unrelated paths unless the target repository points agents to it.
