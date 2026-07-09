import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  releaseNotesBody,
  releaseNotesPathForTag,
  releaseTitleForTag,
  verifyReleaseNotes,
} from '../scripts/lib/release-notes.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

test('release notes path and title are derived from tag', () => {
  assert.equal(releaseNotesPathForTag('v1.0.0'), path.join('docs', 'releases', 'v1.0.0.md'));
  assert.equal(releaseTitleForTag('v1.0.0'), 'agents-feedback v1.0.0');
});

test('v1 release notes satisfy the release body contract', () => {
  const notesPath = path.join(repoRoot, releaseNotesPathForTag('v1.0.0'));
  const result = verifyReleaseNotes(notesPath, 'v1.0.0');

  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('release notes body strips the top-level title only', () => {
  const notesPath = path.join(repoRoot, releaseNotesPathForTag('v1.0.0'));
  const body = releaseNotesBody(notesPath);

  assert.ok(body.startsWith('## Agent-Installable Feedback Scaffold\n'));
  assert.ok(!body.includes('# agents-feedback v1.0.0'));
});

test('release notes validation reports malformed files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-feedback-release-notes-'));
  const notesPath = path.join(tempDir, 'v1.0.0.md');
  fs.writeFileSync(
    notesPath,
    [
      '# agents-feedback v1.0.0',
      '',
      '## Highlights',
      '',
      '- Missing the required leading subtitle and several sections.',
      '',
    ].join('\n'),
  );

  const result = verifyReleaseNotes(notesPath, 'v1.0.0');

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('missing required section: What This Provides')));
  assert.ok(result.errors.some((error) => error.includes('missing H2 subtitle before What This Provides')));
});
