# Agents Feedback v1 Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize `agents-feedback` as a GitHub-maintained repository that ships a small, portable `.agents/feedback` scaffold for repository-local agent efficiency feedback.

**Architecture:** The repository maintains an installable scaffold under `scaffold/.agents/feedback`. Target projects copy that folder into `.agents/feedback`, wire one small instruction hook into the target repository's agent instruction surface, then switch `.agents/feedback/AGENTS.md` from bootstrap mode to operational mode by replacing it with `AGENTS.final.md`. Feedback records are YAML files in lifecycle folders; IDE validation comes from JSON schemas; current state comes from one dependency-free Node.js script.

**Tech Stack:** Markdown, YAML, JSON Schema draft-07, Node.js 18+ built-ins, Node test runner, GitHub Actions.

---

## Source Context

This plan uses the local AGENTS.md and README.md specifications as input. The AGENTS.md specification requires folder-scoped operational guidance, closest-file-wins behavior, high-value summaries near the top, flat lists, explicit required reading, and a target file length under 100 lines when practical. The README.md specification requires a root project README with an immediate purpose description, a usage path, license indication, and folder READMEs when directory conventions need explanation.

The `agents-feedback` repository is currently almost empty. It contains `.gitignore`, `LICENSE`, `.git/`, and untracked `.idea/` files. The existing MIT license names TechSpokes, Inc. and should remain the release license unless the maintainer changes it.

The v1 design must not create a project changelog. Implemented feedback items are reported by the feedback state script from completed records.

## Product Scope

The scaffold is not long-term memory and not an issue tracker. It is a repository-local place for agents to record specific friction, missing instructions, workflow inefficiencies, tool problems, and machine-specific setup details that can improve future agent work in that repository.

The scaffold must help agents answer these questions quickly:

- What friction has been noticed in this repository?
- Which feedback items need triage?
- Which feedback items have a plan?
- Which items are being worked on or reviewed?
- Which improvements were completed, when, and with what evidence?

The scaffold must stay small enough to copy into any repository without creating a platform. It must work without package installation in the target repository.

## File Structure

Create this repository structure by the end of v1:

```text
agents-feedback/
  .github/
    workflows/
      ci.yml
  docs/
    plans/
      agents-feedback-v1-initialization/
        agents-feedback-v1-initialization.plan.md
    specification.md
  scaffold/
    .agents/
      feedback/
        AGENTS.md
        AGENTS.final.md
        README.md
        records/
          README.md
          archived/
            .gitkeep
          completed/
            .gitkeep
          in_progress/
            .gitkeep
          in_review/
            .gitkeep
          new/
            .gitkeep
          planned/
            .gitkeep
        schemas/
          plan.schema.json
          record.schema.json
        templates/
          plan.yaml
          record.yaml
          root-agents-hook.md
        tools/
          feedback-state.mjs
  tests/
    feedback-state.test.mjs
    fixtures/
      valid-feedback/
        records/
          archived/
            fb-20260709-0915-archived-example.yaml
          completed/
            fb-20260709-0900-completed-example.yaml
          in_progress/
            fb-20260709-0830-active-example.yaml
          in_review/
            fb-20260709-0845-review-example.yaml
          new/
            fb-20260709-0800-new-example.yaml
          planned/
            fb-20260709-0815-planned-example.yaml
      invalid-feedback/
        records/
          new/
            fb-20260709-1000-folder-mismatch.yaml
            fb-20260709-1015-missing-title.yaml
  .gitignore
  AGENTS.md
  CONTRIBUTING.md
  LICENSE
  README.md
  package.json
```

## Lifecycle Contract

Feedback records move through these folders:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

Use `new` for untriaged observations. Use `planned` when the repository owner or agent has selected an action but has not started work. Use `in_progress` while the improvement is being implemented. Use `in_review` when the improvement exists but needs validation or owner review. Use `completed` when the improvement has landed or the record has been resolved with evidence. Use `archived` from any lifecycle state when the record is duplicate, obsolete, declined, transferred elsewhere, or intentionally retained without action.

The `status` field inside each YAML record must match the folder that contains the file.

## Implementation Strategy

