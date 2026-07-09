# Agents Feedback v1 Agent Installer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor v1 into an agent-assisted installer scaffold that ships as a release artifact, installs from `.agents/feedback/AGENTS.md`, uses self-explanatory record and plan contracts, and publishes draft GitHub releases from version tags.

**Architecture:** The repository remains the source of the scaffold under `scaffold/.agents/feedback`, but v1 delivery changes from a human checklist to an agent-directed installer flow. A release artifact expands into `.agents/feedback`; the human points an agent at `.agents/feedback/AGENTS.md`; that bootstrap instruction set wires the root hook, validates installation, and converts the folder to operational mode. Repository-only validation and release tooling can use root development dependencies or scripts, but the installed scaffold must stay dependency-free.

**Tech Stack:** Markdown, YAML, JSON Schema draft-07, Node.js 24 LTS for repository checks, Node.js built-ins for installed scaffold tooling, GitHub Actions, release zip artifacts, draft GitHub Releases.

---

## Source Context

The current repository already contains the v1 scaffold, docs, schemas, templates, tests, and CI. The current README describes hooked and manual installation modes, while the target product has one supported installation model: unzip the release artifact into the target repository and point the agent at `.agents/feedback/AGENTS.md`.

The current record schema names fields but does not explain them in `description` values. The current record template repeats a long sensitivity note that would be copied into every record. The current record contract has `summary` but no full `description`, and has a single `suggested_action` string even though agents often need multiple candidate actions.

The current plan schema is too thin for the intended use. It should serve as both a selected implementation plan and progress tracker for agents, without turning the feedback scaffold into a full project management system.

The current CI runs Node 20 with `actions/checkout@v4` and `actions/setup-node@v4`. The official Node release schedule currently lists Node 24 as LTS through 2028-04-30 and Node 22 as LTS through 2027-04-30. The GitHub release pages currently show `actions/checkout` v7, `actions/setup-node` v6, `actions/upload-artifact` v7, and `softprops/action-gh-release` v3 release lines. The release workflow should use maintained action majors at implementation time and document the checked versions in the plan execution notes.

## Product Decisions

### Installation Model

There is no manual installation mode in v1. The only supported v1 flow is agent-assisted installation from the scaffold folder.

The release artifact must expand into this target path:

```text
.agents/
  feedback/
    AGENTS.md
    AGENTS.final.md
    INSTALL.md
    README.md
    records/
    schemas/
    templates/
    tools/
```

The human workflow is:

```text
download artifact -> unzip at repository root -> ask an agent to read .agents/feedback/AGENTS.md
```

The agent workflow is:

```text
read .agents/feedback/AGENTS.md -> read .agents/feedback/INSTALL.md -> add or update root instructions -> verify installation -> replace AGENTS.md with AGENTS.final.md
```

The installer may edit the target repository root instruction file because the user intentionally pointed the agent at the installer. The scaffold must not include a background service or script that automatically mutates root instructions without the agent's explicit installation step.

### Root Instruction Hook

The root hook should be idempotent and bounded. Use a managed block so agents can update a previous scaffold hook without touching unrelated root instructions.

The hook text should be:

```markdown
<!-- agents-feedback:start -->
## Repository Feedback

For repository workflow feedback, read `.agents/feedback/AGENTS.md` before creating or updating feedback records. Use `.agents/feedback` for sanitized observations that can improve future agent work in this repository.
<!-- agents-feedback:end -->
```

### Record Model

The record model must explain itself in both schema descriptions and template comments. The schema is not only for IDE validation; agents will read it and infer behavior from it.

The record model must add `description` and replace `suggested_action` with `suggested_actions`.

Use this top-level field list:

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

The `suggested_actions` field is an array. It should support one or more possible fixes without pretending the first idea is necessarily the chosen action.

Use this suggested action item shape:

```yaml
- id: action-1
  title: ""
  rationale: ""
  effort: low
  risk: low
```

The `sensitivity` block must stop copying boilerplate into every record. The safety policy belongs in docs and schema descriptions. The record only records the result of the sanitization check.

### Plan Model

The plan model must support both planning and progress tracking. It should remain small enough for agents to inspect and update directly.

Use this plan shape:

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

