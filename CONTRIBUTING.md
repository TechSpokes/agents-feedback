# Contributing

This repository accepts improvements to the `.agents/feedback` installer scaffold, schemas, templates, state helper, local overlay, artifact tooling, tests, and documentation.

## Scope

Changes must preserve the portable learning-loop contract. A fresh release artifact installs by extraction and agent guidance. Existing installations upgrade from a temporary staging directory.

Keep the installed scaffold dependency-free. Repository-only development dependencies are allowed when artifact tests prove that they do not ship.

Keep feedback focused on repository workflow improvement. Promote durable rules into canonical repository files instead of expanding feedback into long-term memory, a task tracker, or a documentation replacement.

## Development

Use Node.js 24 for repository checks.

```bash
npm install
npm test
npm run check:contract
npm run release:notes
npm run check:state
npm run artifact:check
npm run release:check
```

Run focused checks while implementing, then run the complete release gate before requesting release approval.

## Contract Changes

Update `docs/specification.md` in the same change when lifecycle, record fields, plan fields, local scope, state output, installer behavior, upgrade behavior, or artifact layout changes.

Keep one supported record schema and one supported plan schema until a released installed base makes compatibility necessary. Do not introduce dispatchers or migrations without evidence that stored records require them.

## Markdown

Active Markdown uses one H1, ASCII punctuation, labeled code fences, heading-based structure, and flat atomic lists. Do not use nested lists or bold text as headings.

## Pull Request Checklist

- The installed scaffold remains dependency-free.
- The installed scaffold requires no target package installation.
- The installed scaffold requires no database or background service.
- Fresh installation and staged upgrade instructions remain distinct.
- Shared records and ignored local content remain separate.
- Local instructions cannot weaken shared safety or authority.
- Schemas, templates, fixtures, state output, and docs remain aligned.
- The artifact contains no repository dependencies, tests, shared records, or personal local content.
- Examples contain no secrets, credentials, private logs, customer data, private issue text, screenshots, large logs, or private tokens.
- `npm run release:check` passes.

## Release Actions

Do not publish a release without explicit maintainer approval. Pushing an approved `v*` tag creates or updates a draft GitHub Release with attached artifacts; the maintainer reviews and publishes that draft.

## Public Repository Channels

Use GitHub Discussions for usage questions, installation questions, ideas, and design discussion. Use GitHub Issues for reproducible bugs and concrete feature requests. Use `SECURITY.md` for vulnerabilities or sensitive reports.

`CHANGELOG.md` records public product releases only. Do not use it as a changelog for implemented feedback records.
