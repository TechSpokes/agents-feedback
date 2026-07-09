# agents-feedback

`agents-feedback` ships a small `.agents/feedback` scaffold for repository-local agent feedback. It gives coding agents a structured place to record workflow friction, missing instructions, setup problems, tool issues, and completed efficiency improvements for the same repository.

The scaffold is not long-term memory, not a task tracker, and not canonical documentation. Durable project rules belong in the repository's normal `AGENTS.md`, README, docs, scripts, and tests.

## Quick Start

Copy `scaffold/.agents/feedback` into a target repository as `.agents/feedback`. Add the root instruction hook from `scaffold/.agents/feedback/templates/root-agents-hook.md` to the target repository's root `AGENTS.md` or equivalent agent instruction file.

After the hook is in place, replace `.agents/feedback/AGENTS.md` in the target repository with `.agents/feedback/AGENTS.final.md`. The target repository is then ready to store sanitized feedback records under `.agents/feedback/records/`.

## Installation Modes

Hooked mode is recommended. Copy `.agents/feedback`, add the root hook, and switch from bootstrap instructions to `AGENTS.final.md` so agents can discover the feedback folder reliably.

Manual mode is supported. Copy `.agents/feedback` without adding the root hook only when users will explicitly instruct agents to read `.agents/feedback/AGENTS.md`.

## Requirements

The installed scaffold has no package install, database, or background service. The optional `feedback-state.mjs` script uses only Node.js built-ins and requires Node.js 18 or newer.

Repository development checks require Node.js 18 or newer when `package.json` and tests are present. On Windows PowerShell, use `npm.cmd` if local execution policy blocks `npm.ps1`.

## Verification Commands

Run these checks before release once the tooling files are present:

```bash
npm test
npm run check:state
npm run release:check
```

Run the state script directly to inspect this repository's source scaffold:

```bash
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback --format json
```

In a target repository with an installed scaffold, use the installed path:

```bash
node .agents/feedback/tools/feedback-state.mjs --root .agents/feedback
```

## Repository Contents

- `AGENTS.md` contains repository maintenance instructions for agents.
- `CONTRIBUTING.md` describes contribution scope and verification.
- `docs/specification.md` defines the scaffold contract.
- `docs/release-v1.md` defines the v1 release scope and approval-gated publishing.
- `scaffold/.agents/feedback/` contains the installable feedback scaffold.
- `tests/` contains state script tests and fixtures when tooling exists.

## License

MIT License. See [LICENSE](LICENSE).
