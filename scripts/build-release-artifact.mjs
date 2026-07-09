#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const version = packageJson.version;
const artifactName = `agents-feedback-v${version}.zip`;
const distDir = path.join(repoRoot, 'dist');
const artifactRoot = path.join(distDir, 'artifact');
const stagedFeedbackRoot = path.join(artifactRoot, '.agents', 'feedback');
const sourceFeedbackRoot = path.join(repoRoot, 'scaffold', '.agents', 'feedback');
const zipPath = path.join(distDir, artifactName);
const checksumPath = `${zipPath}.sha256`;
const checkOnly = process.argv.includes('--check');

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
  return files.sort((left, right) => left.localeCompare(right));
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
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
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
  const fileParts = [];
  const centralParts = [];
  let offset = 0;
  const timestamp = dosDateTime(new Date());

  for (const filePath of walkFiles(sourceDirectory)) {
    const relativeName = path.relative(sourceDirectory, filePath).split(path.sep).join('/');
    const nameBuffer = Buffer.from(relativeName, 'utf8');
    const content = fs.readFileSync(filePath);
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
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function verifyRequiredFiles() {
  const required = [
    '.agents/feedback/AGENTS.md',
    '.agents/feedback/INSTALL.md',
    '.agents/feedback/AGENTS.final.md',
    '.agents/feedback/schemas/record.schema.json',
    '.agents/feedback/schemas/plan.schema.json',
    '.agents/feedback/tools/feedback-state.mjs',
  ];

  for (const relativePath of required) {
    const filePath = path.join(artifactRoot, ...relativePath.split('/'));
    if (!fs.existsSync(filePath)) {
      throw new Error(`missing artifact file: ${relativePath}`);
    }
  }

  if (fs.existsSync(path.join(artifactRoot, 'package.json'))) {
    throw new Error('artifact must not include repository package.json');
  }
}

fs.rmSync(artifactRoot, { recursive: true, force: true });
ensureDirectory(stagedFeedbackRoot);
copyRecursive(sourceFeedbackRoot, stagedFeedbackRoot);
verifyRequiredFiles();
ensureDirectory(distDir);

const manifest = {
  version,
  artifact: artifactName,
  root: '.agents/feedback',
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
