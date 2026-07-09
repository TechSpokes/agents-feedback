# Agents Feedback Scaffold Specification

The agents feedback scaffold gives agents a dedicated repository-local folder for observations that can improve future work inside that repository. It ships as an agent-assisted installer artifact, not as an application.

## Purpose

The scaffold provides a small `.agents/feedback` protocol for recording sanitized agent feedback inside a repository. It helps future agents find known workflow friction, planned improvements, active fixes, review items, and completed efficiency improvements without creating a platform.

The repository maintains the source scaffold under `scaffold/.agents/feedback`. Release artifacts package that source so extraction at a target repository root creates `.agents/feedback`.

## Agent-Assisted Installation Model

The only supported v1 installation model is agent-assisted installation. A user extracts the release artifact at the target repository root, confirms `.agents/feedback/AGENTS.md` exists, and instructs an agent to read that file. The bootstrap instructions then guide the agent through root hook wiring, verification, and conversion to operational mode.

Installation is complete only after the root instruction file contains the managed feedback hook, the state script exits successfully, and `.agents/feedback/AGENTS.md` has been replaced with `.agents/feedback/AGENTS.final.md`.

The installed scaffold must not require package installation, a database, or a background service. The installer may edit the target repository root instruction file because the user explicitly directed an agent to complete installation.

## Non-Goals

- The scaffold is not long-term memory.
- The scaffold is not a general task tracker.
- The scaffold is not canonical project documentation.
- The scaffold is not a project changelog.
- The scaffold is not a replacement for tests, scripts, or repository instructions.
- The scaffold is not a place for secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs.
- The scaffold is not a service, database, or package-managed application.

## Root Instruction Hook

The root hook must be managed and idempotent. Agents must preserve unrelated root instruction content and add or update only the block between `agents-feedback:start` and `agents-feedback:end`.

```markdown
<!-- agents-feedback:start -->
## Repository Feedback

For repository workflow feedback, read `.agents/feedback/AGENTS.md` before creating or updating feedback records. Use `.agents/feedback` for sanitized observations that could improve future agent work in this repository.
<!-- agents-feedback:end -->
```

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
description: ""
evidence: ""
impact: ""
suggested_actions: []
decision: undecided
related_files: []
plan: null
sensitivity:
  sanitized: true
  classification: public
  redaction_notes: ""
```

The `summary` field is a one-sentence scan line. The `description` field is the fuller explanation that gives future agents enough context to understand the observation.

The `suggested_actions` field is an array so a record can preserve multiple possible fixes before one is selected. Each action contains `id`, `title`, `rationale`, `effort`, and `risk`.

Valid statuses are `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`. The `completed_at` field must be set when a record is completed and must be `null` until completion.

Valid decisions are `undecided`, `accepted`, `declined`, `transferred`, `completed`, `duplicate`, `obsolete`, and `retained`. Use `duplicate`, `obsolete`, or `retained` for archived records when those values describe the outcome more accurately than `declined` or `transferred`.

The `sensitivity` block records the result of the sanitization check. Safety policy belongs in instructions and schema descriptions, not as copied boilerplate in every record.

## Plan Contract

The `plan` field is optional and may be `null`. When present, it must follow `schemas/plan.schema.json` and use `schema_version: feedback-plan.v1`.

Plans describe the selected improvement action and current progress for a feedback record. Plans should stay shallow: one or two task nesting levels are preferred, and larger work should move into normal repository planning docs.

```yaml
schema_version: feedback-plan.v1
objective: ""
owner: agent
status: planned
source_action_id: null
phases:
  - id: phase-1
    title: ""
    status: planned
    tasks:
      - id: task-1
        title: ""
        instructions: ""
        status: planned
        validation: ""
        evidence: ""
        tasks: []
outcome:
  status: pending
  notes: ""
```

Plan statuses are `planned`, `in_progress`, `in_review`, `completed`, and `archived`. Task statuses are `planned`, `in_progress`, `blocked`, `done`, and `skipped`. Outcome statuses are `pending`, `completed`, and `archived`.

## State Script Contract

The state script lives at `.agents/feedback/tools/feedback-state.mjs`. It must use Node.js built-ins only.

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

- Do not store secrets, credentials, raw tokens, customer data, private issue text, screenshots, large logs, or private logs in feedback records.
- Sanitize evidence before writing it to `.agents/feedback`.
- Keep feedback actionable and repository-specific.
- Promote durable rules to canonical repository instructions, docs, scripts, or tests before marking related feedback completed.
- Keep the installed scaffold portable and dependency-free.
- Do not add background services or automatic non-agent root instruction mutation for v1.

## Release Criteria

- The release artifact expands to `.agents/feedback`.
- Bootstrap `AGENTS.md` can guide an agent through installation without external instructions.
- Operational `AGENTS.final.md` instructions are present.
- `INSTALL.md` defines installation verification and conversion steps.
- The root hook template is managed and idempotent.
- Lifecycle folders exist for `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`.
- Record and plan templates exist.
- Record and plan schemas contain descriptions for every property.
- Templates explain field intent in comments without copying policy boilerplate into record values.
- The state script implements the documented CLI semantics.
- Repository release checks validate schemas, templates, fixtures, state output, and artifact layout.
- Tests cover text output, JSON output, status filtering, implemented filtering, stale detection, mismatches, missing fields, installer instructions, contract checks, and artifact layout.
- CI runs the release checks.
- Tag workflows create or update a draft GitHub Release with a zip artifact, checksum, and release body read from `docs/releases/<tag>.md`.
- Public repository support files exist for changelog, security policy, support routing, code of conduct, code ownership, issue intake, pull requests, and GitHub Actions dependency updates.
- `docs/releases/README.md` defines release note file requirements.
- `docs/releases/v1.0.0.md` defines the v1 release body without becoming a feedback record changelog.
- Tag and push steps are documented as approval-gated and are not run without explicit maintainer approval.
