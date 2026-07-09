# records

This folder contains YAML feedback records grouped by lifecycle status.

## Lifecycle Folders

- `new/` contains untriaged observations.
- `planned/` contains selected improvements with a proposed action.
- `in_progress/` contains improvements currently being implemented.
- `in_review/` contains improvements waiting for validation or owner review.
- `completed/` contains resolved feedback with completion evidence.
- `archived/` contains duplicates, declined records, obsolete records, transferred records, and retained history.

## Lifecycle Flow

Records usually move through `new`, `planned`, `in_progress`, `in_review`, and `completed`.

The `archived` state can be reached from any lifecycle state.

## Conventions

Each record filename must start with its `id`, such as `fb-20260709-0830-shell-startup-friction.yaml`.

The `status` field in each record must match the folder that contains it.