Execute this plan on a feature branch or linked worktree, not directly on `main`. The implementation can be split into three disjoint subagent-owned slices: repository documentation, installable scaffold content, and state script with tests and CI.

Do not tag, push, publish, or merge as part of routine implementation. The v1 release is ready when the branch contains the scaffold, documentation, tests, CI, and release notes with `npm run release:check` passing. Tagging and pushing `v1.0.0` require an explicit release approval after verification.

## Subagent Work Boundaries

Use these write boundaries when delegating implementation:

- Repository documentation worker: `.gitignore`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `docs/specification.md`, and `docs/release-v1.md`.
- Scaffold worker: `scaffold/.agents/feedback/AGENTS.md`, `AGENTS.final.md`, `README.md`, `records/`, `templates/`, and `schemas/`.
- Tooling worker: `scaffold/.agents/feedback/tools/feedback-state.mjs`, `tests/`, `package.json`, and `.github/workflows/ci.yml`.

Each worker must avoid changing files outside its ownership boundary unless the controller explicitly reassigns that file.

## Task 1: Repository Hygiene And Public Documentation

**Files:**

- Modify: `.gitignore`
- Create: `AGENTS.md`
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `docs/specification.md`

- [ ] **Step 1: Add local IDE files to `.gitignore`**

Append this section to `.gitignore` so the current PhpStorm metadata remains local:

```gitignore

# JetBrains IDE metadata
.idea/
```

- [ ] **Step 2: Create root `AGENTS.md` for this repository**

Create `AGENTS.md` using the AGENTS.md specification structure. Keep it focused on maintaining the scaffold, not using an installed scaffold.

```markdown
# Agent Instructions for agents-feedback - Scaffold Maintenance

## Summary

This repository maintains a portable `.agents/feedback` scaffold for other repositories. Read the full file before changing scaffold files, schemas, templates, or the state script.

## Must-follow rules

- Keep the installed scaffold dependency-free.
- Keep target-repository setup limited to copying `.agents/feedback` and adding one instruction hook.
- Do not add a changelog for implemented feedback records.
- Do not store secrets, credentials, raw private logs, or customer data in examples or fixtures.
- Keep scaffold instructions short enough for agents to read completely.

## Must-read documents

- `README.md` - project purpose, installation model, and release scope.
- `docs/specification.md` - scaffold contract and lifecycle rules.
- `scaffold/.agents/feedback/README.md` - installed folder behavior.

## Agent guidelines

Prefer small changes that preserve portability. If a proposed feature requires dependencies, background services, databases, or a target-repository package install, reject it for v1 or document it as a future extension.

## Context

The project exists because many repositories lack a durable place for agents to record workflow friction that should improve future agent sessions. The scaffold is intentionally a folder-based protocol rather than an application.

## References

- `scaffold/.agents/feedback/AGENTS.final.md` - operational instructions used after installation.
```

- [ ] **Step 3: Create root `README.md`**

Create `README.md` with a project description, a quick start, the install model, and license indication.

````markdown
# agents-feedback

`agents-feedback` ships a small `.agents/feedback` scaffold that gives coding agents a repository-local place to record workflow friction, missing instructions, setup problems, and completed efficiency improvements.

## Purpose

The scaffold is for observations that would make future agent sessions in the same repository faster or safer. It is not a task tracker, project changelog, private scratchpad, or replacement for canonical documentation.

## Quick Start

Copy `scaffold/.agents/feedback` into a target repository as `.agents/feedback`. Add the root instruction hook from `scaffold/.agents/feedback/templates/root-agents-hook.md` to the target repository's root `AGENTS.md` or equivalent agent instruction file.

After the hook is in place, replace `.agents/feedback/AGENTS.md` in the target repository with `.agents/feedback/AGENTS.final.md`.

## Repository Contents

- `scaffold/.agents/feedback/` - installable feedback scaffold.
- `docs/specification.md` - lifecycle, file, and portability contract.
- `tests/` - fixtures and tests for the state script.

## Requirements

The installed scaffold has no package dependencies. The optional state script requires Node.js 18 or newer.

## Verification

Run the repository checks before release:

```bash
npm test
npm run check:state
```

