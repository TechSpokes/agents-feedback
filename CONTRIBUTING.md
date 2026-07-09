# Contributing

This repository accepts improvements to the `.agents/feedback` scaffold, schemas, templates, state script, tests, and documentation.

## Scope

Changes must preserve the v1 portability contract. The installed scaffold must work after copying files into a target repository, without requiring package installation, a database, or a background service.

Keep scope narrow. Promote durable project rules into canonical repository files instead of expanding feedback records into long-term memory, a task tracker, or a documentation replacement.

## Development

Use small changes that keep the scaffold easy to inspect and copy. Do not add dependencies to the installed scaffold.

For v1, the state script must use Node.js built-ins only. Repository tests may use Node.js built-in test support.

## Verification

Run these checks when the relevant tooling exists:

```bash
npm test
npm run check:state
npm run release:check
```

Run focused checks when changing only documentation. At minimum, inspect Markdown for one H1, ASCII-only content, fenced code block language identifiers, and no nested lists.

## Pull Request Checklist

- The installed scaffold remains dependency-free.
- The installed scaffold requires no target-repository package install.
- The installed scaffold requires no database.
- The installed scaffold requires no background service.
- `npm test` passes when tests are present.
- `npm run check:state` passes when the state script is present.
- Documentation describes any user-visible behavior changes.
- Examples contain no secrets, credentials, private logs, customer data, or private tokens.

## Release Actions

Do not tag, push, publish, or merge a release without explicit maintainer approval. Tag and push commands for v1 are approval-gated handoff steps, not routine contribution steps.
