# Agents Feedback v1.1.0 Implementation and Release Plan

## Plan Status

This plan has completed planning, adversarial review, revision, implementation, and local release-candidate verification. Public release approval remains pending.

## Task Frame

### Header

| Field | Value |
| --- | --- |
| Raw request | `1. Plan this extensively first. 2. Then review the plan for weak spots, missed information, or any other gaps. 3. Then improve the plan. 4. Then implement the plan and prepare the release of the version 1.1.0.` |
| Source | User request in the active thread |
| Date | 2026-07-10 |
| Analyst frame | Product usability, software architecture, delivery, security, and cross-platform collaboration |

### Goal Stack

#### Global Goal

Provide a small repository-local learning loop that helps humans and agents avoid repeating workflow friction.

Purpose: Improve future repository work without introducing a service, database, package installation, or background process.

#### Communication Goal

Prepare a coherent v1.1.0 release candidate that makes feedback easier to discover, capture, share, triage, and promote into durable repository improvements.

Purpose: Turn the current capture-only scaffold into a practical consume-and-improve loop while preserving portability.

#### Task Goal

Plan, review, improve, implement, and verify v1.1.0 using one final record schema and one final plan schema.

Purpose: Use the repository's low adoption to remove legacy complexity before the contract becomes costly to change.

#### Resolution Criteria

The global goal takes precedence over compatibility with the one-day-old v1.0.0 record shape. Simplicity, safety, collaboration, and verifiable release behavior take precedence over preserving unused schema details.

### Current State

| Descriptor | Current value | Confidence | Evidence |
| --- | --- | --- | --- |
| Product version | `1.0.0` | High | `package.json` and tag `v1.0.0` |
| Record contract | Verbose `feedback-record.v1` with duplicated lifecycle status | High | Current record schema and template |
| Plan contract | Recursive phase and task structure | High | Current plan schema and template |
| Feedback consumption | Root hook covers creation and updates but not discovery before work | High | Current root hook and operational instructions |
| Local machine support | No explicit ignored local overlay | High | Scaffold tree |
| State helper | Shared v1 records only; no active, brief, area, path, or local filters | High | `feedback-state.mjs` |
| Installation | Node.js is mandatory for verification | High | Current `INSTALL.md` |
| Upgrade safety | No staged upgrade contract | High | Current scaffold contents |
| Validation | Focused built-in checks, not complete instance validation | High | Contract validator and tests |
| Release baseline | Existing release check passes 19 tests | High | `npm run release:check` on 2026-07-10 |
| Worktree | User-owned `.gitignore` modification only | High | `git status --short` |

### Goal State

| Descriptor | Target value | Source | Notes |
| --- | --- | --- | --- |
| Product version | `1.1.0` release candidate | User | No tag, push, or publication without approval |
| Record contract | One concise `feedback-record.v1` schema | User and review decision | No dispatcher or legacy schema |
| Plan contract | One flat `feedback-plan.v1` schema | Review decision | Large plans live in normal project planning |
| Feedback consumption | Relevant active feedback is inspected before substantial or unfamiliar work | Review decision | Trivial work may skip the check |
| Local machine support | Ignored local overlay works beside shared records | User | Local content remains secret-free and uncommitted |
| State helper | Shared and local discovery with active, brief, area, path, and shared-only filtering | Review decision | Installed script remains dependency-free |
| Installation | Fresh install supports Node.js and manual verification | Review decision | Node.js 22 or newer enables automated verification |
| Upgrade safety | Existing installations use staged extraction | Review decision | Never extract directly over an existing installation |
| Validation | Complete schema fixtures plus contract, CLI, installer, and artifact checks | Review decision | Repository-only development dependencies are allowed |
| Artifact identity | Reproducible ZIP and checksum for `v1.1.0` | Delivery requirement | Tested artifact must match prepared artifact |

### Gap