Task recursion is allowed so agents can break complex improvements into nested work. Documentation must state that v1 plans should stay shallow: one or two nested levels are preferred, and deeper structure should be promoted to repository planning docs rather than packed into a feedback record.

### Documentation Model

The README should define the product before boundaries. Current docs lead with what the scaffold is not too early. The refactor should make the positive model clear first.

Use this documentation hierarchy:

```text
README.md
docs/
  specification.md
  release-v1.md
  plans/
    agents-feedback-v1-initialization/
    agents-feedback-v1-agent-installer-refactor/
scaffold/.agents/feedback/
  AGENTS.md
  AGENTS.final.md
  INSTALL.md
  README.md
  records/README.md
  schemas/
  templates/
  tools/
```

Keep the old initialization plan as historical context only if it is clearly marked complete or superseded. Do not leave it looking like the active v1 delivery plan.

### Release Model

Release tags should build and attach artifacts. The maintainer should publish from a draft release, not by hand-assembling files after tagging.

The tag workflow should:

```text
on v* tag -> run release checks -> build zip -> compute checksum -> upload workflow artifact -> create draft GitHub Release -> attach zip and checksum
```

The artifact should be named like:

```text
agents-feedback-v1.0.0.zip
agents-feedback-v1.0.0.zip.sha256
```

The zip must contain `.agents/feedback` at its root so extracting at a target repository root creates the intended installed path.

## File Structure

### Documentation Files

- Modify `README.md` to present the product, artifact installation, agent installer flow, record model, plan model, verification, release artifact, and boundaries in that order.
- Modify `CONTRIBUTING.md` to replace manual installation language with agent-assisted installation and to add release artifact verification expectations.
- Modify `AGENTS.md` to state that this repository maintains an agent-assisted installer scaffold, not a manually installed folder.
- Modify `docs/specification.md` to become the authoritative v1 contract for installer flow, records, plans, state script, validation, and release artifacts.
- Modify `docs/release-v1.md` to define the draft release workflow and artifact contents.
- Modify `docs/plans/agents-feedback-v1-initialization/agents-feedback-v1-initialization.plan.md` to mark it superseded by this refactor plan, or add a short supersession note at the top.
- Create `scaffold/.agents/feedback/INSTALL.md` as the detailed installer procedure referenced by bootstrap `AGENTS.md`.

### Scaffold Files

- Modify `scaffold/.agents/feedback/AGENTS.md` to be the bootstrap installer entrypoint.
- Modify `scaffold/.agents/feedback/AGENTS.final.md` to be operational instructions after install.
- Modify `scaffold/.agents/feedback/README.md` to describe installed folder purpose and point to operational behavior.
- Modify `scaffold/.agents/feedback/records/README.md` to explain lifecycle and record expectations with the new fields.
- Modify `scaffold/.agents/feedback/templates/root-agents-hook.md` to use the managed block.
- Modify `scaffold/.agents/feedback/templates/record.yaml` to match the new schema and include field comments.
- Modify `scaffold/.agents/feedback/templates/plan.yaml` to match the new plan schema and include field comments.
- Modify `scaffold/.agents/feedback/schemas/record.schema.json` to add descriptions and the new field structure.
- Modify `scaffold/.agents/feedback/schemas/plan.schema.json` to add descriptions, phases, recursive tasks, and plan status.
- Modify `scaffold/.agents/feedback/tools/feedback-state.mjs` only where needed to understand renamed fields and to keep output useful.

### Repository Tooling Files

- Modify `package.json` to add scripts for schema validation, artifact build verification, and release checks.
- Modify `.github/workflows/ci.yml` to use Node 24 and current maintained action majors.
- Create `.github/workflows/release.yml` for tag-triggered draft releases.
- Create `scripts/validate-feedback-contract.mjs` for repository-only schema/template/fixture validation.
- Create `scripts/build-release-artifact.mjs` or `scripts/build-release-artifact.ps1` for deterministic release artifacts.
- Create `tests/fixtures/...` records that exercise the new record shape, suggested actions, sensitivity block, and plan structure.
- Add tests for installer instructions and artifact layout.

## Task 1: Rewrite The Product Contract

**Files:**

- Modify `README.md`
- Modify `docs/specification.md`
- Modify `docs/release-v1.md`
- Modify `CONTRIBUTING.md`
- Modify `AGENTS.md`

