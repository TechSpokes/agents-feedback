import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { discoverFiles } from '../scripts/lib/discovery.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'build-release-artifact.mjs');
const sourceFeedbackRoot = path.join(repoRoot, 'scaffold', '.agents', 'feedback');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const artifactName = `agents-feedback-v${packageJson.version}.zip`;

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
 * @returns {{version: string, artifact: string, root: string, files: string[]}}
 */
function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'dist', 'artifact-manifest.json'), 'utf8'));
}

function expectedArtifactFiles(installRoot) {
  return discoverFiles(sourceFeedbackRoot)
    .map((filePath) => `${installRoot}/${path.relative(sourceFeedbackRoot, filePath).split(path.sep).join('/')}`);
}

test('artifact check stages the complete installable scaffold only', () => {
  const result = runBuild(['--check']);
  assert.equal(result.status, 0, result.stderr);

  const manifest = readManifest();
  assert.equal(manifest.root, '.agents/feedback');
  assert.ok(manifest.files.every((filePath) => filePath.startsWith(`${manifest.root}/`)));
  const root = path.join(repoRoot, 'dist', 'artifact', ...manifest.root.split('/'));
  const stagedFiles = discoverFiles(root)
    .map((filePath) => `${manifest.root}/${path.relative(root, filePath).split(path.sep).join('/')}`);
  assert.deepEqual(stagedFiles, expectedArtifactFiles(manifest.root));
  assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'package.json')));
  assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'node_modules')));
});

test('release ZIP is reproducible and matches its manifest and checksum', () => {
  const first = runBuild();
  assert.equal(first.status, 0, first.stderr);

  const zipPath = path.join(repoRoot, 'dist', artifactName);
  const checksumPath = `${zipPath}.sha256`;
  const firstHash = sha256(zipPath);

  const second = runBuild();
  assert.equal(second.status, 0, second.stderr);
  const secondHash = sha256(zipPath);
  assert.equal(secondHash, firstHash);

  const checksum = fs.readFileSync(checksumPath, 'utf8').trim();
  assert.equal(checksum, `${firstHash}  ${artifactName}`);

  const manifest = readManifest();
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.artifact, artifactName);
  assert.deepEqual(readStoredZipEntries(zipPath), manifest.files);
});

test('artifact contains no shared records or personal local content', () => {
  const result = runBuild(['--check']);
  assert.equal(result.status, 0, result.stderr);

  const manifest = readManifest();
  assert.ok(!manifest.files.some((filePath) => filePath.startsWith(`${manifest.root}/records/`) && /\.ya?ml$/i.test(filePath)));
  const expectedLocalFiles = expectedArtifactFiles(manifest.root)
    .filter((filePath) => filePath.startsWith(`${manifest.root}/local/`));
  assert.deepEqual(manifest.files.filter((filePath) => filePath.startsWith(`${manifest.root}/local/`)), expectedLocalFiles);
});