On Windows PowerShell, use `npm.cmd` if the local execution policy blocks `npm.ps1`.

## License

MIT License. See `LICENSE` for details.
````

- [ ] **Step 4: Create `CONTRIBUTING.md`**

Create contributor guidance that keeps scope tight.

````markdown
# Contributing

This repository accepts improvements to the `.agents/feedback` scaffold, schemas, templates, state script, tests, and documentation.

## Scope

Changes must preserve the v1 portability contract. The installed scaffold must work after copying files into a target repository, without requiring package installation, a database, or a background service.

## Development

Install repository development dependencies if they are added later. For v1, the test suite uses Node.js built-ins.

```bash
npm test
npm run check:state
```

## Pull Request Checklist

- The installed scaffold remains dependency-free.
- `npm test` passes.
- `npm run check:state` passes.
- Documentation describes any user-visible behavior changes.
- Examples do not contain secrets, credentials, private logs, or customer data.
````

- [ ] **Step 5: Create `docs/specification.md`**

Create the repository specification with these sections: Purpose, Non-Goals, Installation Model, Lifecycle, Record Contract, Plan Contract, State Script Contract, Safety Rules, and Release Criteria. The specification must define the same lifecycle, statuses, safety rules, schema paths, and script semantics used by the scaffold.

The Purpose section must state that this is not memory. Use this exact paragraph as the opening:

```markdown
# Agents Feedback Scaffold Specification

The agents feedback scaffold gives agents a dedicated repository-local folder for observations that can improve future work inside that repository. It is not long-term memory, not a task tracker, and not canonical project documentation.
```

The State Script Contract section must state these semantics:

- `--format text` prints `Feedback State`, `Counts`, `Needs Attention`, `Records`, and `Completed` sections.
- `--format json` prints one JSON object with `root`, `counts`, `needs_attention`, `records`, and `completed` properties.
- `--status <status>` filters the `records` list only; counts and needs-attention analysis still use all records.
- `--implemented` is an alias for `--status completed` and is mutually exclusive with `--status`.
- `--stale-days <number>` controls stale detection for `planned`, `in_progress`, and `in_review`.
- The script exits `0` for successful analysis even when records need attention.
- The script exits `1` for invalid CLI arguments, unreadable roots, or missing `records/`.

- [ ] **Step 6: Verify repository status**

Run:

```bash
git status --short
```

Expected: new documentation files are listed, `.idea/` is no longer listed after `.gitignore` is updated.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add .gitignore AGENTS.md README.md CONTRIBUTING.md docs/specification.md
git commit -m "docs: define agents feedback repository"
```

Expected: commit succeeds.

## Task 2: Installable Scaffold Skeleton

**Files:**

- Create: `scaffold/.agents/feedback/README.md`
- Create: `scaffold/.agents/feedback/records/README.md`
- Create: `scaffold/.agents/feedback/records/new/.gitkeep`
- Create: `scaffold/.agents/feedback/records/planned/.gitkeep`
- Create: `scaffold/.agents/feedback/records/in_progress/.gitkeep`
- Create: `scaffold/.agents/feedback/records/in_review/.gitkeep`
- Create: `scaffold/.agents/feedback/records/completed/.gitkeep`
- Create: `scaffold/.agents/feedback/records/archived/.gitkeep`
- Create: `scaffold/.agents/feedback/templates/root-agents-hook.md`

- [ ] **Step 1: Create scaffold directories**

Create the scaffold directories exactly as defined in the File Structure section.

- [ ] **Step 2: Create installed folder `README.md`**

Create `scaffold/.agents/feedback/README.md`.

```markdown
# feedback

This folder stores repository-local agent feedback records that identify friction, missing instructions, tooling problems, and completed improvements for future agent sessions.

## Contents

- `AGENTS.md` - folder-scoped agent instructions.
- `AGENTS.final.md` - operational instructions copied over `AGENTS.md` after installation wiring is complete.
- `records/` - lifecycle folders containing YAML feedback records.
- `schemas/` - JSON schemas for IDE validation.
- `templates/` - YAML templates and installation snippets.
- `tools/` - portable helper scripts.

## Purpose

