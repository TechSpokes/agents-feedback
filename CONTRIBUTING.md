# Contributing

This repository accepts improvements to the `.agents/feedback` installer scaffold, schemas, templates, state script, release artifact tooling, tests, and documentation.

## Scope

Changes must preserve the v1 portability contract. The installed scaffold must work after a release artifact is extracted into a target repository and an agent is pointed at `.agents/feedback/AGENTS.md`.

Keep scope narrow. Promote durable project rules into canonical repository files instead of expanding feedback records into long-term memory, a task tracker, or a documentation replacement.

## Development

Use small changes that keep the scaffold easy to inspect and release as an artifact. Do not add dependencies to the installed scaffold.

Repository-only validation tooling may exist outside `scaffold/.agents/feedback`. For v1, prefer Node.js built-ins unless a dependency meaningfully improves contract validation without entering the release artifact.

## Verification

Run these checks when relevant tooling exists:

```bash
npm test
npm run check:contract
npm run release:notes
npm run check:state
npm run artifact:check
npm run release:check
```

Run focused checks when changing only documentation. At minimum, inspect Markdown for one H1, ASCII-only content, fenced code block language identifiers, and no nested lists in active docs.

## Pull Request Checklist

- The installed scaffold remains dependency-free.
- The installed scaffold requires no target-repository package install.
- The installed scaffold requires no database.
- The installed scaffold requires no background service.
- Agent-assisted installation remains the only supported v1 installation model.
- `npm test` passes when tests are present.
- `npm run check:contract` passes when contract validation is present.
- `npm run release:notes` passes when release note validation is present.
- `npm run check:state` passes when the state script is present.
- `npm run artifact:check` passes when artifact tooling is present.
- Documentation describes any user-visible behavior changes.
- Examples contain no secrets, credentials, private logs, customer data, private issue text, screenshots, large logs, or private tokens.

## Release Actions

Do not publish a release without explicit maintainer approval. Pushing an approved `v*` tag creates a draft GitHub Release with attached artifacts; the maintainer reviews and publishes that draft.

## Public Repository Channels

Use GitHub Discussions for usage questions, installation questions, ideas, and design discussion. Use GitHub Issues for reproducible bugs and concrete feature requests. Use `SECURITY.md` for vulnerabilities or sensitive reports.

`CHANGELOG.md` records public product releases only. Do not use it as a changelog for implemented feedback records.
