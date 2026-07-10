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
import { discoverFiles } from '../scripts/lib/discovery.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const releaseNotesRoot = path.join(repoRoot, 'docs', 'releases');

function discoverReleaseTags() {
  return discoverFiles(releaseNotesRoot, { extensions: ['.md'] })
    .map((filePath) => path.basename(filePath))
    .filter((fileName) => /^v\d+\.\d+\.\d+\.md$/.test(fileName))
    .map((fileName) => path.basename(fileName, '.md'))
    .sort();
}

test('release notes path and title are derived from tag', () => {
  assert.equal(releaseNotesPathForTag('v9.8.7'), path.join('docs', 'releases', 'v9.8.7.md'));
  assert.equal(releaseTitleForTag('v9.8.7'), 'agents-feedback v9.8.7');
});

test('all retained release notes satisfy the release body contract', () => {
  const tags = discoverReleaseTags();
  assert.ok(tags.length > 0, 'no versioned release notes discovered');

  for (const tag of tags) {
    const notesPath = path.join(repoRoot, releaseNotesPathForTag(tag));
    const result = verifyReleaseNotes(notesPath, tag);
    assert.deepEqual(result.errors, [], tag);
    assert.equal(result.ok, true, tag);
  }
});

test('release notes body strips the top-level title only', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const tag = `v${packageJson.version}`;
  const notesPath = path.join(repoRoot, releaseNotesPathForTag(tag));
  const body = releaseNotesBody(notesPath);
  const source = fs.readFileSync(notesPath, 'utf8');
  const expectedBody = source.split(/\r?\n/).slice(1).join('\n').trimStart();

  assert.equal(body, expectedBody);
  assert.ok(!body.includes(`# agents-feedback ${tag}`));
});

test('release notes validation reports malformed files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-feedback-release-notes-'));
  const sampleTag = 'v9.8.7';
  const notesPath = path.join(tempDir, `${sampleTag}.md`);
  fs.writeFileSync(
    notesPath,
    [
      `# agents-feedback ${sampleTag}`,
      '',
      '## Highlights',
      '',
      '- Missing the required leading subtitle and several sections.',
      '',
    ].join('\n'),
  );

  const result = verifyReleaseNotes(notesPath, sampleTag);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('missing required section: What This Provides')));
  assert.ok(result.errors.some((error) => error.includes('missing H2 subtitle before What This Provides')));
});

test('discovered public checksum guidance distinguishes metadata from the installation ZIP', () => {
  const checksumSurfaces = discoverFiles(repoRoot, {
    extensions: ['.md'],
    excludedDirectories: ['docs/plans'],
  })
    .map((filePath) => ({ filePath, content: fs.readFileSync(filePath, 'utf8') }))
    .filter(({ content }) => /\.zip\.sha256/i.test(content));

  assert.ok(checksumSurfaces.length > 0, 'no public checksum guidance discovered');
  for (const { filePath, content } of checksumSurfaces) {
    const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
    assert.match(content, /\.zip/i, `${relativePath} does not name the ZIP`);
    assert.match(content, /sha256/i, `${relativePath} does not explain the checksum`);
    assert.match(content, /(optional|verification|verify)/i, `${relativePath} does not describe checksum purpose`);
    assert.match(content, /(not extracted|do not extract|never extracted|not an installation archive)/i, `${relativePath} does not distinguish checksum metadata`);
  }
});

test('public documentation routes first-time users from value to installation and first use', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const documentationIndex = fs.readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf8');
  const gettingStarted = fs.readFileSync(path.join(repoRoot, 'docs', 'getting-started.md'), 'utf8');

  assert.match(readme, /https:\/\/github\.com\/TechSpokes\/agents-feedback\/releases\/latest/);
  assert.match(readme, /## Install in Three Steps/);
  assert.match(readme, /An existing `\.agents` directory is fine/);
  assert.match(readme, /If `\.agents\/feedback` exists or the extraction tool asks to replace anything/);
  assert.match(readme, /ZIP deliberately includes the `\.agents\/feedback` path/);
  assert.match(readme, /Read \.agents\/feedback\/AGENTS\.md and complete the fresh installation/);
  assert.ok(
    readme.indexOf('## Install in Three Steps') < readme.indexOf('## Repository Development'),
    'README must place installation before repository maintenance',
  );
  assert.match(documentationIndex, /\[Getting started]\(getting-started\.md\)/);
  assert.match(gettingStarted, /## Start a Task with Relevant Feedback/);
  assert.match(gettingStarted, /## Upgrade an Existing Installation/);
  assert.match(gettingStarted, /## Troubleshooting/);
  assert.match(gettingStarted, /## Why the ZIP Includes `\.agents\/feedback`/);
  assert.match(gettingStarted, /\.agents` exists without `feedback`/);
  assert.match(gettingStarted, /Stop instead of approving an overwrite prompt/);
});