Use this folder when an agent notices something that would make future work in this repository more efficient, less error-prone, or easier to verify.

## Not Here

Do not store secrets, credentials, raw private logs, screenshots, generated artifacts, or general task notes here. Promote durable rules to the repository's canonical `AGENTS.md`, `README.md`, docs, scripts, or tests.
```

- [ ] **Step 3: Create records `README.md`**

Create `scaffold/.agents/feedback/records/README.md`.

```markdown
# records

This folder contains YAML feedback records grouped by lifecycle status.

## Contents

- `new/` - untriaged observations.
- `planned/` - selected improvements with a proposed action.
- `in_progress/` - improvements currently being implemented.
- `in_review/` - improvements waiting for validation or owner review.
- `completed/` - resolved feedback with completion evidence.
- `archived/` - duplicates, declined records, transferred records, and retained history.

## Conventions

Each record filename must start with its `id`, such as `fb-20260709-0830-shell-startup-friction.yaml`. The `status` field in the record must match the folder that contains it.
```

- [ ] **Step 4: Create root hook template**

Create `scaffold/.agents/feedback/templates/root-agents-hook.md`.

````markdown
# Root AGENTS.md Hook

Add this short section to the target repository's root `AGENTS.md` or equivalent agent instruction surface.

```markdown
## Repository Feedback

For repository workflow feedback, read `.agents/feedback/AGENTS.md` and use that folder to record sanitized observations that could improve future agent work in this repository.
```
````

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add scaffold/.agents/feedback/README.md scaffold/.agents/feedback/records scaffold/.agents/feedback/templates/root-agents-hook.md
git commit -m "feat: add feedback scaffold skeleton"
```

Expected: commit succeeds.

## Task 3: Bootstrap And Operational Agent Instructions

**Files:**

- Create: `scaffold/.agents/feedback/AGENTS.md`
- Create: `scaffold/.agents/feedback/AGENTS.final.md`

- [ ] **Step 1: Create bootstrap `AGENTS.md`**

Create `scaffold/.agents/feedback/AGENTS.md`. This file is used only during installation.

```markdown
# Agent Instructions for feedback - Bootstrap Mode

## Summary

This folder has not been fully wired into the target repository yet. Read the full file, add the root instruction hook, then replace this file with `AGENTS.final.md`.

## Must-follow rules

- Do not create feedback records until installation wiring is complete.
- Add the hook from `templates/root-agents-hook.md` to the target repository's root `AGENTS.md` or equivalent agent instruction surface.
- Preserve any existing target repository instructions when adding the hook.
- Replace this file with `AGENTS.final.md` only after the hook is present.
- Do not include secrets, credentials, raw private logs, or customer data in feedback records.

## Must-read documents

- `README.md` - installed folder purpose and boundaries.
- `templates/root-agents-hook.md` - root instruction hook to add in the target repository.
- `AGENTS.final.md` - operational instructions that replace this bootstrap file.

## Agent guidelines

Prefer the smallest reliable hook. If the target repository already has root `AGENTS.md`, add a short section there. If it does not, ask before creating a root instruction file unless the user explicitly requested automatic installation.

## Context

Agents usually discover instructions from their current working directory. A folder under `.agents/feedback` is clean, but it is not reliably discoverable from unrelated paths unless the target repository points agents to it.
```

- [ ] **Step 2: Create operational `AGENTS.final.md`**

Create `scaffold/.agents/feedback/AGENTS.final.md`.