| ID | Descriptor | From | To | Changeable |
| --- | --- | --- | --- | --- |
| G1 | Record schema | Verbose and duplicated | Concise and folder-authoritative | Yes |
| G2 | Plan schema | Recursive | Flat and bounded by guidance | Yes |
| G3 | Operational loop | Capture only | Consume, update, triage, promote | Yes |
| G4 | Collaboration | Shared only | Shared plus ignored local overlay | Yes |
| G5 | State discovery | Full shared summary | Relevant shared and local discovery | Yes |
| G6 | Installation | Node-required | Node-optional fresh installation | Yes |
| G7 | Upgrade | Undefined | Staged and record-preserving | Yes |
| G8 | Validation | Structural | Complete behavior and artifact validation | Yes |
| G9 | Release | v1.0.0 metadata | Verified v1.1.0 release candidate | Yes |
| G10 | User entry point | ZIP and checksum roles can be confused | Every active installation surface names the ZIP as the download and checksum as optional verification | Yes |

### Constraints

| ID | Type | Description | Source | Conflict |
| --- | --- | --- | --- | --- |
| C1 | Hard | The installed scaffold has no dependencies. | Repository instructions | None |
| C2 | Hard | Target setup is limited to installing `.agents/feedback` and pointing an agent to its `AGENTS.md`. | Repository instructions | None |
| C3 | Hard | Do not store secrets, credentials, private logs, customer data, private issue text, screenshots, large logs, or tokens. | Repository instructions | None |
| C4 | Hard | `docs/specification.md` changes with lifecycle, record, plan, script, installer, or artifact behavior. | Repository instructions | None |
| C5 | Hard | Do not publish, tag, push, or mutate a public release without maintainer approval. | Repository and authority boundary | None |
| C6 | Hard | Preserve the user-owned `.gitignore` modification. | Worktree ownership rule | None |
| C7 | Soft | Scaffold instructions stay short enough for agents to read fully. | Repository instructions | Potential tension with complete operational guidance |
| C8 | Soft | Shared records merge cleanly across branches and machines. | User collaboration requirement | Potential tension with updating repeated records |
| C9 | Resource | The implementation uses one agent session and local repository tools. | Active environment | None |

### Obstacles

| ID | Gap | Type | Description | Resolution |
| --- | --- | --- | --- | --- |
| O1 | G4 | Constraint | Local additions must be available to one clone without entering shared history. | Add a tracked local boundary with ignored contents and explicit promotion rules. |
| O2 | G5 | Capability | The installed script cannot depend on a general YAML parser. | Keep a documented bounded parser for the fields required by state discovery. |
| O3 | G7 | Precondition | Installer instructions are read after extraction, which is too late to prevent unsafe overwrite. | Document staged extraction before any existing installation is touched. |
| O4 | G8 | Capability | Complete YAML and JSON Schema validation is not available in current repository tooling. | Add pinned repository-only Ajv, Ajv formats, and YAML development dependencies. |
| O5 | G9 | Human checkpoint | Public release exposure requires maintainer approval. | Prepare and verify locally, then stop before tag, push, or publication. |

## Product and Architecture Decisions

### Decision D1: Use One Schema Generation

Use `feedback-record.v1` and `feedback-plan.v1` as the only supported instance contracts. Keep only `schemas/record.schema.json` and `schemas/plan.schema.json`.

Rationale: There is no meaningful installed base, so dispatchers, legacy schemas, mixed parsing, and migrations would create permanent cost without user value.

Review trigger: Introduce a new generation only after a released contract has real stored records that cannot be safely interpreted by an additive change.

### Decision D2: Make Folders Authoritative

The lifecycle folder is the only record status. Records do not repeat a `status` field.

Rationale: A single source of truth removes mismatch friction and makes moves visible in version control.

Review trigger: Revisit only if records move to storage that does not preserve lifecycle folders.

### Decision D3: Separate Shared and Local Scope

Store team feedback under `records/`. Store per-clone instructions and records under `local/`, whose personal contents are ignored by Git.

Rationale: Shared repository learning and local machine context have different visibility, merge, and retention requirements.

Review trigger: Revisit if a target repository uses a version control system that cannot honor the tracked ignore boundary.

### Decision D4: Keep the Installed Helper Dependency-Free

Parse only the YAML subset needed for filtering, normalization, and attention checks. Full validation remains repository tooling responsibility.

Rationale: The helper must remain portable after artifact extraction and must not require a target package installation.

Review trigger: Revisit if the artifact later ships as an application with an explicit runtime dependency model.

### Decision D5: Use Staged Upgrades

Fresh installations may extract at repository root. Existing installations must extract the new artifact into a temporary staging directory and let an agent merge managed files.

Rationale: Instructions inside an artifact cannot protect existing records before direct extraction occurs.

