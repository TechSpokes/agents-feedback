# agents-feedback

`agents-feedback` ships an agent-installable `.agents/feedback` learning loop. It helps humans and coding agents discover repository workflow friction before repeating it, capture sanitized observations, and promote durable improvements into normal repository artifacts.

## Start Here

On the GitHub Release page, download `agents-feedback-vX.Y.Z.zip`. This ZIP is the installation artifact.

The neighboring `agents-feedback-vX.Y.Z.zip.sha256` file is optional checksum metadata for verifying the ZIP. Do not extract the checksum file.

## Optional Checksum Verification

On Linux or macOS, place both assets in the same directory and run:

```bash
sha256sum --check agents-feedback-vX.Y.Z.zip.sha256
```

On Windows PowerShell, compare the hash and checksum text:

```powershell
Get-FileHash .\agents-feedback-vX.Y.Z.zip -Algorithm SHA256
Get-Content .\agents-feedback-vX.Y.Z.zip.sha256
```

## What It Provides

The scaffold provides shared lifecycle records, an ignored per-clone boundary, concise record and plan schemas, agent installation instructions, and a dependency-free state helper.

Feedback is evidence and decision history. It does not replace repository instructions, documentation, tests, issues, or project planning.

## Shared and Local Feedback

Shared records live under `.agents/feedback/records/` and are normally committed. They use repository-relative paths and generalized environment context so developers on different machines can collaborate safely.

Ignored per-clone additions live under `.agents/feedback/local/`. A developer may add secret-free `local/AGENTS.md` instructions and local lifecycle records without committing them. Local instructions are additive and cannot weaken root or shared rules.

Useful local observations are promoted explicitly: sanitize and generalize the content, remove machine identity and absolute paths, review the safety state, and create or update the matching shared record.

## Feedback Loop

```text
inspect relevant active feedback
-> perform repository work
-> update a matching observation or capture a new one
-> triage an improvement
-> implement or transfer the work
-> promote durable knowledge
-> help the next agent avoid the same friction
```

## Fresh Installation

1. Download the `agents-feedback-vX.Y.Z.zip` installation artifact, not the `.zip.sha256` checksum file.
2. Extract it at the target repository root so `.agents/feedback/AGENTS.md` exists.
3. Ask an agent to read `.agents/feedback/AGENTS.md` and complete installation.
4. Review the bounded root instruction change.

Node.js 22 or newer enables automated verification. The installer includes a structural fallback when Node.js is unavailable or older.

## Existing Installation

Never extract a new artifact directly over an existing `.agents/feedback`. Extract it into a temporary staging directory and ask an agent to read the staged `.agents/feedback/UPGRADE.md`.

The staged workflow preserves shared records, ignored local content, and unrelated root instructions while replacing only managed scaffold files.

## Record and Plan Contracts

New records use the sole `feedback-record.v1` contract. Initial capture requires identity, summary, factual observation, affected repository paths, timestamps, and explicit safety state. Analysis, environment context, recurrence, actions, decisions, links, plans, and completion are optional until useful.

Lifecycle comes only from the containing folder:

```text
new -> planned -> in_progress -> in_review -> completed
any state -> archived
```

Inline `feedback-plan.v1` plans contain flat tasks. One to seven tasks is preferred; larger work belongs in the repository's normal issue or planning system.

## State Helper

Run relevant orientation after installation:

```bash
node .agents/feedback/tools/feedback-state.mjs --active --brief
node .agents/feedback/tools/feedback-state.mjs --active --brief --path packages/api
node .agents/feedback/tools/feedback-state.mjs --active --brief --area tests
node .agents/feedback/tools/feedback-state.mjs --active --brief --shared-only
```

The installed helper uses Node.js built-ins only. It scans shared and local records by default and labels their scope.

## Repository Development

Repository checks use Node.js 24 and repository-only validation dependencies. On Windows PowerShell, use `npm.cmd` when local execution policy blocks `npm.ps1`.

```bash
npm install
npm run release:check
npm run artifact:build
```

The release artifact excludes `package.json`, `node_modules`, test fixtures, user feedback records, and personal local content.

## Repository Contents

- `AGENTS.md` contains scaffold maintenance instructions.
- `docs/specification.md` defines the authoritative scaffold contract.
- `docs/releases/` contains release body sources.
- `scaffold/.agents/feedback/` contains the source scaffold.
- `scripts/` contains repository validation and artifact tooling.
- `tests/` contains contract, state, installer, release-note, and artifact tests.
- `CHANGELOG.md` records public product releases only.

## Boundaries

The scaffold is not long-term memory, a general task tracker, canonical project documentation, or a project changelog.

Never store secrets, credentials, raw private logs, customer data, private tokens, private issue text, screenshots, or large logs in shared or local feedback.

## License

MIT License. See [LICENSE](LICENSE).