```markdown
# Agent Instructions for feedback - Operational Mode

## Summary

Use this folder to record sanitized agent observations that can improve future work in this repository. For routine feedback, Summary and Must-follow rules are sufficient; read the full file before moving records between lifecycle folders or editing schemas, templates, or tools.

## Must-follow rules

- Record feedback only when the observation is actionable, repeated, surprising, or likely to improve future agent efficiency.
- Do not use this folder for normal task status, private scratch notes, project memory, or canonical documentation.
- Never include secrets, credentials, raw tokens, customer data, private issue text, or large logs.
- Keep the record `status` field aligned with the folder containing the record.
- Promote durable rules to the repository's canonical instructions, docs, scripts, or tests before marking feedback completed.

## Must-read documents

- `README.md` - folder purpose and boundaries.
- `records/README.md` - lifecycle folder meanings.
- `templates/record.yaml` - required record shape.
- `templates/plan.yaml` - optional plan section shape.

## Agent guidelines

Create records in `records/new/` from `templates/record.yaml`. Move records forward only when their state changes. Use `completed/` for resolved items with evidence, and use `archived/` for duplicates, declined items, obsolete items, or records transferred elsewhere.

## Context

The folder exists because agents often rediscover the same repository-specific friction. A small, structured feedback folder lets future agents see what has been noticed, what is being addressed, and what improvements already landed without turning the repository into a separate issue tracker.

## References

- `tools/feedback-state.mjs` - summarizes record counts, stale records, mismatches, and completed improvements.
```

- [ ] **Step 3: Verify instruction length**

Run:

```bash
node -e "const fs=require('node:fs'); for (const f of ['scaffold/.agents/feedback/AGENTS.md','scaffold/.agents/feedback/AGENTS.final.md']) { const lines=fs.readFileSync(f,'utf8').trimEnd().split(/\\r?\\n/).length; console.log(f, lines); if (lines > 100) process.exitCode = 1; }"
```

Expected: both files report 100 lines or fewer and exit code is 0.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add scaffold/.agents/feedback/AGENTS.md scaffold/.agents/feedback/AGENTS.final.md
git commit -m "feat: add feedback agent instructions"
```

Expected: commit succeeds.

## Task 4: YAML Templates And JSON Schemas

**Files:**

- Create: `scaffold/.agents/feedback/templates/record.yaml`
- Create: `scaffold/.agents/feedback/templates/plan.yaml`
- Create: `scaffold/.agents/feedback/schemas/record.schema.json`
- Create: `scaffold/.agents/feedback/schemas/plan.schema.json`

- [ ] **Step 1: Create record template**

Create `scaffold/.agents/feedback/templates/record.yaml`.

```yaml
# yaml-language-server: $schema=../../schemas/record.schema.json
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

The schema path is intentionally correct for the copied record location under `records/<status>/`. It is not intended to validate the template in place under `templates/`.

- [ ] **Step 2: Create plan template**

Create `scaffold/.agents/feedback/templates/plan.yaml`. This is an optional `plan` value that can be copied into a record when planning is useful.

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

- [ ] **Step 3: Create `plan.schema.json`**

Create `scaffold/.agents/feedback/schemas/plan.schema.json`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://techspokes.local/agents-feedback/plan.schema.json",
  "title": "Agents Feedback Plan",
  "type": "object",
  "additionalProperties": false,
  "required": ["objective", "owner", "steps", "outcome"],
  "properties": {
    "objective": { "type": "string", "minLength": 1 },
    "owner": { "type": "string", "enum": ["agent", "human", "mixed"] },
    "steps": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "title", "status", "validation"],
        "properties": {
          "id": { "type": "string", "pattern": "^step-[0-9]+$" },
          "title": { "type": "string", "minLength": 1 },
          "status": { "type": "string", "enum": ["planned", "in_progress", "done", "skipped"] },
          "validation": { "type": "string", "minLength": 1 }
        }
      }
    },
    "outcome": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "notes"],
      "properties": {
        "status": { "type": "string", "enum": ["pending", "completed", "archived"] },
        "notes": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 4: Create `record.schema.json`**

Create `scaffold/.agents/feedback/schemas/record.schema.json`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://techspokes.local/agents-feedback/record.schema.json",
  "title": "Agents Feedback Record",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "id",
    "title",
    "status",
    "created_at",
    "updated_at",
    "completed_at",
    "area",
    "kind",
    "severity",
    "summary",
    "evidence",
    "impact",
    "suggested_action",
    "decision",
    "related_files",
    "plan",
    "sensitivity"
  ],
  "properties": {
    "schema_version": { "type": "string", "const": "feedback-record.v1" },
    "id": { "type": "string", "pattern": "^fb-[0-9]{8}-[0-9]{4}-[a-z0-9][a-z0-9-]*$" },
    "title": { "type": "string", "minLength": 1 },
    "status": { "type": "string", "enum": ["new", "planned", "in_progress", "in_review", "completed", "archived"] },
    "created_at": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$" },
    "updated_at": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$" },
    "completed_at": {
      "anyOf": [
        { "type": "null" },
        { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$" }
      ]
    },
    "area": { "type": "string", "minLength": 1 },
    "kind": { "type": "string", "enum": ["friction", "missing_instruction", "tooling", "setup", "verification", "documentation", "machine_specific", "other"] },
    "severity": { "type": "string", "enum": ["low", "medium", "high"] },
    "summary": { "type": "string", "minLength": 1 },
    "evidence": { "type": "string", "minLength": 1 },
    "impact": { "type": "string", "minLength": 1 },
    "suggested_action": { "type": "string", "minLength": 1 },
    "decision": { "type": "string", "enum": ["undecided", "accepted", "declined", "transferred", "completed"] },
    "related_files": { "type": "array", "items": { "type": "string" } },
    "plan": {
      "anyOf": [
        { "type": "null" },
        { "$ref": "plan.schema.json" }
      ]
    },
    "sensitivity": {
      "type": "object",
      "additionalProperties": false,
      "required": ["sanitized", "notes"],
      "properties": {
        "sanitized": { "type": "boolean", "const": true },
        "notes": { "type": "string", "minLength": 1 }
      }
    }
  }
}
```

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add scaffold/.agents/feedback/templates scaffold/.agents/feedback/schemas
git commit -m "feat: add feedback templates and schemas"
```

