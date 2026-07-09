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

The first line must match the tag exactly. For tag `v1.0.0`, the file must be `docs/releases/v1.0.0.md` and the title must be `# agents-feedback v1.0.0`.

## Draft Release Workflow

Tag and push actions are approval-gated. Do not push release tags until the repository owner explicitly approves preparing the release.

After approval, the release handoff commands are:

```bash
npm run release:check
git tag vX.Y.Z
git push origin vX.Y.Z
```

Pushing the tag creates or updates a draft GitHub Release with `agents-feedback-vX.Y.Z.zip` and `agents-feedback-vX.Y.Z.zip.sha256` attached. The maintainer reviews the draft release, verifies the attached artifact, and publishes the draft manually.
