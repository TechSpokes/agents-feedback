# Release Notes

This folder stores one release body source file per Git tag. The release workflow reads `docs/releases/<tag>.md`, validates it, strips the top-level title, and uses the remaining Markdown as the draft GitHub Release body.

## File Contract

Each release note file must use this structure:

```markdown
# agents-feedback vX.Y.Z

## Short Release Subtitle

## What This Provides

## Highlights

## Installation

## Validation

## Notes
```

The first line must match the tag exactly. For tag `vX.Y.Z`, the file is `docs/releases/vX.Y.Z.md` and the title is `# agents-feedback vX.Y.Z`.

Versioned release body files are discovered from filenames matching `vX.Y.Z.md`.

Write release notes for someone deciding whether to install the product. Explain the user outcome before schema, validation, workflow, or maintainer details, identify the versioned ZIP, and link to the tagged getting-started guide instead of restating its full procedure.

## Draft Release Workflow

Tag and push actions are approval-gated. Do not push release tags until the repository owner explicitly approves preparing the release.

After approval, the release handoff commands are:

```bash
npm run release:check
git tag vX.Y.Z
git push origin vX.Y.Z
```

Pushing the tag creates or updates a draft GitHub Release with `agents-feedback-vX.Y.Z.zip` and `agents-feedback-vX.Y.Z.zip.sha256` attached. The maintainer reviews the draft release, verifies the attached artifact, and publishes the draft manually.

User-facing release notes must identify `agents-feedback-vX.Y.Z.zip` as the installation download. They must describe `.zip.sha256` as optional verification metadata that users do not extract.

## Workflow Run Policy

CI validates pull requests and direct pushes to `main`. It does not run for branch pushes that already receive pull request validation or tag pushes whose release workflow runs the complete release gate.

CI and draft release workflows use concurrency groups keyed by pull request, branch, or release tag. A newer run cancels an in-progress run for the same key, which avoids spending runner time on superseded commits while preserving one current validation result.