- [ ] **Step 1: Rewrite README around the positive product definition**

Replace the top of `README.md` with a product-first structure. The first section must explain that `agents-feedback` is a release artifact containing an agent-installable `.agents/feedback` scaffold.

Use this section order:

```markdown
# agents-feedback

`agents-feedback` ships an agent-installable `.agents/feedback` scaffold. A repository owner downloads the release artifact, extracts it at a target repository root, and points an agent at `.agents/feedback/AGENTS.md`; the agent wires the repository instructions and converts the folder into operational feedback mode.

## What It Provides

The scaffold gives agents a structured repository-local place to record workflow friction, missing instructions, setup problems, verification gaps, and completed improvements that should help future agent sessions in the same repository.

## Installation Flow

1. Download the release artifact named `agents-feedback-vX.Y.Z.zip`.
2. Extract it at the target repository root so `.agents/feedback/AGENTS.md` exists.
3. Ask an agent to read `.agents/feedback/AGENTS.md` and complete installation.
4. Review the agent's root instruction change.

## Agent Installer

The bootstrap `AGENTS.md` in `.agents/feedback` is the installer entrypoint. It instructs the agent to read `INSTALL.md`, add or update the managed root hook, verify the scaffold, and replace itself with `AGENTS.final.md` after installation succeeds.

## Records And Plans

Feedback records are YAML files under `.agents/feedback/records/<status>/`. Records include a short `summary`, a full `description`, sanitized `evidence`, `impact`, one or more `suggested_actions`, and an optional plan used for implementation and progress tracking.

## Boundaries

The scaffold is not long-term memory, not a general task tracker, not a project changelog, and not canonical project documentation. Durable rules belong in the repository's normal `AGENTS.md`, README, docs, scripts, and tests.
```

- [ ] **Step 2: Replace installation modes in the specification**

In `docs/specification.md`, remove hooked mode and manual mode. Replace them with one section named `Agent-Assisted Installation Model`.

The section must state:

```markdown
The only supported v1 installation model is agent-assisted installation. A user extracts the release artifact at the target repository root, confirms `.agents/feedback/AGENTS.md` exists, and instructs an agent to read that file. The bootstrap instructions then guide the agent through root hook wiring, verification, and conversion to operational mode.
```

- [ ] **Step 3: Update release criteria**

In `docs/specification.md`, update release criteria so v1 is not complete unless:

```markdown
- The release artifact expands to `.agents/feedback`.
- Bootstrap `AGENTS.md` can guide an agent through installation without external instructions.
- The root hook template is managed and idempotent.
- Record and plan schemas contain descriptions for every property.
- Templates explain field intent in comments without copying policy boilerplate into record values.
- Repository release checks validate schemas, templates, fixtures, state output, and artifact layout.
- Tag workflows create a draft GitHub Release with a zip artifact and checksum.
```

- [ ] **Step 4: Update `docs/release-v1.md`**

Rewrite `docs/release-v1.md` so it defines release scope and tag behavior. It must say that publishing still requires maintainer approval, but tagging creates a draft release and attached artifacts.

Use these release gates:

```bash
npm run release:check
npm run artifact:check
```

- [ ] **Step 5: Update root repository instructions**

In root `AGENTS.md`, replace any language that implies manual copying and hook editing with agent-assisted installer maintenance language. Keep the rule that target repository setup is limited to extracting `.agents/feedback` and pointing an agent at `.agents/feedback/AGENTS.md`.

- [ ] **Step 6: Update contribution guidance**

In `CONTRIBUTING.md`, replace manual verification language with artifact verification language. Keep the installed scaffold dependency-free. State that repository-only validation tooling may exist outside the installed scaffold.

- [ ] **Step 7: Verify Task 1 docs**

Run:

```powershell
rg -n "Manual mode|Hooked mode|manual installation|copy .*root hook" README.md docs AGENTS.md CONTRIBUTING.md
```

Expected: no active docs describe manual or hooked modes as supported v1 modes. Historical plan files may match only if marked superseded.

## Task 2: Convert Bootstrap Instructions Into An Installer

**Files:**

