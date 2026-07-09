# Release v1

Version 1.0.0 ships the first stable agents feedback scaffold. This document defines v1 scope and release handoff; it is not a changelog.

## Included

- Installable `.agents/feedback` scaffold.
- Bootstrap and operational `AGENTS.md` instructions.
- Lifecycle folders for `new`, `planned`, `in_progress`, `in_review`, `completed`, and `archived`.
- YAML record and plan templates.
- JSON schemas for IDE validation.
- Dependency-free `feedback-state.mjs` state report script.
- Node test coverage for state script behavior.
- GitHub Actions CI for release checks.
- Root instruction hook template for target repositories.
- Documentation for installation modes, lifecycle rules, script semantics, and safety rules.

## Not Included

- No target-repository package install.
- No database.
- No background service.
- No project changelog for completed feedback records.
- No long-term memory system.
- No task tracker.
- No canonical documentation replacement.
- No automatic root instruction mutation.
- No release publishing without explicit maintainer approval.

## Verification

Run the release check before requesting approval:

```bash
npm run release:check
```

Run direct state inspection when needed:

```bash
node scaffold/.agents/feedback/tools/feedback-state.mjs --root scaffold/.agents/feedback --format json
```

## Approval-Gated Publishing

Tag and push are approval-gated. Do not run release publishing commands until the repository owner explicitly approves publishing v1.0.0.

After approval, the release handoff commands are:

```bash
git tag v1.0.0
git push origin main
git push origin v1.0.0
```
