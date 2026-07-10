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

The repository currently retains release bodies for `v1.0.0` and `v1.1.0`.

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
