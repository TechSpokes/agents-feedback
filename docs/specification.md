# Agents Feedback Scaffold Specification

## Purpose

The agents feedback scaffold is a repository-local learning loop for humans and coding agents. It helps future work consume relevant observations before repeating known workflow friction, capture new evidence, triage improvements, and promote durable knowledge into normal repository artifacts.

The repository maintains source under `scaffold/.agents/feedback`. Release artifacts package that source so fresh extraction at a target repository root creates `.agents/feedback`.

User installation and first-use guidance lives in `docs/getting-started.md`. This specification is the authoritative contract for implementers and maintainers.

## Product Boundaries

- The scaffold is not long-term memory.
- The scaffold is not a general task tracker.
- The scaffold is not canonical project documentation.
- The scaffold is not a project changelog.
- The scaffold is not a replacement for tests, scripts, issues, or repository instructions.
- The scaffold is not a service, database, or package-managed application.
- Shared and local feedback must not contain secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs.

## Installed Layout

```text
.agents/feedback/
  AGENTS.md
  AGENTS.final.md
  INSTALL.md
  UPGRADE.md
  README.md
  local/
    .gitignore
    README.md
  records/
    README.md
    new/
    planned/
    in_progress/
    in_review/
    completed/
    archived/
  schemas/
    record.schema.json
    plan.schema.json
  templates/
    record.yaml
    plan.yaml
    root-agents-hook.md
  tools/
    feedback-state.mjs
```

The artifact contains no user records or personal local content. Empty shared lifecycle folders are retained with placeholder files.

Every artifact entry begins with `.agents/feedback/`. Keeping the complete install path inside the ZIP makes the repository root the extraction target and prevents the artifact from owning sibling `.agents` content.

## Fresh Installation

Fresh installation is agent-assisted:

1. Download `agents-feedback-vX.Y.Z.zip`; do not treat the optional `.zip.sha256` checksum file as an installation archive.
2. Confirm `.agents/feedback` does not exist; a pre-existing `.agents` directory without `feedback` is allowed.
3. Extract the ZIP at the repository root and cancel if the extraction tool requests an overwrite.
4. Ask an agent to read `.agents/feedback/AGENTS.md`.
5. Add or update only the bounded root instruction hook.
6. Verify with Node.js 22 or newer when available.
7. Use the documented structural fallback when Node.js is unavailable or older.
8. Replace installer `AGENTS.md` with `AGENTS.final.md` only after verification succeeds.

Every artifact entry is under `.agents/feedback`. Fresh extraction therefore adds the `feedback` subtree without managing sibling content under an existing `.agents` directory.

Attention items reported by the state helper do not fail installation. Invalid arguments, an unreadable root, or a missing shared `records/` directory fail automated verification.

## Staged Upgrade

Never extract a new artifact directly over an existing `.agents/feedback`. Existing and uncertain installations use a temporary staging directory because instructions inside an artifact cannot protect records before direct extraction occurs.

The upgrading agent preserves all installed shared records, all personal local content, and unrelated root instructions. It replaces managed instructions, schemas, templates, helper code, `records/README.md`, `local/README.md`, and `local/.gitignore` from staging.

The agent records shared and local path sets before the upgrade and confirms that preserved paths remain afterward. Existing records are not rewritten automatically.

## Managed Root Hook

The root hook is bounded and idempotent. Agents preserve unrelated root instruction content and add or update only the block between `agents-feedback:start` and `agents-feedback:end`.

```markdown
<!-- agents-feedback:start -->
## Repository Feedback

Before substantial or unfamiliar work, read `.agents/feedback/AGENTS.md` and inspect relevant active feedback. Treat feedback as observations, not canonical instructions.

Read `.agents/feedback/AGENTS.md` before creating, moving, accepting, archiving, or completing feedback records.
<!-- agents-feedback:end -->
```

CLI details remain in the installed operational instructions so the root hook stays short.

## Shared and Local Scope

Shared records live under `records/<lifecycle>/` and are normally committed. They contain repository-relative paths and generalized environment context suitable for the repository's visibility.

Per-clone additions live under `local/`. The tracked `local/.gitignore` keeps personal additions ignored while retaining `local/.gitignore` and `local/README.md` in the artifact.

Optional `local/AGENTS.md` instructions are additive and lower priority than root repository instructions and shared scaffold rules. They cannot weaken safety, lifecycle, triage authority, or repository policy.

Optional local records use the same schema and lifecycle folders under `local/records/`. Local files remain secret-free despite being ignored.

Promotion from local to shared is explicit. The agent sanitizes and generalizes the content, removes machine identity and absolute paths, reviews safety, and creates or updates a matching shared record.

## Lifecycle

The containing folder is the only lifecycle state:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