Expected: commit succeeds.

## Task 5: Dependency-Free Feedback State Script

**Files:**

- Create: `scaffold/.agents/feedback/tools/feedback-state.mjs`

- [ ] **Step 1: Implement CLI argument parsing**

Create `feedback-state.mjs` with support for these flags:

```text
--root <path>
--format text
--format json
--status <status>
--implemented
--stale-days <number>
--help
```

Default `--root` is the parent folder of the script's `tools/` directory. Default `--format` is `text`. Default `--stale-days` is `14`. The `--status` value must be one of `new`, `planned`, `in_progress`, `in_review`, `completed`, or `archived`. The `--implemented` flag is an alias for `--status completed` and must not be combined with `--status`.

- [ ] **Step 2: Implement record discovery**

Discover YAML files under `records/new`, `records/planned`, `records/in_progress`, `records/in_review`, `records/completed`, and `records/archived`.

Use only Node.js built-ins:

```javascript
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
```

- [ ] **Step 3: Implement simple YAML field extraction**

Do not implement a full YAML parser. Extract only top-level scalar fields needed by the state report: `id`, `title`, `status`, `created_at`, `updated_at`, `completed_at`, `area`, `kind`, `severity`, and `decision`.

Use this behavior:

```javascript
function extractTopLevelScalars(source) {
  const record = {};
  for (const line of source.split(/\r?\n/u)) {
    const match = /^(schema_version|id|title|status|created_at|updated_at|completed_at|area|kind|severity|decision):\s*(.*)$/u.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    const trimmed = rawValue.trim();
    record[key] = trimmed === "null" ? null : trimmed.replace(/^"|"$/gu, "");
  }
  return record;
}
```

- [ ] **Step 4: Implement state analysis**

The script must compute:

- Count by lifecycle folder.
- Records where `status` does not match the folder name.
- Records missing `id`, `title`, or `status`.
- Stale records in `planned`, `in_progress`, and `in_review` where `updated_at` is older than `--stale-days`.
- Completed records sorted by `completed_at`, then `updated_at`.
- A `records` list filtered by `--status` or `--implemented` when either flag is present. Without either flag, include all records in lifecycle order.

- [ ] **Step 5: Implement text output**

Text output must include these sections when relevant:

```text
Feedback State
Counts
Needs Attention
Records
Completed
```

If there are no mismatches, missing fields, or stale records, print:

```text
Needs Attention
- None
```

- [ ] **Step 6: Implement JSON output**

JSON output must include this shape:

```json
{
  "root": "scaffold/.agents/feedback",
  "counts": {
    "new": 0,
    "planned": 0,
    "in_progress": 0,
    "in_review": 0,
    "completed": 0,
    "archived": 0
  },
  "needs_attention": [],
  "records": [],
  "completed": []
}
```