Review trigger: Revisit if a dedicated upgrade tool can provide atomic backup and merge behavior without installed dependencies.

### Decision D6: Separate Release Preparation from Release Approval

Local work may update version metadata, build the artifact, calculate the checksum, and verify release readiness. Tagging, pushing, drafting through GitHub, and publishing require explicit maintainer approval.

Rationale: Technical releasability and public exposure are separate decisions.

### Decision D7: Treat Display Order as Guidance

Templates use a stable human-readable field order, but JSON Schema validation does not make YAML property order semantic.

Rationale: Order improves scanning, but rejecting an otherwise valid record for property order adds friction without protecting behavior.

Review trigger: Revisit if a downstream format or tool develops a real order-dependent contract.

### Decision D8: Keep Local Instructions Subordinate

`local/AGENTS.md` may add machine-specific setup facts and preferences. It cannot weaken shared safety, lifecycle, authority, or repository instructions.

Rationale: A local overlay is useful only when it cannot silently replace the common collaboration contract.

Review trigger: Revisit if the repository adopts a formal instruction-precedence system that already defines this relationship.

### Decision D9: Name the Installation Asset Explicitly

Every active user-facing installation surface says to download `agents-feedback-vX.Y.Z.zip`. It describes `.zip.sha256` as optional checksum metadata and never as an installable archive.

Rationale: A release with two similarly named assets must provide one obvious starting point.

Review trigger: Revisit if the release distribution format or asset set changes.

## Final Record Contract

### Required Capture Fields

```yaml
schema: feedback-record.v1
id: fb-YYYYMMDD-HHMMSS-short-slug
summary: ""
observation: ""
paths:
  - .
created: "YYYY-MM-DDTHH:MM:SSZ"
updated: "YYYY-MM-DDTHH:MM:SSZ"
safety: unreviewed
```

The required fields capture identity, a scan line, factual observation, repository scope, time, and explicit safety state.

### Optional Analysis and Triage Fields

```yaml
area: setup
kind: environment
severity: medium
evidence: ""
impact: ""
environment:
  os: windows
  shell: powershell
  architecture: x64
  tools:
    node: "24"
occurrences: 2
hypothesis: ""
confidence: medium
reproduction: ""
actions:
  - id: action-1
    action: ""
    reason: ""
    effort: low
    risk: low
decision:
  status: accepted
  reviewer: maintainer
  reason: ""
  action: action-1
links:
  - issue-or-record-reference
plan:
  schema: feedback-plan.v1
  owner: agent
  tasks:
    - id: task-1
      task: ""
      status: planned
      validation: ""
completed: "YYYY-MM-DDTHH:MM:SSZ"
```

The schema permits unreviewed drafts. Operational instructions prohibit committing or handing off an unreviewed shared record.

### Folder Invariants

| Folder | Decision | Completion | Classification |
| --- | --- | --- | --- |
| `new` | Absent | Absent | Unknown values allowed |
| `planned` | Accepted | Absent | Area, kind, and severity should be known |
| `in_progress` | Accepted | Absent | Area, kind, and severity should be known |
| `in_review` | Accepted | Absent | Area, kind, and severity should be known |
| `completed` | Accepted | Required | Safety must be `public` or permitted `internal` |
| `archived` | Declined, duplicate, obsolete, transferred, or retained | Absent | Duplicate and transferred records require links |

## Final Plan Contract

```yaml
schema: feedback-plan.v1
owner: agent
tasks:
  - id: task-1
    task: ""
    status: planned
    validation: ""
# outcome: ""
```

Plans are flat. One to seven tasks is the preferred size, but the schema does not make an eighth task invalid. Work that needs broad coordination, several sessions, or architecture decisions moves to normal repository planning and is linked from the record.

## Shared and Local Collaboration Model

### Shared Scope

Shared records live under `.agents/feedback/records/<lifecycle>/` and are normally committed. Machine-related shared records use generalized `environment` values and repository-relative `/` paths.

### Local Scope

The scaffold contains `local/README.md` and `local/.gitignore`. Personal content such as `local/AGENTS.md` and `local/records/` remains ignored.

Operational orientation reads `local/AGENTS.md` when present. The state helper includes local records by default and labels their scope. `--shared-only` excludes local records for CI and team reports.

