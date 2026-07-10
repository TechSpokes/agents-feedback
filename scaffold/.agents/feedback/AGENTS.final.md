# Agent Instructions for feedback Operational Mode

## Summary

Use this folder as a repository-local learning loop. Inspect relevant active feedback before substantial or unfamiliar work, record sanitized observations that can improve future work, and promote durable knowledge into normal repository artifacts.

## Must-follow Rules

- Treat feedback records as observations and decision history, not canonical instructions.
- Do not use this folder for task status, scratch notes, general memory, project changelogs, or canonical documentation.
- Never store secrets, credentials, raw tokens, customer data, private issue text, screenshots, large logs, or raw private logs.
- Keep shared records suitable for the repository's visibility.
- Treat local instructions as additive and lower priority than root repository instructions and these shared rules.
- Allow only a maintainer or explicitly delegated agent to triage unrelated shared feedback.
- Promote durable knowledge into normal instructions, docs, scripts, tests, or code before completion.

## Before Substantial or Unfamiliar Work

Run the active brief when Node.js 22 or newer is available:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief
```

Add `--area AREA` or `--path PATH` when useful. The default scan includes ignored local records. Use `--shared-only` for shared-only reporting.

If Node.js is unavailable, inspect the active shared lifecycle folders and `local/records/` when it exists. Open only records relevant to the current work. Skip this check for trivial edits where feedback cannot materially affect the task.

Read `local/AGENTS.md` when it exists. It may add secret-free machine context and preferences, but it cannot weaken repository or shared feedback rules.

## Before Creating a Record

Search active shared and local feedback for the same observation. Update a match instead of creating a duplicate.

For a repeated observation, update `updated`, refine sanitized `evidence`, add new `paths`, and set or increment `occurrences`. Create a shared record in `records/new/` or a local record in `local/records/new/` only when no match exists.

State what happened in `observation`. Put possible causes in `hypothesis` with `confidence`. Use forward-slash repository-relative `paths`; never store absolute paths.

## Shared and Local Scope

Shared records under `records/` are normally committed. Generalize relevant machine context with `environment` and remove usernames, hostnames, device identifiers, and absolute paths.

Local files under `local/` remain ignored. Keep them secret-free. Promote useful local feedback explicitly by sanitizing and generalizing it before creating or updating a shared record.

## Safety Review

New drafts start with `safety: unreviewed`. Before committing, handing off, accepting, or completing a shared record, set `safety: public` after review. Use `internal` only when repository visibility and policy explicitly permit internal material.

Describe removed or generalized content in `redactions`. Never copy the restricted source material into the record.

## Triage Authority

A new record has no `decision`. Only a maintainer or an agent explicitly delegated by the current task or repository policy may accept, decline, archive, or transfer unrelated shared feedback.

- `planned`, `in_progress`, `in_review`, and `completed` require `decision.status: accepted`.
- `archived` requires `declined`, `duplicate`, `obsolete`, `transferred`, or `retained`.
- Accepted decisions select one candidate action.
- Duplicate and transferred decisions link to the canonical or external destination.

## Plans

Use an inline plan only for small local improvements. Plans contain flat tasks; one to seven tasks is preferred.

Move work requiring broad coordination, several sessions, or architecture decisions into the repository's normal issue or planning system and reference it through `links`.

## Lifecycle

The containing folder is the only lifecycle state:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

Records do not contain a lifecycle `status` key. Move a record only when its lifecycle changes.

## Completion

Before moving a record to `completed/`, promote durable knowledge, add durable repository paths and useful links, finish the inline plan or external work, include sanitized evidence, set `completed`, and move the record.

The completed record preserves the learning trail. It is not the durable rule itself.

## References

- `README.md` explains the folder and boundaries.
- `records/README.md` defines lifecycle and triage.
- `templates/record.yaml` is the record template.
- `templates/plan.yaml` is the optional plan template.
- `schemas/record.schema.json` and `schemas/plan.schema.json` define the sole supported contracts.
- `local/README.md` defines per-clone additions.
- `tools/feedback-state.mjs` summarizes, filters, and checks feedback state.
