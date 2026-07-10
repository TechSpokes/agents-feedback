# Getting Started

Install `agents-feedback` by adding one isolated `.agents/feedback` subtree and asking a coding agent to complete a bounded repository setup. The release does not replace or manage sibling content already stored under `.agents`.

The installed folder has no package dependencies, account, service, database, or daemon.

## Before You Install

Choose a target repository where an agent can read and update repository instruction files. Node.js is optional for installation; Node.js 22 or newer enables automated verification and the state helper.

Check the target before extracting anything:

| Target state | Installation path |
| --- | --- |
| No `.agents` directory | Fresh installation |
| `.agents` exists without `feedback` | Fresh installation; existing sibling content remains untouched |
| `.agents/feedback` exists | Staged upgrade |

The ZIP contains only `.agents/feedback`. If `.agents/feedback` already exists, the pre-extraction state is uncertain, or the extraction tool asks to replace a file or directory, cancel and follow [Upgrade an Existing Installation](#upgrade-an-existing-installation).

Starting from a clean Git working tree is recommended because it makes the added folder and bounded root instruction change easy to review.

## Why the ZIP Includes `.agents/feedback`

Every archive entry begins with `.agents/feedback/`. This makes the repository root the one consistent extraction target whether `.agents` already exists or not.

The ZIP contains no sibling files such as `.agents/AGENTS.md` and no unrelated repository-root files. A ZIP rooted at `feedback/` would require users to select `.agents` as the extraction target; extracting it at the repository root would incorrectly create `feedback/` there.

## Download the Installation ZIP

Open the [latest GitHub release](https://github.com/TechSpokes/agents-feedback/releases/latest) and download `agents-feedback-vX.Y.Z.zip`.

Release pages also contain `agents-feedback-vX.Y.Z.zip.sha256`. That file is optional checksum metadata. Do not extract it or choose it instead of the ZIP.

## Verify the Download

Verification is optional. Place the ZIP and `.zip.sha256` file in the same directory.

On Linux or macOS, run:

```bash
sha256sum --check agents-feedback-vX.Y.Z.zip.sha256
```

On Windows PowerShell, compare the two displayed hashes:

```powershell
Get-FileHash .\agents-feedback-vX.Y.Z.zip -Algorithm SHA256
Get-Content .\agents-feedback-vX.Y.Z.zip.sha256
```

## Install in a New Repository

1. Extract `agents-feedback-vX.Y.Z.zip` at the target repository root.
2. Confirm that `.agents/feedback/AGENTS.md` exists.
3. Give your coding agent the following instruction.

```text
Read .agents/feedback/AGENTS.md and complete the fresh installation. Preserve all existing repository instructions.
```

Normal extraction merges the ZIP's `.agents/feedback` entries into an existing `.agents` directory without touching sibling content that is not present in the ZIP. Stop instead of approving an overwrite prompt.

The agent confirms fresh-install eligibility, adds one bounded hook to the root instruction surface, verifies the scaffold, and switches `.agents/feedback/AGENTS.md` from installer mode to operational mode. It must preserve unrelated root instructions.

## Confirm Installation

Installation is complete when the root instruction surface contains one block between `agents-feedback:start` and `agents-feedback:end`, and `.agents/feedback/AGENTS.md` contains operational instructions.

With Node.js 22 or newer, run:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief --shared-only
```

Exit code `0` confirms that the helper could inspect the installed structure. Reported attention items describe records that need review; they do not mean installation failed.

Without Node.js, confirm that the instruction files, schemas, templates, tool, local boundary, and six shared lifecycle folders exist. The installing agent performs this fallback automatically.

## Start a Task with Relevant Feedback

The managed root hook asks future agents to inspect feedback before substantial or unfamiliar work. You can also make the request explicit:

```text
Before starting, inspect active feedback relevant to this task. Treat feedback as observations and decision history, not as canonical instructions.
```

The shortest useful command is:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief
```

Narrow larger repositories by area or path:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief --area tests
node .agents/feedback/tools/feedback-state.mjs --active --brief --path packages/api
```

## Capture Useful Feedback

Ask the agent to search active shared and local records before creating anything. A matching record should receive the new evidence, path, timestamp, and occurrence count.

New observations begin under `.agents/feedback/records/new/` for shared feedback or `.agents/feedback/local/records/new/` for ignored per-clone feedback. Use `.agents/feedback/templates/record.yaml` as the starting point.

Records describe what happened in `observation`. Possible explanations belong in `hypothesis` with `confidence`, so future agents can distinguish evidence from analysis.

## Choose Shared or Local Scope

Use shared records for sanitized observations that should help every clone. Commit them only after their safety state matches repository visibility.

Use `.agents/feedback/local/` for secret-free machine context and observations that should not enter shared history. Local files are ignored by Git, but the same safety boundary still applies.

Promote a local observation when it becomes useful to the team. Remove usernames, hostnames, device identifiers, and absolute paths; generalize environment details; review safety; then update or create the matching shared record.

## Complete the Learning Loop

Feedback is complete only after the durable lesson moves into normal repository instructions, documentation, scripts, tests, or code. The completed record points to that durable location and preserves sanitized evidence of why the change was needed.

The containing folder is the lifecycle state:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

## Upgrade an Existing Installation

Never extract a new release directly over an existing `.agents/feedback` folder. Direct extraction can replace records or local content before instructions have a chance to protect them.

1. Extract the new ZIP into a temporary staging directory outside the installed `.agents/feedback` folder.
2. Give your agent the path to the staged `.agents/feedback/UPGRADE.md`.
3. Ask the agent to follow that file and preserve all shared records, local content, and unrelated root instructions.
4. Review the agent's preservation and verification report before deleting the staging directory.

## Troubleshooting

### The Download Contains Only Checksum Text

You downloaded `.zip.sha256`. Return to the release and download the file whose name ends with `.zip`.

### The Extracted Folder Is Nested Too Deeply

Extract again at the repository root so the final path is `.agents/feedback/AGENTS.md`, not `agents-feedback-vX.Y.Z/.agents/feedback/AGENTS.md`. Some file browsers hide names that begin with a dot, so verify the path from the repository root or terminal.

### The Repository Already Has Feedback Records

Stop the fresh installation. Use the staged upgrade path so existing records and local files remain intact.

### Node.js Is Missing or Too Old

Continue with the manual structural verification in `.agents/feedback/INSTALL.md`. The scaffold remains usable, but the state helper requires Node.js 22 or newer.

### The State Helper Reports Attention Items

Installation can still be valid. Attention items identify records with missing fields, stale work, lifecycle mismatches, or incomplete review and should be handled separately.

### The Root Repository Already Has AGENTS.md

Keep it. The installer adds or updates only the bounded `agents-feedback` block and preserves all unrelated instructions.

### Local Feedback Does Not Appear in Git Status

That is expected. `.agents/feedback/local/` is an ignored per-clone boundary; promote useful observations explicitly when they should become shared.

## Next Steps

- Read the [documentation index](README.md) to find user, contributor, and maintainer references.
- Read the [scaffold specification](specification.md) when you need the complete contract.
- Use [GitHub Discussions](https://github.com/TechSpokes/agents-feedback/discussions) for installation and usage questions.
- Use [GitHub Issues](https://github.com/TechSpokes/agents-feedback/issues) for reproducible bugs and concrete feature requests.