- Modify `scaffold/.agents/feedback/AGENTS.md`
- Create `scaffold/.agents/feedback/INSTALL.md`
- Modify `scaffold/.agents/feedback/AGENTS.final.md`
- Modify `scaffold/.agents/feedback/templates/root-agents-hook.md`
- Test `tests/installer-instructions.test.mjs`

- [ ] **Step 1: Write tests for installer instructions**

Create `tests/installer-instructions.test.mjs` with Node test assertions that:

```javascript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('bootstrap AGENTS.md points the agent to installer instructions', () => {
  const content = read('scaffold/.agents/feedback/AGENTS.md');
  assert.match(content, /INSTALL\.md/);
  assert.match(content, /root instruction/);
  assert.match(content, /AGENTS\.final\.md/);
  assert.doesNotMatch(content, /Manual mode/i);
});

test('root hook template uses managed markers', () => {
  const content = read('scaffold/.agents/feedback/templates/root-agents-hook.md');
  assert.match(content, /agents-feedback:start/);
  assert.match(content, /agents-feedback:end/);
  assert.match(content, /Repository Feedback/);
});
```

- [ ] **Step 2: Run the installer instruction tests and confirm failure**

Run:

```powershell
npm.cmd test -- tests/installer-instructions.test.mjs
```

Expected: FAIL until the bootstrap files are rewritten.

- [ ] **Step 3: Rewrite bootstrap `AGENTS.md`**

Replace `scaffold/.agents/feedback/AGENTS.md` with concise installer entrypoint instructions:

```markdown
# Agent Instructions for feedback - Installer Mode

## Summary

This folder is an agent-assisted installer for repository feedback. Read `INSTALL.md`, wire the target repository root instructions, verify the scaffold, then replace this file with `AGENTS.final.md`.

## Must-follow rules

- Do not create feedback records before installation is complete.
- Preserve existing target repository instructions when editing the root instruction file.
- Add or update only the managed feedback hook from `templates/root-agents-hook.md`.
- Run the installation verification steps in `INSTALL.md`.
- Replace this file with `AGENTS.final.md` only after verification succeeds.
- Never put secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs in feedback records.

## Required reading

- `INSTALL.md` defines the installation procedure.
- `templates/root-agents-hook.md` contains the managed root hook.
- `AGENTS.final.md` contains the operational instructions that replace this installer file.
```

- [ ] **Step 4: Create `INSTALL.md`**

Create `scaffold/.agents/feedback/INSTALL.md` with these sections:

```markdown
# feedback Installer

## Purpose

Use this file when a user has extracted the feedback artifact into `.agents/feedback` and asked an agent to complete installation.

## Installation Steps

1. Confirm the current repository contains `.agents/feedback/AGENTS.md`, `.agents/feedback/AGENTS.final.md`, `.agents/feedback/templates/root-agents-hook.md`, `.agents/feedback/records/`, `.agents/feedback/schemas/`, and `.agents/feedback/tools/feedback-state.mjs`.
2. Locate the repository root instruction file. Prefer `AGENTS.md` at the repository root. If no root instruction file exists, create `AGENTS.md`.
3. Add or update the managed block from `.agents/feedback/templates/root-agents-hook.md`. Preserve all other root instruction content.
4. Run `node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback`.
5. Confirm the command exits `0`.
6. Replace `.agents/feedback/AGENTS.md` with the contents of `.agents/feedback/AGENTS.final.md`.
7. Report the root instruction file changed and the verification command output.

## Completion Criteria

- The root instruction file contains the `agents-feedback:start` and `agents-feedback:end` markers.
- `.agents/feedback/AGENTS.md` contains operational instructions, not installer instructions.
- `node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback` exits `0`.
```

- [ ] **Step 5: Update the root hook template**

Replace `scaffold/.agents/feedback/templates/root-agents-hook.md` with:

````markdown
# Root AGENTS.md Hook

Add or update this managed block in the target repository's root `AGENTS.md` or equivalent agent instruction surface.

```markdown
<!-- agents-feedback:start -->
## Repository Feedback

For repository workflow feedback, read `.agents/feedback/AGENTS.md` before creating or updating feedback records. Use `.agents/feedback` for sanitized observations that could improve future agent work in this repository.
<!-- agents-feedback:end -->
```
````

- [ ] **Step 6: Update operational instructions**