Local instructions are additive and lower priority than root repository instructions and shared scaffold rules. Local files must remain secret-free even though Git ignores them.

Shared records may use `safety: internal` only when repository visibility and policy explicitly permit internal material. Public repositories use `safety: public` for committed records.

### Promotion

Promotion from local to shared is explicit. Sanitize and generalize the observation, remove machine identity and absolute paths, set an allowed shared safety value, and then create or update the matching shared record.

### Merge Behavior

Do not create a shared generated index or shared global counter. Record files are the merge unit. Concurrent changes to the same observation should produce a visible merge decision instead of silent overwrite.

## State Helper Contract

### Supported Options

```text
--root <path>
--format text|json
--status <status>
--implemented
--stale-days <number>
--active
--brief
--area <area>
--path <path>
--shared-only
--help
```

### Selection Rules

`--active` selects `new`, `planned`, `in_progress`, and `in_review`. It conflicts with `--status` and `--implemented`.

`--area` and `--path` use AND semantics. Area comparison is case-normalized exact matching. Path comparison supports exact, ancestor, and descendant matches on segment boundaries.

The helper scans shared and local records by default. Every normalized record contains `scope: shared` or `scope: local`. `--shared-only` disables local scanning.

### Brief Output

Brief records sort by severity, updated time, ID, and scope. Missing optional classification values normalize to `unknown`.

```text
Feedback
- [shared:new] fb-20260710-120000-node-check | setup | medium | Installer verification needs a Node-free path. | records/new/fb-20260710-120000-node-check.yaml
```

### Attention Checks

- Detect missing required capture fields.
- Detect duplicate IDs across shared and local records.
- Detect unreviewed safety.
- Detect stale active records.
- Detect invalid lifecycle and decision combinations.
- Detect accepted decisions that do not select an existing action.
- Detect duplicate or transferred decisions without links.
- Detect completion outside `completed` or missing within it.
- Detect absolute paths, parent traversal, backslashes, and empty path lists.
- Detect unknown classification after the `new` lifecycle.
- Detect missing evidence for accepted or completed records.
- Detect missing completion evidence or unfinished inline plans for completed records.
- Detect duplicate action identifiers.

Attention is informational and does not change a successful analysis exit code.

## Installation and Upgrade Contract

### Fresh Installation

Extract the artifact at the target repository root, point an agent to `.agents/feedback/AGENTS.md`, add or update the bounded root hook, verify automatically with Node.js 22 or newer or manually without Node.js, and enter operational mode only after verification.

### Existing Installation

Never extract directly over an existing `.agents/feedback`. Extract into a temporary directory, point an agent to the staged `UPGRADE.md`, preserve `records/` and `local/`, replace only managed scaffold files, update the bounded root hook, and verify before restoring operational mode.

### Root Hook

Keep the managed root hook short. It should direct agents to operational instructions before substantial or unfamiliar work and before feedback lifecycle operations. CLI details remain in `.agents/feedback/AGENTS.md`.

## Work Packages

### WP1: Lock the Contract in Tests

Depends on: None.

Files: Schema fixtures, contract tests, installer tests, and state tests.

Acceptance: New tests describe the final v1 record, plan, local overlay, CLI, installer, upgrade, and artifact behavior before implementation changes make them pass.

### WP2: Implement Schemas and Templates

Depends on: WP1.

Files: `record.schema.json`, `plan.schema.json`, `record.yaml`, and `plan.yaml`.

Acceptance: Complete valid fixtures pass Ajv validation, invalid fixtures fail for the intended reason, and templates match the sole v1 contracts.

### WP3: Implement Operational and Collaboration Instructions

Depends on: WP2.

Files: Scaffold `AGENTS.md`, `AGENTS.final.md`, `README.md`, `INSTALL.md`, `UPGRADE.md`, `records/README.md`, root hook, local README, and local ignore file.

Acceptance: A fresh agent can consume relevant shared and local feedback, capture or update records, respect triage authority, promote durable knowledge, and preserve local boundaries.

### WP4: Implement State Discovery

Depends on: WP2 and WP3.

Files: `feedback-state.mjs` and state fixtures.

Acceptance: The dependency-free helper implements all documented filters, scope labeling, sorting, normalization, and attention checks on Windows and POSIX-style repository paths.

### WP5: Implement Installation and Staged Upgrade Validation

