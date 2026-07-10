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

test('all retained release notes satisfy the release body contract', () => {
  for (const tag of ['v1.0.0', 'v1.1.0']) {
    const notesPath = path.join(repoRoot, releaseNotesPathForTag(tag));
    const result = verifyReleaseNotes(notesPath, tag);
    assert.deepEqual(result.errors, [], tag);
    assert.equal(result.ok, true, tag);
  }
});

test('release notes body strips the top-level title only', () => {
  const notesPath = path.join(repoRoot, releaseNotesPathForTag('v1.1.0'));
  const body = releaseNotesBody(notesPath);

  assert.ok(body.startsWith('## Repository-Local Learning Loop\n'));
  assert.ok(!body.includes('# agents-feedback v1.1.0'));
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

test('active user documentation identifies the ZIP as the installation asset', () => {
  const surfaces = [
    'README.md',
    'SUPPORT.md',
    'docs/specification.md',
    'docs/releases/README.md',
    'docs/releases/v1.1.0.md',
    'scaffold/.agents/feedback/README.md',
  ];

  for (const relativePath of surfaces) {
    const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(content, /\.zip/i, `${relativePath} does not name the ZIP`);
    assert.match(content, /sha256/i, `${relativePath} does not explain the checksum`);
    assert.match(content, /(optional|verification|verify)/i, `${relativePath} does not describe checksum purpose`);
    assert.match(content, /(not extracted|do not extract|never extracted)/i, `${relativePath} does not say not to extract the checksum`);
  }
});