Revise `AGENTS.final.md` to remove installer language and describe the new record fields. Include `summary`, `description`, `suggested_actions`, `sensitivity.classification`, and plan progress tracking.

- [ ] **Step 7: Run installer tests**

Run:

```powershell
npm.cmd test -- tests/installer-instructions.test.mjs
```

Expected: PASS.

## Task 3: Refactor Record Schema And Template

**Files:**

- Modify `scaffold/.agents/feedback/schemas/record.schema.json`
- Modify `scaffold/.agents/feedback/templates/record.yaml`
- Modify `scaffold/.agents/feedback/records/README.md`
- Modify `docs/specification.md`
- Modify fixture YAML files under `tests/fixtures/`
- Test `tests/feedback-contract.test.mjs`

- [ ] **Step 1: Write contract tests for record schema descriptions**

Create `tests/feedback-contract.test.mjs` with a test that parses `record.schema.json` and confirms every top-level property has `description`.

Use this helper:

```javascript
function assertDescriptions(schema, propertyPath = []) {
  for (const [name, definition] of Object.entries(schema.properties ?? {})) {
    assert.equal(typeof definition.description, 'string', `${[...propertyPath, name].join('.')} missing description`);
    assert.notEqual(definition.description.trim(), '', `${[...propertyPath, name].join('.')} empty description`);
  }
}
```

- [ ] **Step 2: Write contract tests for renamed fields**

In the same test file, assert that:

```javascript
assert.ok(recordSchema.required.includes('description'));
assert.ok(recordSchema.required.includes('suggested_actions'));
assert.ok(!recordSchema.required.includes('suggested_action'));
assert.ok(recordSchema.properties.suggested_actions);
assert.ok(recordSchema.properties.sensitivity.properties.classification);
assert.ok(!recordSchema.properties.sensitivity.properties.notes);
```

- [ ] **Step 3: Run contract tests and confirm failure**

Run:

```powershell
npm.cmd test -- tests/feedback-contract.test.mjs
```

Expected: FAIL until the schema is updated.

- [ ] **Step 4: Update `record.schema.json`**

Modify the schema to:

- require `description`.
- replace `suggested_action` with `suggested_actions`.
- define `suggested_actions` as an array with `id`, `title`, `rationale`, `effort`, and `risk`.
- replace `sensitivity.notes` with `sensitivity.classification` and `sensitivity.redaction_notes`.
- add a non-empty `description` property to every top-level field and nested field.

Use these nested enum values:

```json
{
  "effort": ["low", "medium", "high"],
  "risk": ["low", "medium", "high"],
  "classification": ["public", "internal", "sensitive_redacted"]
}
```

- [ ] **Step 5: Update `record.yaml` template**

Update `scaffold/.agents/feedback/templates/record.yaml` to the new shape. Include short comments above fields where field intent is not obvious.

The sensitivity block must be:

```yaml
sensitivity:
  sanitized: true
  classification: public
  redaction_notes: ""
```

Do not put the old boilerplate sentence into `redaction_notes`.

- [ ] **Step 6: Update records README and specification**

Update `scaffold/.agents/feedback/records/README.md` and `docs/specification.md` so they define `summary`, `description`, `suggested_actions`, and the sensitivity block consistently.

- [ ] **Step 7: Update fixtures**

Update every fixture record under `tests/fixtures/` from `suggested_action` to `suggested_actions` and add `description`. Use future-proof fixture dates without impossible 2099 timestamps by passing explicit stale settings in tests instead of future-dating active records.

- [ ] **Step 8: Run record contract and state tests**

Run:

```powershell
npm.cmd test -- tests/feedback-contract.test.mjs tests/feedback-state.test.mjs
```

Expected: PASS after schema, template, fixture, and parser updates.

## Task 4: Refactor Plan Schema Into Planning And Progress Tracking

**Files:**

- Modify `scaffold/.agents/feedback/schemas/plan.schema.json`
- Modify `scaffold/.agents/feedback/templates/plan.yaml`
- Modify `docs/specification.md`
- Modify `scaffold/.agents/feedback/AGENTS.final.md`
- Test `tests/feedback-contract.test.mjs`

- [ ] **Step 1: Add plan schema tests**

