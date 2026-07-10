# agents-feedback

Give coding agents a durable way to learn from repository friction instead of rediscovering it in every session.

`agents-feedback` adds a small, dependency-free `.agents/feedback` folder to a repository. It does not take ownership of the rest of `.agents`; the release ZIP contains only `.agents/feedback`, and installation changes the root instruction file only through one bounded managed block.

Humans and agents use the folder to find relevant workflow observations before work, capture new evidence safely, and turn repeated friction into better instructions, documentation, scripts, tests, or code.

- [Download the latest release](https://github.com/TechSpokes/agents-feedback/releases/latest)
- [Read the getting-started guide](docs/getting-started.md)
- [Browse the documentation](docs/README.md)

## Install in Three Steps

Use fresh installation only when `.agents/feedback` does not exist. An existing `.agents` directory is fine: extraction adds the `feedback` subtree and leaves sibling files and directories outside the ZIP untouched. If `.agents/feedback` exists or the extraction tool asks to replace anything, cancel and follow the [staged upgrade guide](docs/getting-started.md#upgrade-an-existing-installation).

The ZIP deliberately includes the `.agents/feedback` path so the extraction target can be the repository root. A ZIP rooted only at `feedback/` would require extracting into `.agents` and would create the wrong path when extracted at the repository root. See [Why the ZIP Includes `.agents/feedback`](docs/getting-started.md#why-the-zip-includes-agentsfeedback).

1. Open the [latest release](https://github.com/TechSpokes/agents-feedback/releases/latest) and download `agents-feedback-vX.Y.Z.zip`.
2. Extract the ZIP at the repository root so the new path is `.agents/feedback/AGENTS.md`.
3. Give your coding agent the following instruction.

```text
Read .agents/feedback/AGENTS.md and complete the fresh installation. Preserve all existing repository instructions.
```

That is the complete target-repository setup. There is no package to install, account to create, database to run, or background service to maintain.

The [getting-started guide](docs/getting-started.md) is the source of truth for human installation, first use, upgrades, and troubleshooting.

Node.js 22 or newer enables automated installation verification and the optional state helper. When Node.js is unavailable, the installer gives the agent a structural verification path.

Already using `agents-feedback`? Follow the [staged upgrade guide](docs/getting-started.md#upgrade-an-existing-installation). Never extract a new release directly over an existing `.agents/feedback` folder.

## Verify the Download (Optional)

The neighboring `agents-feedback-vX.Y.Z.zip.sha256` asset is optional checksum metadata, not an installation archive. Do not extract it. Follow [Verify the Download](docs/getting-started.md#verify-the-download) when you want to check the ZIP.

## What Problem It Solves

Repository instructions usually describe the current rules, but they rarely preserve the small failures that reveal which rule, command, or verification step needs improvement. As a result, agents can repeat the same setup mistake, tool misuse, missing check, or environment-specific workaround.

`agents-feedback` separates that learning trail from canonical instructions. Feedback records hold sanitized observations and decision history; durable fixes still belong in the repository files that people and agents normally trust.

## How the Loop Works

```text
inspect relevant feedback
-> do the repository work
-> capture or update an observation
-> choose and implement an improvement
-> promote the durable lesson
-> help the next human or agent
```

Lifecycle is visible from folders rather than hidden in record fields:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

Agents search for a matching observation before creating a record. Repeated evidence strengthens one record instead of producing duplicates.

## Use It After Installation

Ask an agent to inspect feedback as part of normal repository orientation:

```text
Before starting this task, read the repository instructions and inspect active feedback relevant to the files and area we will change.
```

Humans and agents can also run the dependency-free state helper directly:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief
node .agents/feedback/tools/feedback-state.mjs --active --brief --path packages/api
node .agents/feedback/tools/feedback-state.mjs --active --brief --area tests
```

The root repository hook keeps this behavior discoverable for future sessions. Detailed feedback rules stay inside `.agents/feedback/AGENTS.md` so the root instruction file remains short.

## Collaborate Without Sharing Machine Details

| Scope | Location | Git behavior | Intended content |
| --- | --- | --- | --- |
| Shared | `.agents/feedback/records/` | Normally committed | Sanitized repository-wide observations |
| Local | `.agents/feedback/local/` | Ignored per clone | Secret-free machine context and local observations |

Local instructions can add machine-specific facts or preferences, but they cannot weaken repository rules. Promote useful local observations by removing machine identity and absolute paths, generalizing the evidence, reviewing safety, and updating the matching shared record.

## What Gets Installed

```text
.agents/feedback/
  AGENTS.md              agent operating instructions
  README.md              installed-folder guide
  records/               shared lifecycle records
  local/                 ignored per-clone additions
  schemas/               record and plan contracts
  templates/             safe starting points
  tools/feedback-state.mjs
```

The installed scaffold uses Node.js built-ins only. Repository development dependencies, tests, release scripts, shared records, and personal local files are excluded from the release ZIP.

## Safety and Scope

Never store secrets, credentials, raw private logs, customer data, private issue text, screenshots, large logs, private tokens, usernames, hostnames, or absolute machine paths in feedback.

The scaffold is not long-term memory, a task tracker, canonical project documentation, or a project changelog. It exists to turn observed repository friction into durable improvements.

## Documentation

- [Getting started](docs/getting-started.md) covers installation, first use, upgrades, and troubleshooting.
- [Documentation index](docs/README.md) routes users, contributors, and maintainers to the right source.
- [Scaffold specification](docs/specification.md) defines the authoritative installed contract.
- [Changelog](CHANGELOG.md) summarizes public product releases.
- [Support](SUPPORT.md) explains where to ask questions or report problems.
- [Security policy](SECURITY.md) explains how to report sensitive issues.
- [Contributing](CONTRIBUTING.md) explains repository development and release checks.

## Repository Development

Maintenance is separate from using the installed scaffold. Contributors need Node.js 24 and run:

```bash
npm ci
npm run release:check
```

Build the reproducible release artifact with `npm run artifact:build` after the release check passes.

## License

MIT License. See [LICENSE](LICENSE).