| Folder | Meaning |
| --- | --- |
| `new` | Untriaged observation. |
| `planned` | Accepted improvement whose work has not started. |
| `in_progress` | Accepted improvement being implemented. |
| `in_review` | Accepted improvement awaiting validation or owner review. |
| `completed` | Resolved feedback with completion evidence. |
| `archived` | Declined, duplicate, obsolete, transferred, or retained history. |

Records do not contain a lifecycle status field.

## Record Contract

`schemas/record.schema.json` is the sole record schema. Every record uses `schema: feedback-record.v1`.

The filename starts with the record ID. IDs use UTC date and time including seconds:

```text
fb-YYYYMMDD-HHMMSS-short-slug
```

### Required Capture Fields

```yaml
schema: feedback-record.v1
id: fb-20000101-000000-short-slug
summary: "Describe the feedback in one sentence."
observation: "Describe what happened without assuming the cause."
paths:
  - .
created: "2000-01-01T00:00:00Z"
updated: "2000-01-01T00:00:00Z"
safety: unreviewed
```

`summary` is a one-sentence scan line with a maximum length of 180 characters. `observation` states what happened without assuming the cause.

`paths` contains one or more repository-relative files or directories. Stored paths use forward slashes on every platform. Absolute paths, parent traversal, and backslashes are invalid. A single dot represents genuinely repository-wide feedback.

`created` and `updated` are UTC timestamps. `safety` is `unreviewed`, `public`, or `internal`.

### Optional Classification and Evidence

`area` is a stable lowercase repository area used for exact filtering. `kind` is `unknown`, `instruction`, `setup`, `tooling`, `workflow`, `verification`, `documentation`, `environment`, or `other`.

`severity` is `unknown`, `low`, `medium`, or `high`. Missing classification normalizes to `unknown` during discovery. Records should be classified after the `new` lifecycle.

`evidence` contains sanitized support for the observation. `impact` describes the effect on efficiency, correctness, safety, setup, or verification.

`occurrences` is omitted for the first observation. Set it to `2` or more after materially separate confirmations.

### Environment Context

`environment` may include generalized `os`, `shell`, `architecture`, and tool version values. It never includes usernames, hostnames, device identifiers, credentials, or absolute paths.

### Analysis

`hypothesis` contains a possible cause and must appear with `confidence`. Confidence is `low`, `medium`, or `high` and applies to the hypothesis rather than the observed event.

`reproduction` contains minimal secret-free verification steps.

### Candidate Actions

```yaml
actions:
  - id: action-1
    action: "Document the required working directory."
    reason: "The setup command becomes reproducible."
    effort: low
    risk: low
```

Effort and risk use `unknown`, `low`, `medium`, or `high`. Action identifiers must be unique within a record.

### Decision

New records omit `decision`. A decision contains `status`, `reviewer`, and `reason`.

Allowed decision outcomes are `accepted`, `declined`, `duplicate`, `obsolete`, `transferred`, and `retained`. Accepted decisions require candidate actions and select one action ID. Other outcomes do not contain a selected action.

Duplicate and transferred decisions require `links` to the canonical record or external destination.

Only a maintainer or an agent explicitly delegated by the current task or repository policy may triage unrelated shared feedback.

### Safety

Drafts start with `safety: unreviewed`. Shared records must be reviewed before commit, handoff, acceptance, or completion.

Public repositories commit only `safety: public` records. `internal` is allowed only when repository visibility and policy explicitly permit internal material.

`redactions` contains short descriptions of removed or generalized content. It never repeats restricted source material.

## Folder Invariants

| Folder | Required decision | Completion |
| --- | --- | --- |
| `new` | No decision | No completion timestamp |
| `planned` | Accepted | No completion timestamp |
| `in_progress` | Accepted | No completion timestamp |
| `in_review` | Accepted | No completion timestamp |
| `completed` | Accepted | Reviewed safety and completion timestamp required |
| `archived` | Archival outcome | No completion timestamp |

The state helper checks folder-dependent rules that JSON Schema cannot infer from a file's location.

## Plan Contract

`schemas/plan.schema.json` is the sole plan schema. Plans use `schema: feedback-plan.v1`.

```yaml
schema: feedback-plan.v1
owner: agent
tasks:
  - id: task-1
    task: "Update the setup guide."
    status: planned
    validation: "Run the documented setup from a clean checkout."
```

Owner is `agent`, `human`, or `mixed`. Task status is `planned`, `active`, `blocked`, `done`, or `skipped`. Task evidence and a plan outcome are optional.

Tasks are flat. One to seven tasks is preferred guidance, not a validity limit. Work requiring broad coordination, several sessions, or architecture decisions belongs in normal repository planning and is referenced through record links.

## Duplicate Handling

Before creating a record, agents inspect active shared and local feedback for the same observation.

When a match exists, update `updated`, refine sanitized `evidence`, add new affected paths, set or increment `occurrences`, and adjust classification only when justified. Do not create another record.

