# Agent Instructions for feedback - Operational Mode

## Summary

Use this folder to record sanitized agent observations that can improve future work in this repository. For routine feedback, the Summary and Must-follow rules are sufficient; read the full file before moving records between lifecycle folders or editing schemas, templates, or tools.

## Must-follow rules

- Record feedback only when the observation is actionable, repeated, surprising, or likely to improve future agent efficiency.
- Do not use this folder for normal task status, private scratch notes, project memory, or canonical documentation.
- Never include secrets, credentials, raw tokens, customer data, private issue text, screenshots, large logs, or raw private logs.
- Keep each record `status` field aligned with the folder containing the record.
- Promote durable rules to the repository's canonical instructions, docs, scripts, or tests before marking feedback completed.
- Keep plans shallow. Move large implementation plans into normal repository docs.

## Must-read documents

- `README.md` explains folder purpose and boundaries.
- `records/README.md` explains lifecycle folder meanings.
- `templates/record.yaml` provides the required record shape.
- `templates/plan.yaml` provides the optional plan section shape.

## Record Creation

Create records in `records/new/` from `templates/record.yaml`. Use an `id` and filename that start with `fb-YYYYMMDD-HHMM-short-slug`.

Use `summary` for a one-sentence scan line. Use `description` for the full context future agents need. Use `suggested_actions` for one or more possible fixes before a decision is selected.

Sanitize data before writing. Summarize evidence instead of pasting raw logs, private issue text, credentials, tokens, customer data, screenshots, machine-specific secrets, or large logs.

## Planning

Use `plan` only after a suggested action has been selected. A plan is both the selected implementation plan and a progress tracker for the feedback record.

Keep `phases` and nested `tasks` concise. If the work needs deep planning or multiple sessions, promote the durable plan to the repository's normal docs and link it from `related_files` or `evidence`.

## Lifecycle

Move records forward only when their state changes. Use `planned/` when an action is selected, `in_progress/` while implementing it, `in_review/` when validation or owner review is needed, and `completed/` when resolved with evidence.

Use `archived/` from any lifecycle state for duplicate, obsolete, declined, transferred, or intentionally retained records. Update the record `status`, `updated_at`, `decision`, and `plan` fields when moving a record.

Set `completed_at` only for completed records. Leave `completed_at` as `null` in all other lifecycle folders.

## Completion Rules

Before moving a record to `completed/`, promote any durable rule to the repository's canonical `AGENTS.md`, README, docs, scripts, or tests. The completed record should point to the durable location in `related_files` or `evidence`.

## Sensitivity

Set `sensitivity.sanitized` to `true` only after reviewing the record for restricted content. Use `sensitivity.classification` to describe the remaining sensitivity level and `sensitivity.redaction_notes` to summarize any redaction performed.

## References

- `tools/feedback-state.mjs` summarizes record counts, stale records, mismatches, and completed improvements when installed.