Depends on: WP3 and WP4.

Files: Installer tests, upgrade tests, and artifact layout tests.

Acceptance: Fresh installation has automated and manual paths. Existing installation guidance prevents direct overwrite and preserves shared records, local content, and unrelated root instructions.

### WP6: Strengthen Repository Validation

Depends on: WP2 through WP5.

Files: `package.json`, lockfile, contract validator, fixtures, and test suite.

Acceptance: Pinned repository-only dependencies validate complete YAML instances against JSON Schema and do not enter the release artifact.

### WP7: Update Product and Release Documentation

Depends on: WP2 through WP6.

Files: Root README, CONTRIBUTING, AGENTS, specification, changelog, release notes, release process documentation, and this plan.

Acceptance: Active documentation describes one schema, shared and local scope, Node-optional installation, staged upgrades, state discovery, and the v1.1.0 release boundary consistently.

### WP8: Prepare and Audit the Release Candidate

Depends on: WP7.

Files: Package metadata, staged artifact, ZIP, checksum, and artifact manifest.

Acceptance: Focused tests and `npm run release:check` pass, two artifact builds have identical hashes, extracted contents match the manifest, installed files are dependency-free, and no publication action occurs.

## Test Strategy

| Test ID | Behavior | Evidence |
| --- | --- | --- |
| T1 | Valid record and plan fixtures | Ajv and YAML validation tests |
| T2 | Invalid path, safety, decision, hypothesis, and plan fixtures | Intended schema failure assertions |
| T3 | Folder lifecycle invariants | State attention tests |
| T4 | Active, brief, area, path, status, and implemented filters | CLI tests |
| T5 | Shared and local default discovery | Scope fixture tests |
| T6 | Shared-only discovery | CLI tests |
| T7 | Duplicate ID and action reference detection | Attention tests |
| T8 | Node and manual fresh installation wording | Installer instruction tests |
| T9 | Staged upgrade and preservation wording | Upgrade instruction tests |
| T10 | Short bounded root hook | Exact marker and content tests |
| T11 | Artifact allowlist and local boundary | Artifact tests |
| T12 | Reproducible ZIP and checksum | Two-build hash test |
| T13 | Release-note structure for v1.1.0 | Release-note tests |
| T14 | Full release candidate | `npm run release:check` |
| T15 | Extracted artifact behavior | Temporary-directory smoke verification |
| T16 | Local ignore boundary and instruction precedence | Temporary Git repository test and instruction contract test |
| T17 | Bounded parser behavior for quoted scalars, arrays, nested decisions, and ignored multiline analysis | State parser fixtures |
| T18 | User-facing asset selection | README, release-note, support, specification, and release-process contract tests |

## Traceability Matrix

| Trace | Requirement | Decision | Implementation | Validation | Status |
| --- | --- | --- | --- | --- | --- |
| TR1 | Single final schema | D1 | Schemas and templates | T1, T2 | Validated |
| TR2 | Folder-authoritative lifecycle | D2 | Record schema and state helper | T3 | Validated |
| TR3 | Consume before create | D2 | Root hook and operational instructions | T4, T10 | Validated |
| TR4 | Shared and local collaboration | D3 | Local overlay and state scope | T5, T6, T11 | Validated |
| TR5 | Dependency-free installed helper | D4 | State parser | T4, T5, T6, T7 | Validated |
| TR6 | Safe existing installation path | D5 | Upgrade instructions | T9, T15 | Validated |
| TR7 | Node-optional installation | D4 | Installer instructions | T8, T15 | Validated |
| TR8 | Verified v1.1.0 artifact | D6 | Build and release tooling | T12, T13, T14, T15 | Validated |
| TR9 | Non-semantic property order | D7 | Templates and validator | T1, T2 | Validated |
| TR10 | Local instruction precedence | D8 | Operational and local instructions | T16 | Validated |
| TR11 | Clear user starting asset | D9 | Public documentation surfaces | T18 | Validated |

## Risk Register