Extend `tests/feedback-contract.test.mjs` to assert:

```javascript
assert.ok(planSchema.required.includes('schema_version'));
assert.ok(planSchema.required.includes('status'));
assert.ok(planSchema.required.includes('phases'));
assert.ok(!planSchema.required.includes('steps'));
assert.ok(planSchema.properties.phases);
assert.ok(planSchema.definitions.task);
assert.ok(planSchema.definitions.task.properties.tasks);
```

- [ ] **Step 2: Run plan tests and confirm failure**

Run:

```powershell
npm.cmd test -- tests/feedback-contract.test.mjs
```

Expected: FAIL until the plan schema is updated.

- [ ] **Step 3: Replace `plan.schema.json`**

Replace the flat `steps` schema with a phase and recursive task schema using draft-07 `definitions`.

The schema must require:

```json
["schema_version", "objective", "owner", "status", "source_action_id", "phases", "outcome"]
```

Use these status values:

```json
{
  "planStatus": ["planned", "in_progress", "in_review", "completed", "archived"],
  "taskStatus": ["planned", "in_progress", "blocked", "done", "skipped"],
  "outcomeStatus": ["pending", "completed", "archived"]
}
```

- [ ] **Step 4: Update `plan.yaml`**

Replace `steps` with `phases` and nested tasks. Include comments that distinguish instructions, validation, and evidence.

- [ ] **Step 5: Update operational instructions**

Update `AGENTS.final.md` to tell agents that a plan is the selected action and progress tracker for a feedback record. It must say to keep plans shallow and move durable project plans into normal docs when work grows beyond the record.

- [ ] **Step 6: Run contract tests**

Run:

```powershell
npm.cmd test -- tests/feedback-contract.test.mjs
```

Expected: PASS.

## Task 5: Add Repository Contract Validation

**Files:**

- Create `scripts/validate-feedback-contract.mjs`
- Modify `package.json`
- Modify `tests/feedback-contract.test.mjs`
- Modify fixtures as needed

- [ ] **Step 1: Decide validation dependency policy**

Use root-only development dependencies if full YAML and JSON Schema validation is required. Do not include those dependencies in the release artifact. If keeping zero root dependencies is preferred, implement focused contract checks with Node built-ins and document that they validate this scaffold contract rather than arbitrary JSON Schema.

Recommended v1 choice: use Node built-ins for a focused validator and avoid adding package dependencies before v1.

- [ ] **Step 2: Create `scripts/validate-feedback-contract.mjs`**

The script should:

- parse `record.schema.json` and `plan.schema.json` with `JSON.parse`.
- confirm required field lists match documented template keys.
- confirm every schema property has `description`.
- confirm `record.yaml` includes every required top-level record key.
- confirm `plan.yaml` includes every required top-level plan key.
- confirm no template value contains the old sensitivity boilerplate.
- confirm `suggested_action` no longer appears outside historical plans.
- confirm `Manual mode` no longer appears outside historical plans.

- [ ] **Step 3: Add package scripts**

Update `package.json` scripts:

```json
{
  "test": "node --test tests/*.test.mjs",
  "check:state": "node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback",
  "check:contract": "node scripts/validate-feedback-contract.mjs",
  "artifact:build": "node scripts/build-release-artifact.mjs",
  "artifact:check": "node scripts/build-release-artifact.mjs --check",
  "release:check": "npm run test && npm run check:contract && npm run check:state && npm run artifact:check"
}
```

- [ ] **Step 4: Run contract validation**

Run:

```powershell
npm.cmd run check:contract
```

Expected: PASS after docs, schemas, and templates are aligned.

## Task 6: Build Release Artifact Tooling

**Files:**

- Create `scripts/build-release-artifact.mjs`
- Modify `package.json`
- Test `tests/release-artifact.test.mjs`

- [ ] **Step 1: Write artifact layout tests**

Create `tests/release-artifact.test.mjs` to run the build script in check mode and inspect the staged artifact directory.

The test must assert:

```javascript
assert.ok(fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'AGENTS.md')));
assert.ok(fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'INSTALL.md')));
assert.ok(fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'AGENTS.final.md')));
assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'package.json')));
```

- [ ] **Step 2: Implement artifact staging**

Create `scripts/build-release-artifact.mjs` using Node built-ins. It should:

- remove `dist/artifact`.
- create `dist/artifact/.agents/feedback`.
- recursively copy `scaffold/.agents/feedback` to `dist/artifact/.agents/feedback`.
- verify required files exist.
- write `dist/artifact-manifest.json` with package version, created artifact name, and included root.

- [ ] **Step 3: Implement zip creation**

Implement one of these options:

- Preferred: add a small store-only ZIP writer in `scripts/build-release-artifact.mjs` using Node built-ins so artifact creation works on Windows and Linux without external commands.
- Acceptable: stage with Node and let the GitHub release workflow zip the staged folder with runner tools, while local `artifact:check` verifies layout only.

The preferred option better matches the user workflow because the release asset is the product.

- [ ] **Step 4: Implement checksum creation**

Use Node `crypto.createHash('sha256')` to write:

```text
dist/agents-feedback-vX.Y.Z.zip.sha256
```

- [ ] **Step 5: Run artifact checks**

Run:

```powershell
npm.cmd run artifact:check
```

Expected: staged artifact exists with `.agents/feedback` at the root and no repository-only files.

## Task 7: Modernize CI And Add Draft Release Workflow

**Files:**

- Modify `.github/workflows/ci.yml`
- Create `.github/workflows/release.yml`
- Modify `docs/release-v1.md`
- Modify `package.json`

- [ ] **Step 1: Update CI workflow**

Update `.github/workflows/ci.yml` to:

```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24

      - name: Run release check
        run: npm run release:check
```

- [ ] **Step 2: Create tag release workflow**

Create `.github/workflows/release.yml`:

```yaml
name: Draft Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  draft-release:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24

      - name: Run release checks
        run: npm run release:check

      - name: Build release artifact
        run: npm run artifact:build

      - name: Upload workflow artifact
        uses: actions/upload-artifact@v7
        with:
          name: agents-feedback-release
          path: |
            dist/agents-feedback-*.zip
            dist/agents-feedback-*.zip.sha256

      - name: Create draft GitHub Release
        uses: softprops/action-gh-release@v3
        with:
          draft: true
          generate_release_notes: true
          files: |
            dist/agents-feedback-*.zip
            dist/agents-feedback-*.zip.sha256
```

Before implementing, confirm the current maintained major versions for `actions/upload-artifact` and the release action. If a newer major exists at implementation time, use the newer maintained major and document the source in the commit message or release notes.

- [ ] **Step 3: Update release docs**

Update `docs/release-v1.md` so the release handoff is:

```bash
npm run release:check
git tag v1.0.0
git push origin v1.0.0
```

The docs must state that pushing the tag creates a draft release and the maintainer publishes the draft after reviewing attached artifacts.

- [ ] **Step 4: Run workflow lint by inspection**

Run:

```powershell
Get-Content -Raw .github\workflows\ci.yml
Get-Content -Raw .github\workflows\release.yml
```

Expected: both workflows use Node 24, current action majors, and explicit permissions.

## Task 8: Update State Script And Tests For New Fields

**Files:**

- Modify `scaffold/.agents/feedback/tools/feedback-state.mjs`
- Modify `tests/feedback-state.test.mjs`
- Modify `tests/fixtures/`

- [ ] **Step 1: Update scalar extraction**

Update `YAML_FIELDS` in `feedback-state.mjs` to include `description` and continue to omit complex arrays such as `suggested_actions` and `plan`.

- [ ] **Step 2: Add attention checks**

Add needs-attention checks for missing `description` and missing `summary`. Keep the state script lightweight and dependency-free.

- [ ] **Step 3: Update fixtures**

Update valid fixtures to include `description` and `suggested_actions`. Avoid 2099 timestamps by setting `--stale-days` in tests high enough for valid fixtures.

- [ ] **Step 4: Update tests**

Update `tests/feedback-state.test.mjs` assertions for missing description and summary.

- [ ] **Step 5: Run state tests**

Run:

```powershell
npm.cmd test -- tests/feedback-state.test.mjs
```

Expected: PASS.

## Task 9: Mark The Old Initialization Plan Superseded

**Files:**

- Modify `docs/plans/agents-feedback-v1-initialization/agents-feedback-v1-initialization.plan.md`