- [ ] **Step 7: Implement exit codes**

Use exit code `0` when the script can read the folder, even if it finds feedback needing attention. Use exit code `1` only for invalid CLI arguments, unreadable root, or missing `records/` folder.

- [ ] **Step 8: Commit Task 5**

Run:

```bash
git add scaffold/.agents/feedback/tools/feedback-state.mjs
git commit -m "feat: add feedback state script"
```

Expected: commit succeeds.

## Task 6: Tests And Fixtures

**Files:**

- Create: `tests/feedback-state.test.mjs`
- Create: `tests/fixtures/valid-feedback/records/new/fb-20260709-0800-new-example.yaml`
- Create: `tests/fixtures/valid-feedback/records/planned/fb-20260709-0815-planned-example.yaml`
- Create: `tests/fixtures/valid-feedback/records/in_progress/fb-20260709-0830-active-example.yaml`
- Create: `tests/fixtures/valid-feedback/records/completed/fb-20260709-0900-completed-example.yaml`
- Create: `tests/fixtures/invalid-feedback/records/new/fb-20260709-1000-folder-mismatch.yaml`

- [ ] **Step 1: Create valid fixture records**

Create one valid YAML record in each listed valid fixture folder. Include `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`. Use realistic sanitized examples such as "PowerShell npm wrapper blocked by execution policy" and "Root hook missing for feedback discovery".

- [ ] **Step 2: Create mismatch fixture**

Create `tests/fixtures/invalid-feedback/records/new/fb-20260709-1000-folder-mismatch.yaml` with `status: completed` so the script can detect a folder/status mismatch.

- [ ] **Step 3: Create missing-field fixture**

Create `tests/fixtures/invalid-feedback/records/new/fb-20260709-1015-missing-title.yaml` without a `title` field so the script can detect required summary fields.

- [ ] **Step 4: Write text output test**

Create a Node test that runs the script against `tests/fixtures/valid-feedback` and asserts the output includes `Feedback State`, `Counts`, `new: 1`, `planned: 1`, `in_progress: 1`, and `completed: 1`.

- [ ] **Step 5: Write JSON output test**

Create a Node test that runs:

```bash
node scaffold/.agents/feedback/tools/feedback-state.mjs --root tests/fixtures/valid-feedback --format json
```

Assert that parsed JSON contains `counts.new === 1` and `completed.length === 1`.

- [ ] **Step 6: Write status filter test**

Create a Node test that runs the script with `--status planned --format json` and asserts `records.length === 1`, `records[0].status === "planned"`, and `counts.completed === 1`.

- [ ] **Step 7: Write implemented filter test**

Create a Node test that runs the script with `--implemented --format json` and asserts that the `records` array contains only completed records sorted by completion date.

- [ ] **Step 8: Write stale detection test**

Create a Node test that runs the script with `--stale-days 0` and asserts that at least one `planned`, `in_progress`, or `in_review` record appears in `needs_attention` with reason `stale`.

- [ ] **Step 9: Write mismatch and missing-field tests**

Create a Node test that runs the script against `tests/fixtures/invalid-feedback` and asserts the output includes `status completed does not match folder new`.

Create a Node test that asserts the same invalid fixture output includes `missing required field title`.

- [ ] **Step 10: Write invalid CLI test**

Create a Node test that runs the script with `--status nope` and asserts the process exits with code `1`.

- [ ] **Step 11: Run tests**

Run:

```bash
node --test tests/feedback-state.test.mjs
```

Expected: all tests pass.

- [ ] **Step 12: Commit Task 6**

Run:

```bash
git add tests
git commit -m "test: cover feedback state script"
```

Expected: commit succeeds.

## Task 7: Package Scripts And CI

**Files:**

- Create: `package.json`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `package.json`**

Create a minimal package file. Do not add runtime dependencies.

```json
{
  "name": "agents-feedback",
  "version": "1.0.0",
  "description": "Portable .agents/feedback scaffold for repository-local agent workflow feedback.",
  "license": "MIT",
  "type": "module",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "check:state": "node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback",
    "release:check": "npm run test && npm run check:state"
  },
  "files": [
    "scaffold",
    "README.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "docs/specification.md"
  ]
}
```