| Risk | Probability | Impact | Mitigation | Verification |
| --- | --- | --- | --- | --- |
| Bounded YAML parser misreads valid records | Medium | High | Limit state semantics, use generated fixtures, and keep full validation separate | T4, T5, T7 |
| Local content enters commits or artifacts | Medium | High | Track ignore boundary, label scope, add artifact allowlist | T5, T6, T11 |
| Local instructions override shared safety or authority | Medium | High | Define additive lower precedence and test installed wording | T16 |
| Direct extraction overwrites existing data | Medium | High | Require staged upgrades in public and installed docs | T9, T15 |
| Root hook becomes instruction-heavy | Medium | Medium | Test short exact managed content | T10 |
| Optional classification weakens discovery | Medium | Medium | Normalize to unknown and encourage classification during triage | T3, T4 |
| Concurrent occurrence updates conflict | Medium | Low | Keep occurrence count optional and use records as merge units | Documentation review |
| Repository dependencies leak into artifact | Low | High | Artifact allowlist and package exclusion | T11 |
| Artifact checksum changes between builds | Medium | High | Use fixed ZIP metadata and stable file ordering | T12 |
| Release metadata diverges from package version | Low | High | Release-note and workflow checks | T13, T14 |
| Public release occurs without approval | Low | High | Stop before tag, push, or publication | Human checkpoint audit |
| Valid multiline YAML exceeds the bounded parser | Medium | Medium | Parse only state-relevant bounded fields and ignore analysis bodies safely | T17 |

## Authority Boundary and Stop Conditions

The implementation may modify local repository source, tests, docs, package metadata, and generated release artifacts. It may install repository-only development dependencies and run local verification.

Stop before creating or pushing `v1.1.0`, changing a remote release, or publishing an artifact. Stop if implementation requires weakening safety rules, adding installed dependencies, deleting user records, overwriting user local content, or changing unrelated user work.

## Initial Plan Review

The review compared the plan with the user request, repository instructions, current source, existing tests, the external proposal bundle, and the v1.0.0 release baseline.

### Finding R1: Local Instruction Precedence Was Undefined

Risk: A per-clone `local/AGENTS.md` could be interpreted as permission to weaken shared safety or lifecycle rules.

Resolution: Added D8, explicit additive precedence, and T16.

### Finding R2: Internal Shared Records Needed a Visibility Boundary

Risk: `safety: internal` could be committed to a public repository without a clear policy check.

Resolution: Restricted committed public-repository records to `public` in operational policy. `internal` requires explicit repository visibility and policy support.

### Finding R3: Optional Evidence Could Permit Weak Accepted Records

Risk: Lightweight capture is appropriate in `new`, but accepted or completed work without evidence would weaken the learning trail.

Resolution: Kept evidence optional in the schema and added lifecycle-aware attention checks for accepted and completed records.

### Finding R4: Local Ignore Behavior Needed Executable Proof

Risk: Static inspection of `local/.gitignore` would not prove that personal files stay untracked after extraction.

Resolution: Added T16 using a temporary Git repository and artifact-extracted local files.

### Finding R5: Bounded Parser Scope Needed a Proof Boundary

Risk: Full JSON Schema validity does not imply that a dependency-free summary parser understands every YAML feature.

Resolution: Added T17. The helper parses only state-relevant scalars, string arrays, action identifiers, and decision fields. It safely ignores multiline analysis bodies that do not affect discovery.

### Finding R6: Action Identifier Uniqueness Was Not Covered

Risk: JSON Schema `uniqueItems` cannot prevent two action objects with the same `id` when their other fields differ.

Resolution: Added a state attention check for duplicate action identifiers.

### Finding R7: Upgrade Verification Cannot Prove Agent Behavior Automatically

Risk: Instruction tests can prove required wording but cannot prove that every future agent follows a staged merge correctly.

Resolution: Keep the proof claim narrow. Automated tests verify staging guidance, managed-file boundaries, artifact contents, and record and local preservation fixtures. The final smoke check follows the installed instructions in a temporary repository and records observed results.

### Finding R8: Artifact Reproducibility Needed Cross-Build Evidence

Risk: Stable file order alone is insufficient if ZIP timestamps or locale-sensitive sorting vary.

Resolution: Use fixed ZIP metadata, ordinal path sorting, two-build hash comparison, and checksum verification after extraction.

### Finding R9: Compact Markdown Tables Trigger IDE Weak Warnings

Risk: PhpStorm reports table-alignment warnings even though the CommonMark table structure is valid and repository Markdown rules do not require padded columns.

Resolution: Treat the warnings as formatting-only. Final documentation validation checks semantic table headers, ASCII content, heading hierarchy, code fence languages, and list structure.