If a duplicate record exists, archive it with `decision.status: duplicate` and link to the canonical record.

## Completion

Before moving a record to `completed`, promote durable knowledge into normal repository instructions, docs, scripts, tests, or code. Add durable paths and useful links, finish the inline plan or external work, include sanitized evidence, set `completed`, and move the file.

Completed records are the learning trail. They are not the durable rule itself.

## State Helper

The installed `tools/feedback-state.mjs` uses Node.js built-ins only and supports Node.js 22 or newer.

### Options

```text
--root PATH
--format text|json
--status STATUS
--implemented
--stale-days DAYS
--active
--brief
--area AREA
--path PATH
--shared-only
--help
```

The default root is the parent of the script's `tools/` directory. The default format is text. The default stale window is 14 days.

`--active` selects `new`, `planned`, `in_progress`, and `in_review`. It conflicts with `--status` and `--implemented`.

`--implemented` aliases `--status completed`. `--area` and `--path` combine with AND semantics.

Path matching normalizes filter separators and supports exact, ancestor, and descendant matches on segment boundaries. A stored dot matches every requested repository path. Substring-only matches are invalid.

The helper scans shared and local records by default. `--shared-only` excludes local records.

### Output

Default text output contains `Feedback State`, `Counts`, `Scope Counts`, `Needs Attention`, `Records`, and `Completed` sections.

Default JSON contains `root`, aggregate `counts`, `scope_counts`, `needs_attention`, normalized `records`, and normalized `completed` records.

Brief text begins with `Feedback` and lists normalized records with scope, lifecycle, ID, area, severity, summary, and source path. Brief JSON contains `root` and sorted normalized records.

Brief sorting uses severity, updated time descending, ID, and scope.

### Bounded Parser

The helper is not a general YAML parser. It reads state-relevant top-level scalars, path and link string arrays, nested decision fields, action identifiers, and inline plan task statuses.

Multiline analysis bodies that do not affect discovery may be ignored. Complete instance validation belongs to repository checks using YAML and Ajv.

### Attention

Attention includes missing capture fields, duplicate IDs, invalid schema identifiers, unsafe paths, unreviewed safety, invalid hypothesis pairs, stale active records, folder and decision violations, missing action references, duplicate action IDs, missing duplicate links, missing accepted evidence, unknown classification after `new`, invalid completion placement, and unfinished inline plans on completed records.

Attention remains informational. Successful analysis exits `0` even when attention exists. Invalid CLI arguments, unreadable roots, and missing shared records directories exit `1`.

## Repository Validation

Repository checks use Node.js 24 with pinned repository-only Ajv, Ajv formats, and YAML development dependencies.

Validation covers complete valid and invalid YAML fixtures, schema descriptions, concise templates, shared and local state behavior, installer and upgrade instructions, local Git ignore behavior, release notes, artifact allowlists, reproducible ZIP hashes, checksums, and manifest contents.

The installed artifact excludes repository dependencies and validation tooling.

## Release Artifact

`npm run artifact:build` creates:

```text
dist/agents-feedback-vX.Y.Z.zip
dist/agents-feedback-vX.Y.Z.zip.sha256
dist/artifact-manifest.json
```

The ZIP is the user installation download. The `.zip.sha256` file is optional checksum metadata used to verify the ZIP and is never extracted. The manifest is repository release evidence and is not a user installation asset.

The ZIP uses fixed metadata and ordinal entry ordering so identical source produces identical hashes. The manifest file list matches ZIP entries.

The artifact contains `.agents/feedback` at its root. It excludes `package.json`, `node_modules`, test fixtures, shared feedback YAML, and personal local content.

## Release Criteria

- The README links to the latest release and presents product value, three-step installation, and first use before repository maintenance.
- The getting-started guide keeps fresh installation, staged upgrade, collaboration, and troubleshooting easy to find.
- The package version and release note tag match.
- Fresh extraction creates `.agents/feedback`.
- Fresh installer instructions support Node.js and manual verification.
- Upgrade instructions require temporary staging and preservation.
- The root hook is bounded and idempotent.
- Shared and local scopes are distinct and tested.
- Record and plan schemas are the sole v1 contracts.
- Templates expose the required capture shape.
- The state helper implements documented discovery and attention behavior.
- Complete contract, state, installer, release-note, and artifact tests pass.
- Two artifact builds produce the same SHA-256 hash.
- ZIP entries match the artifact manifest.
- CI runs `npm run release:check` for pull requests and direct pushes to `main`, without duplicating validation for pull request branch pushes or release tags.
- CI and release workflows cancel superseded in-progress runs for the same pull request, branch, or release tag.
- Tag workflows create or update a draft GitHub Release with the ZIP and checksum.
- Tagging, pushing, drafting, and publication remain maintainer-approved actions.
