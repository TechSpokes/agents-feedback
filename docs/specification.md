# Agents Feedback Scaffold Specification

The agents feedback scaffold gives agents a dedicated repository-local folder for observations that can improve future work inside that repository. It is not long-term memory, not a task tracker, and not canonical project documentation.

## Purpose

The scaffold provides a small, copyable `.agents/feedback` protocol for recording sanitized agent feedback inside a repository. It helps future agents find known workflow friction, planned improvements, active fixes, review items, and completed efficiency improvements without creating a platform.

The repository maintains the installable scaffold under `scaffold/.agents/feedback`. Target repositories install that folder as `.agents/feedback`.

## Non-Goals

- The scaffold is not long-term memory.
- The scaffold is not a task tracker.
- The scaffold is not canonical project documentation.
- The scaffold is not a project changelog.
- The scaffold is not a replacement for tests, scripts, or repository instructions.
- The scaffold is not a place for secrets, credentials, raw private logs, customer data, or private tokens.
- The scaffold is not a service, database, or package-managed application.

## Installation Model

Hooked mode is the recommended installation mode. Copy `scaffold/.agents/feedback` into the target repository as `.agents/feedback`, add the root hook from `.agents/feedback/templates/root-agents-hook.md`, then replace `.agents/feedback/AGENTS.md` with `.agents/feedback/AGENTS.final.md`.

Manual mode is supported when users explicitly instruct agents to read `.agents/feedback/AGENTS.md`. Manual mode copies `.agents/feedback` without adding a root hook, so discovery is less reliable.

Installation is complete only after `.agents/feedback/AGENTS.md` has been replaced with `.agents/feedback/AGENTS.final.md` in the target repository. The installed scaffold must not require package installation, a database, or a background service.

## Lifecycle

Feedback records move through lifecycle folders:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

Lifecycle states have these meanings:

| State | Meaning |
| --- | --- |
| `new` | Untriaged observation. |
| `planned` | Action has been selected but work has not started. |
| `in_progress` | Improvement is being implemented. |
| `in_review` | Improvement exists and needs validation or owner review. |
| `completed` | Improvement has landed or the record has been resolved with evidence. |
| `archived` | Duplicate, obsolete, declined, transferred, or retained historical record. |

The `archived` state can be reached from any state. The `status` field inside each YAML record must match the folder that contains the file.

## Record Contract

Each feedback record is a YAML file under `.agents/feedback/records/<status>/`. The filename must start with the record `id`, such as `fb-20260709-0830-shell-startup-friction.yaml`.

Records must follow `schemas/record.schema.json` and use `schema_version: feedback-record.v1`. Required top-level fields are shown by the template:

```yaml
schema_version: feedback-record.v1
id: fb-YYYYMMDD-HHMM-short-slug
title: ""
status: new
created_at: "YYYY-MM-DDTHH:MM:SSZ"
updated_at: "YYYY-MM-DDTHH:MM:SSZ"
completed_at: null
area: ""
kind: friction
severity: low
summary: ""
evidence: ""
impact: ""
suggested_action: ""
decision: undecided
related_files: []
plan: null
sensitivity:
  sanitized: true
  notes: "No secrets, credentials, raw private logs, customer data, or private tokens."
```

Valid statuses are `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`. The `completed_at` field must be set when a record is completed and must be `null` until completion.

## Plan Contract

The `plan` field is optional and may be `null`. When present, it must follow `schemas/plan.schema.json`.

Plans describe the selected improvement action for a feedback record. A plan contains `objective`, `owner`, `steps`, and `outcome` fields.

```yaml
objective: ""
owner: agent
steps:
  - id: step-1
    title: ""
    status: planned
    validation: ""
outcome:
  status: pending
  notes: ""
```

Plan step statuses are `planned`, `in_progress`, `done`, and `skipped`. Outcome statuses are `pending`, `completed`, and `archived`.

## State Script Contract

The state script lives at `.agents/feedback/tools/feedback-state.mjs`. It must use Node.js 18 or newer built-ins only.

Supported flags are:

```text
--root <path>
--format text
--format json
--status <status>
--implemented
--stale-days <number>
--help
```

The default root is the parent folder of the script's `tools/` directory. The default format is `text`. The default stale window is `14` days.

`--format text` prints `Feedback State`, `Counts`, `Needs Attention`, `Records`, and `Completed` sections.

`--format json` prints one JSON object with `root`, `counts`, `needs_attention`, `records`, and `completed` properties.

`--status <status>` filters the `records` list only. Counts and needs-attention analysis still use all records.

`--implemented` aliases `--status completed` and is mutually exclusive with `--status`.

`--stale-days <number>` controls stale detection for `planned`, `in_progress`, and `in_review`.

The script exits `0` for successful analysis even when records need attention.

The script exits `1` for invalid CLI args, unreadable roots, or missing `records/`.

## Safety Rules

- Do not store secrets, credentials, raw tokens, customer data, private issue text, screenshots, or large logs in feedback records.
- Sanitize evidence before writing it to `.agents/feedback`.
- Keep feedback actionable and repository-specific.
- Promote durable rules to canonical repository instructions, docs, scripts, or tests before marking related feedback completed.
- Keep the installed scaffold portable and dependency-free.
- Do not add automatic root instruction mutation for v1.

## Release Criteria

- The installable scaffold exists under `scaffold/.agents/feedback`.
- Bootstrap and operational `AGENTS.md` instructions are present.
- Lifecycle folders exist for `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`.
- Record and plan templates exist.
- JSON schemas validate the record and plan contracts.
- The state script implements the documented CLI semantics.
- Tests cover text output, JSON output, status filtering, implemented filtering, stale detection, mismatches, missing fields, and invalid CLI arguments.
- CI runs the release checks.
- `docs/release-v1.md` lists included and not included items without becoming a changelog.
- Tag and push steps are documented as approval-gated and are not run without explicit maintainer approval.