### Finding R10: Property Order Had Not Been Explicitly De-Scoped

Risk: The external proposal made YAML property order and single-word key names validity requirements that do not reduce workflow friction.

Resolution: Added D7. Templates use a preferred order, while schema and repository validation remain semantic.

### Finding R11: Repository Dependency Approval Was Initially Unclear

Risk: The execution approval boundary initially rejected registry access for Ajv and YAML packages, so proceeding without explicit approval would have violated the authority boundary.

Resolution: Paused without bypassing the denial. The user then explicitly approved the exact registry query, and the repository installed pinned versions `ajv@8.20.0`, `ajv-formats@3.0.1`, and `yaml@2.9.0`. Artifact tests must prove that these repository-only dependencies do not ship.

### Finding R12: Release Asset Roles Were Not Obvious

Risk: Users can see both the ZIP and checksum assets without knowing which one starts installation.

Resolution: Added D9, G10, TR11, and T18. The ZIP is the only installation download. The checksum is optional verification metadata and is not extracted.

### Finding R13: CI Did Not Install New Repository Dependencies

Risk: The v1.0.0 workflows ran release checks without `npm ci` because the repository had no dependencies. Ajv and YAML validation would fail on a clean runner.

Resolution: Add `npm ci` to CI and release workflows before validation, retain the lockfile, add npm Dependabot coverage, and assert all three in contract tests.

### Finding R14: Checkout Referenced an Unreleased Major

Risk: The workflows used `actions/checkout@v7`, while the official checkout repository lists v6 as the current released major. A missing action tag would fail CI and release preparation before tests start.

Resolution: Use `actions/checkout@v6`, `actions/setup-node@v6`, and `actions/upload-artifact@v7`. Contract tests assert these majors. The versions were verified from the official action repositories on 2026-07-10.

### Finding R15: Installed Runtime Guidance Included EOL Node Versions

Risk: A `Node.js 18 or newer` minimum would direct users toward Node 18 and Node 20, which the official Node release page marks EOL.

Resolution: Require Node.js 22 or newer for automated installed-helper verification. Keep the manual structural fallback for older or unavailable Node.js. Repository validation remains on Node.js 24 LTS.

## Improved Plan Summary

The improved plan keeps one final v1 schema, strengthens accepted and completed evidence, defines local precedence and public visibility, adds executable local-ignore validation, narrows bounded-parser claims, verifies action identifiers, and requires reproducible artifact evidence. Repository-only validation dependencies are pinned and excluded from the artifact. These changes close the review gaps without expanding the installed dependency or service footprint.

## Execution and Release-Candidate Evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| Extensive plan | This task frame, decisions, work packages, tests, risks, and traceability matrix | Complete |
| Plan review | Findings R1 through R15 with recorded resolutions | Complete |
| Improved plan | Decisions D7 through D9 and revised validation, delivery, and documentation scope | Complete |
| Clean dependency install | `npm ci` with 7 packages and 0 vulnerabilities | Pass |
| Full behavior suite | `npm test` with 31 passing tests | Pass |
| Contract validation | `npm run check:contract` | Pass |
| Complete release gate | `npm run release:check` | Pass |
| Release notes | `docs/releases/v1.1.0.md` matches package `1.1.0` | Pass |
| Reproducible artifact | Two builds produced the same ZIP hash | Pass |
| ZIP checksum | SHA-256 `e36e84fe9eaaa772734ec5dce8d0b920a101dd39736fa40ac9e5151abb981166` | Pass |
| Extracted artifact | Required files present; forbidden files absent; installed state helper exits `0` | Pass |
| Source identity | Scaffold source and staged artifact have no diff | Pass |
| User start guidance | Active docs identify the ZIP as installable and checksum as optional non-extracted metadata | Pass |
| Public release | Tag, push, draft release mutation, and publication | Pending maintainer approval |

## Open Items

No user decision is required before local implementation. The final public release decision remains open and belongs to the maintainer after release-candidate evidence is available.

## Verification Checklist

- Every work package traces to the task goal and a gap item.
- Every obstacle has a planned resolution.
- Every public behavior has at least one test path.
- Every release requirement has artifact or command evidence.
- The plan distinguishes technical readiness from public release approval.
- The plan preserves the raw request and does not narrow the requested release outcome.
