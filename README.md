# agents-feedback

`agents-feedback` ships an agent-installable `.agents/feedback` scaffold. A repository owner downloads the release artifact, extracts it at a target repository root, and points an agent at `.agents/feedback/AGENTS.md`; the agent wires the repository instructions and converts the folder into operational feedback mode.

## What It Provides

The scaffold gives agents a structured repository-local place to record workflow friction, missing instructions, setup problems, verification gaps, and completed improvements that should help future agent sessions in the same repository.

Feedback records are YAML files grouped by lifecycle state. Records include a short `summary`, a full `description`, sanitized `evidence`, `impact`, one or more `suggested_actions`, and an optional plan used for implementation and progress tracking.

## Installation Flow

1. Download the release artifact named `agents-feedback-vX.Y.Z.zip`.
2. Extract it at the target repository root so `.agents/feedback/AGENTS.md` exists.
3. Ask an agent to read `.agents/feedback/AGENTS.md` and complete installation.
4. Review the root instruction change made by the agent.

## Agent Installer

The bootstrap `AGENTS.md` in `.agents/feedback` is the installer entrypoint. It instructs the agent to read `INSTALL.md`, add or update the managed root hook, verify the scaffold, and replace itself with `AGENTS.final.md` after installation succeeds.

The installed scaffold has no package install, database, or background service. The optional `feedback-state.mjs` script uses only Node.js built-ins and requires Node.js 18 or newer in target repositories.

## Repository Development

Repository checks use Node.js 24. On Windows PowerShell, use `npm.cmd` if local execution policy blocks `npm.ps1`.

Run the release checks before requesting release approval:

```bash
npm test
npm run check:contract
npm run release:notes
npm run check:state
npm run artifact:check
npm run release:check
```

Run the state script directly to inspect this repository's source scaffold:

```bash
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback --format json
```

## Repository Contents

- `AGENTS.md` contains repository maintenance instructions for agents.
- `CHANGELOG.md` records public product releases only.
- `CONTRIBUTING.md` describes contribution scope and verification.
- `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md` define public repository support and conduct policy.
- `.github/` contains CI, release automation, CODEOWNERS, Dependabot, issue templates, and the pull request template.
- `docs/specification.md` defines the scaffold contract.
- `docs/releases/README.md` defines release note file requirements and the draft release workflow.
- `docs/releases/v1.0.0.md` defines the v1 release body used for the draft GitHub Release.
- `scaffold/.agents/feedback/` contains the source scaffold used to build release artifacts.
- `tests/` contains state, contract, installer, and artifact tests.

## Boundaries

The scaffold is not long-term memory, not a general task tracker, not a project changelog, and not canonical project documentation. Durable rules belong in the repository's normal `AGENTS.md`, README, docs, scripts, and tests.

Never store secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs in feedback records.

## License

MIT License. See [LICENSE](LICENSE).
