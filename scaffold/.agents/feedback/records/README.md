# records

This folder contains shared YAML feedback records grouped by lifecycle.

## Lifecycle Folders

- `new/` contains untriaged observations.
- `planned/` contains accepted improvements whose work has not started.
- `in_progress/` contains accepted improvements being implemented.
- `in_review/` contains accepted improvements awaiting validation or owner review.
- `completed/` contains resolved feedback with completion evidence.
- `archived/` contains declined, duplicate, obsolete, transferred, or intentionally retained records.

## Lifecycle Flow

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

The containing folder is the lifecycle state. Records do not contain a `status` key.

## Before Creating

Inspect active shared and local records for the same observation. Update a match instead of creating a duplicate.

For a repeated observation, update `updated`, refine sanitized `evidence`, add affected `paths`, and set or increment `occurrences`.

## Record Shape

Use `../templates/record.yaml`. Initial capture requires identity, a scan line, a factual observation, repository scope, timestamps, and safety state. Add classification, analysis, actions, decisions, plans, links, and completion only when useful.

Use forward-slash repository-relative `paths`. Use `.` only for genuinely repository-wide feedback.

## Triage

A new record has no `decision`. Accepted records move through `planned`, `in_progress`, `in_review`, and `completed`. Archive decisions use `declined`, `duplicate`, `obsolete`, `transferred`, or `retained`.

Only a maintainer or explicitly delegated agent may triage unrelated shared feedback.

## Completion

Before completion, move durable knowledge into normal repository instructions, docs, scripts, tests, or code. The feedback record points to those durable locations and preserves sanitized evidence.