- [ ] **Step 1: Add supersession notice**

Add this paragraph after the title:

```markdown
This plan is historical. It initialized the first scaffold shape and is superseded for v1 delivery by `docs/plans/agents-feedback-v1-agent-installer-refactor/agents-feedback-v1-agent-installer-refactor.plan.md`.
```

- [ ] **Step 2: Avoid active checklist confusion**

Either mark the historical checklist as completed where accurate, or add a `Historical Notes` section explaining that unchecked boxes are no longer active delivery instructions.

- [ ] **Step 3: Verify historical references**

Run:

```powershell
rg -n "currently almost empty|invalid-feedback|Manual mode|Hooked mode" docs\plans\agents-feedback-v1-initialization
```

Expected: matches are acceptable only inside clearly historical content.

## Task 10: Final Verification

**Files:**

- Read and verify all modified files.

- [ ] **Step 1: Run the full release check**

Run:

```powershell
npm.cmd run release:check
```

Expected: all tests, contract validation, state checks, and artifact checks pass.

- [ ] **Step 2: Run artifact build**

Run:

```powershell
npm.cmd run artifact:build
```

Expected: `dist/agents-feedback-v1.0.0.zip` and `dist/agents-feedback-v1.0.0.zip.sha256` exist.

- [ ] **Step 3: Verify artifact contents**

Extract the zip into a temporary directory and verify:

```text
.agents/feedback/AGENTS.md
.agents/feedback/INSTALL.md
.agents/feedback/AGENTS.final.md
.agents/feedback/schemas/record.schema.json
.agents/feedback/schemas/plan.schema.json
.agents/feedback/tools/feedback-state.mjs
```

- [ ] **Step 4: Simulate installer instructions by inspection**

Read `dist` extracted `.agents/feedback/AGENTS.md` and `INSTALL.md`. Confirm a fresh agent can follow them without consulting repository source docs.

- [ ] **Step 5: Check release workflow trigger**

Inspect `.github/workflows/release.yml` and confirm it triggers only on `v*` tags and creates a draft release.

- [ ] **Step 6: Check worktree**

Run:

```powershell
git status --short
```

Expected: only intentional files are modified or added.

## Acceptance Criteria

- A release artifact exists that expands to `.agents/feedback` at the target repository root.
- A user can complete installation by pointing an agent at `.agents/feedback/AGENTS.md`.
- Bootstrap instructions wire a managed root hook, verify installation, and convert to operational mode.
- There is no supported manual installation mode in active docs.
- Record schema and template include `summary`, `description`, and `suggested_actions`.
- Record schema and plan schema include descriptions for every field agents need to interpret.
- The sensitivity block records sanitization status without copying a long boilerplate note into every record.
- The plan schema supports phases and recursive tasks for bounded progress tracking.
- State script remains dependency-free and useful in installed target repositories.
- Repository release checks validate contract alignment, state output, tests, and artifact layout.
- Tag pushes create a draft GitHub Release with the zip artifact and checksum attached.
- The old initialization plan is clearly historical or superseded.

## Open Decisions

### Artifact Zip Implementation

The preferred approach is a Node built-in ZIP writer so local and CI artifact builds behave the same on Windows and Linux. If that cost is too high for v1, use Node to stage the artifact and CI runner tooling to zip it, but keep `artifact:check` local and deterministic.

### Root Dev Dependencies

The recommended v1 approach is to avoid root dev dependencies and write focused validators with Node built-ins. If full JSON Schema validation becomes necessary, add root-only `ajv` and `yaml` dev dependencies and ensure release artifacts still exclude all repository tooling.

### Installed Path

This plan assumes the canonical target path is `.agents/feedback`. If the intended path is different, update the artifact layout, installer instructions, root hook, and verification commands before implementation.

## Source Notes

- Node.js release schedule source: `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json`.
- GitHub Actions release source for `actions/checkout`: `https://github.com/actions/checkout/releases`.
- GitHub Actions release source for `actions/setup-node`: `https://github.com/actions/setup-node/releases`.
- GitHub Actions release source for `actions/upload-artifact`: `https://github.com/actions/upload-artifact/releases`.
- GitHub release action source for `softprops/action-gh-release`: `https://github.com/softprops/action-gh-release/releases`.
