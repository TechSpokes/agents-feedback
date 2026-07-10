import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'build-release-artifact.mjs');

function runBuild(args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath, 'base64'), 'base64').digest('hex');
}

function readStoredZipEntries(filePath) {
  const buffer = Buffer.from(fs.readFileSync(filePath, 'base64'), 'base64');
  const entries = [];
  let offset = 0;

  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    entries.push(buffer.subarray(nameStart, nameStart + nameLength).toString('utf8'));
    offset = nameStart + nameLength + extraLength + compressedSize;
  }

  return entries;
}

/**
 * @returns {{version: string, artifact: string, files: string[]}}
 */
function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'dist', 'artifact-manifest.json'), 'utf8'));
}

test('artifact check stages the complete installable scaffold only', () => {
  const result = runBuild(['--check']);
  assert.equal(result.status, 0, result.stderr);

  const root = path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback');
  const required = [
    'AGENTS.md',
    'AGENTS.final.md',
    'INSTALL.md',
    'UPGRADE.md',
    'README.md',
    'local/.gitignore',
    'local/README.md',
    'schemas/record.schema.json',
    'schemas/plan.schema.json',
    'templates/record.yaml',
    'templates/plan.yaml',
    'tools/feedback-state.mjs',
  ];

  for (const relativePath of required) {
    assert.ok(fs.existsSync(path.join(root, ...relativePath.split('/'))), `${relativePath} missing`);
  }
  assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'package.json')));
  assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'node_modules')));
});

test('release ZIP is reproducible and matches its manifest and checksum', () => {
  const first = runBuild();
  assert.equal(first.status, 0, first.stderr);

  const zipPath = path.join(repoRoot, 'dist', 'agents-feedback-v1.1.0.zip');
  const checksumPath = `${zipPath}.sha256`;
  const firstHash = sha256(zipPath);

  const second = runBuild();
  assert.equal(second.status, 0, second.stderr);
  const secondHash = sha256(zipPath);
  assert.equal(secondHash, firstHash);

  const checksum = fs.readFileSync(checksumPath, 'utf8').trim();
  assert.equal(checksum, `${firstHash}  agents-feedback-v1.1.0.zip`);

  const manifest = readManifest();
  assert.equal(manifest.version, '1.1.0');
  assert.equal(manifest.artifact, 'agents-feedback-v1.1.0.zip');
  assert.deepEqual(readStoredZipEntries(zipPath), manifest.files);
});

test('artifact contains no shared records or personal local content', () => {
  const result = runBuild(['--check']);
  assert.equal(result.status, 0, result.stderr);

  const manifest = readManifest();
  assert.ok(!manifest.files.some((filePath) => /^\.agents\/feedback\/records\/.*\.ya?ml$/i.test(filePath)));
  assert.deepEqual(
    manifest.files.filter((filePath) => filePath.startsWith('.agents/feedback/local/')),
    ['.agents/feedback/local/.gitignore', '.agents/feedback/local/README.md'],
  );
});