- [ ] **Step 2: Create GitHub Actions workflow**

Create `.github/workflows/ci.yml`.

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm test
      - run: npm run check:state
```

- [ ] **Step 3: Run release check locally**

Run:

```bash
npm run release:check
```

On Windows PowerShell, run this if `npm.ps1` is blocked:

```powershell
npm.cmd run release:check
```

Expected: tests pass and scaffold state prints successfully.

- [ ] **Step 4: Commit Task 7**

Run:

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: add release checks"
```

Expected: commit succeeds.

## Task 8: Release Readiness Documentation

**Files:**

- Modify: `README.md`
- Modify: `docs/specification.md`
- Create: `docs/release-v1.md`

- [ ] **Step 1: Document installation modes**

Update `README.md` with two supported installation modes:

- Hooked mode: copy `.agents/feedback` and add root hook. This is recommended.
- Manual mode: copy `.agents/feedback` but do not add root hook. This is supported only when users explicitly instruct agents to use the folder.

- [ ] **Step 2: Document bootstrap switch**

Update `docs/specification.md` to state that the install process is complete only after `.agents/feedback/AGENTS.md` has been replaced with `AGENTS.final.md` in the target repository.

- [ ] **Step 3: Create release notes without a changelog**

Create `docs/release-v1.md`.

````markdown
# Release v1

Version 1.0.0 ships the first stable agents feedback scaffold.

## Included

- Installable `.agents/feedback` scaffold.
- Bootstrap and operational `AGENTS.md` instructions.
- Lifecycle folders for `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`.
- YAML record and plan templates.
- JSON schemas for IDE validation.
- Dependency-free `feedback-state.mjs` state report script.
- Node test coverage and GitHub Actions CI.

## Not Included

- No target-repository package install.
- No database.
- No background service.
- No project changelog for completed feedback records.
- No automatic root instruction mutation.

## Verification

```bash
npm run release:check
```
````

- [ ] **Step 4: Commit Task 8**

Run:

```bash
git add README.md docs/specification.md docs/release-v1.md
git commit -m "docs: prepare v1 release notes"
```

Expected: commit succeeds.

## Task 9: Final Verification And v1 Release Handoff

**Files:**

- Read: all files changed in previous tasks

- [ ] **Step 1: Run final release check**

Run:

```bash
npm run release:check
```

On Windows PowerShell, run:

```powershell
npm.cmd run release:check
```

Expected: tests pass and state script succeeds.

- [ ] **Step 2: Verify no accidental local IDE metadata is staged**

Run:

```bash
git status --short
```

Expected: `.idea/` is not listed. Only intentional files are tracked or the working tree is clean.

- [ ] **Step 3: Verify installed scaffold is self-contained**

Run:

```bash
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback --format json
```

Expected: JSON output includes all lifecycle count keys and no process error.

- [ ] **Step 4: Prepare v1 tag command for release approval**

Do not run this command unless the repository owner explicitly approves publishing the release:

```bash
git tag v1.0.0
```

Expected after approval: tag is created locally.

- [ ] **Step 5: Prepare push commands for release approval**

Do not run these commands unless the repository owner explicitly approves publishing the release:

```bash
git push origin main
git push origin v1.0.0
```

Expected after approval: GitHub Actions passes on `main`.

## Self-Review Checklist

- [ ] The plan initializes the repository and produces a releaseable v1.
- [ ] The installed scaffold remains dependency-free.
- [ ] The design avoids a changelog for implemented feedback records.
- [ ] Completed feedback can be reported from YAML records by `feedback-state.mjs`.
- [ ] `.agents/feedback` remains cleanly installable below `.agents/`.
- [ ] The root hook requirement is documented as the only reliable discovery mechanism.
- [ ] Bootstrap mode and operational mode are both specified.
- [ ] Safety rules prohibit secrets, credentials, raw private logs, and customer data.
- [ ] Tests cover state output, JSON output, and folder/status mismatch detection.
- [ ] Release tag and push steps are documented as approval-gated and are not run during ordinary implementation.
