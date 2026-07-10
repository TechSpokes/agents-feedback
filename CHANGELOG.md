# Changelog

This changelog records public `agents-feedback` product releases. It does not list implemented feedback records, internal planning updates, or target-repository feedback items.

## v1.2.0

Prevents duplicate GitHub Actions validation by running CI for pull requests and direct pushes to `main`, leaving tag validation to the release workflow, and cancelling superseded runs for the same pull request, branch, or release tag. Upgrades `actions/checkout` to v7 and makes the workflow trigger and concurrency policy part of the tested repository contract.

Release body: [docs/releases/v1.2.0.md](docs/releases/v1.2.0.md)

## v1.1.0

Adds relevant feedback discovery, a concise folder-authoritative record contract, flat plans, ignored per-clone feedback, staged upgrades, Node-optional installation, adoption-first documentation, complete schema validation, and reproducible release artifacts.

Release body: [docs/releases/v1.1.0.md](docs/releases/v1.1.0.md)

## v1.0.0

Initial stable release of the agent-installable `.agents/feedback` scaffold.

Release body: [docs/releases/v1.0.0.md](docs/releases/v1.0.0.md)
