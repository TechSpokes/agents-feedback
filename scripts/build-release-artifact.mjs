#!/usr/bin/env node
/**
 * Builds a reproducible dependency-free scaffold ZIP and SHA-256 checksum.
 * @since 1.0.0
 * @sideEffects Replaces the staged artifact and writes release files under dist/.
 * @constraints ZIP metadata and entry ordering must remain stable across builds.
 */
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const version = packageJson.version;
const artifactName = `agents-feedback-v${version}.zip`;
const distDir = path.join(repoRoot, 'dist');
const artifactRoot = path.join(distDir, 'artifact');
const artifactInstallRoot = '.agents/feedback';
const stagedFeedbackRoot = path.join(artifactRoot, ...artifactInstallRoot.split('/'));
const sourceFeedbackRoot = path.join(repoRoot, 'scaffold', '.agents', 'feedback');
const zipPath = path.join(distDir, artifactName);
const checksumPath = `${zipPath}.sha256`;
const checkOnly = process.argv.includes('--check');
const zipTimestamp = new Date(Date.UTC(1980, 0, 1, 0, 0, 0));

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function copyRecursive(source, target) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    ensureDirectory(target);
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.copyFileSync(source, target);
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort(compareOrdinal);
}

function compareOrdinal(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(date.getUTCFullYear(), 1980);
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return { dosTime, dosDate };
}

function uint16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function createZip(sourceDirectory, targetZipPath) {
  /** @type {Uint8Array[]} */
  const fileParts = [];
  /** @type {Uint8Array[]} */
  const centralParts = [];
  let offset = 0;
  const timestamp = dosDateTime(zipTimestamp);

  for (const filePath of walkFiles(sourceDirectory)) {
    const relativeName = path.relative(sourceDirectory, filePath).split(path.sep).join('/');
    const nameBuffer = Buffer.from(relativeName, 'utf8');
    const content = Buffer.from(fs.readFileSync(filePath, 'base64'), 'base64');
    const checksum = crc32(content);
    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(timestamp.dosTime),
      uint16(timestamp.dosDate),
      uint32(checksum),
      uint32(content.length),
      uint32(content.length),
      uint16(nameBuffer.length),
      uint16(0),
      nameBuffer,
    ]);

    fileParts.push(localHeader, content);

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(timestamp.dosTime),
      uint16(timestamp.dosDate),
      uint32(checksum),
      uint32(content.length),
      uint32(content.length),
      uint16(nameBuffer.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBuffer,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(centralParts.length),
    uint16(centralParts.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  fs.writeFileSync(targetZipPath, Buffer.concat([...fileParts, centralDirectory, end]));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath, 'base64'), 'base64').digest('hex');
}

function retainedLocalArtifactFiles() {
  const localIgnorePath = path.join(sourceFeedbackRoot, 'local', '.gitignore');
  const retained = fs.readFileSync(localIgnorePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('!'))
    .map((line) => line.slice(1).replace(/^\//, ''));

  if (retained.some((relativePath) => /[*?[\]]/.test(relativePath))) {
    throw new Error('local .gitignore retained paths must not use glob patterns');
  }

  return new Set([
    `${artifactInstallRoot}/local/.gitignore`,
    ...retained.map((relativePath) => `${artifactInstallRoot}/local/${relativePath}`),
  ]);
}

function verifyArtifact() {
  if (fs.existsSync(path.join(artifactRoot, 'package.json'))) {
    throw new Error('artifact must not include repository package.json');
  }

  const artifactFiles = walkFiles(artifactRoot)
    .map((filePath) => path.relative(artifactRoot, filePath).split(path.sep).join('/'));
  const sourceFiles = walkFiles(sourceFeedbackRoot)
    .map((filePath) => `${artifactInstallRoot}/${path.relative(sourceFeedbackRoot, filePath).split(path.sep).join('/')}`);
  if (JSON.stringify(artifactFiles) !== JSON.stringify(sourceFiles)) {
    throw new Error('artifact file inventory must match the source scaffold');
  }
  if (artifactFiles.some((filePath) => filePath.includes('node_modules/'))) {
    throw new Error('artifact must not include node_modules');
  }
  if (artifactFiles.some((filePath) => filePath.startsWith(`${artifactInstallRoot}/records/`) && /\.ya?ml$/i.test(filePath))) {
    throw new Error('artifact must not include shared feedback records');
  }

  const allowedLocalFiles = retainedLocalArtifactFiles();
  const unexpectedLocal = artifactFiles.find(
    (filePath) => filePath.startsWith(`${artifactInstallRoot}/local/`) && !allowedLocalFiles.has(filePath),
  );
  if (unexpectedLocal) {
    throw new Error(`artifact must not include personal local content: ${unexpectedLocal}`);
  }
}

fs.rmSync(artifactRoot, { recursive: true, force: true });
ensureDirectory(stagedFeedbackRoot);
copyRecursive(sourceFeedbackRoot, stagedFeedbackRoot);
verifyArtifact();
ensureDirectory(distDir);

const manifest = {
  version,
  artifact: artifactName,
  root: artifactInstallRoot,
  files: walkFiles(artifactRoot).map((filePath) => path.relative(artifactRoot, filePath).split(path.sep).join('/')),
};
fs.writeFileSync(path.join(distDir, 'artifact-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

if (!checkOnly) {
  fs.rmSync(zipPath, { force: true });
  fs.rmSync(checksumPath, { force: true });
  createZip(artifactRoot, zipPath);
  fs.writeFileSync(checksumPath, `${sha256(zipPath)}  ${artifactName}\n`);
}

console.log(`release-artifact: ${checkOnly ? 'checked' : 'built'} ${artifactName}`);
