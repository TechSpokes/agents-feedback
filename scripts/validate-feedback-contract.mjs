#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recordSchemaPath = path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'schemas', 'record.schema.json');
const planSchemaPath = path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'schemas', 'plan.schema.json');
const recordTemplatePath = path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'templates', 'record.yaml');
const planTemplatePath = path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'templates', 'plan.yaml');

const failures = [];

function read(relativeOrAbsolutePath) {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function fail(message) {
  failures.push(message);
}

function assertDescriptions(schema, label, propertyPath = []) {
  for (const [name, definition] of Object.entries(schema.properties ?? {})) {
    const currentPath = [...propertyPath, name];
    if (typeof definition.description !== 'string' || definition.description.trim() === '') {
      fail(`${label}.${currentPath.join('.')} missing description`);
    }
    assertDescriptions(definition, label, currentPath);
    if (definition.items && !definition.items.$ref) {
      assertDescriptions(definition.items, label, [...currentPath, 'items']);
    }
  }

  for (const [name, definition] of Object.entries(schema.definitions ?? {})) {
    if (typeof definition.description !== 'string' || definition.description.trim() === '') {
      fail(`${label}.definitions.${name} missing description`);
    }
    assertDescriptions(definition, `${label}.definitions.${name}`);
  }
}

function topLevelYamlKeys(source) {
  const keys = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#') || /^\s/.test(line)) {
      continue;
    }
    const match = /^([A-Za-z_][A-Za-z0-9_]*):/.exec(line);
    if (match) {
      keys.push(match[1]);
    }
  }
  return new Set(keys);
}

function assertTemplateKeys(schema, templateSource, label) {
  const keys = topLevelYamlKeys(templateSource);
  for (const requiredKey of schema.required ?? []) {
    if (!keys.has(requiredKey)) {
      fail(`${label} template missing ${requiredKey}`);
    }
  }
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.idea') {
        continue;
      }
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function activeTextFiles() {
  return walkFiles(repoRoot).filter((filePath) => {
    const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
    if (relativePath.startsWith('docs/plans/')) {
      return false;
    }
    const activeRoots = [
      'AGENTS.md',
      'CHANGELOG.md',
      'CODE_OF_CONDUCT.md',
      'CONTRIBUTING.md',
      'README.md',
      'SECURITY.md',
      'SUPPORT.md',
      '.github/',
      'docs/',
      'scaffold/.agents/feedback/',
    ];
    if (!activeRoots.some((root) => relativePath === root || relativePath.startsWith(root))) {
      return false;
    }
    return /\.(md|yaml|yml|json|mjs)$/.test(relativePath);
  });
}

const recordSchema = readJson(recordSchemaPath);
const planSchema = readJson(planSchemaPath);
const recordTemplate = read(recordTemplatePath);
const planTemplate = read(planTemplatePath);

assertDescriptions(recordSchema, 'record');
assertDescriptions(planSchema, 'plan');
assertTemplateKeys(recordSchema, recordTemplate, 'record');
assertTemplateKeys(planSchema, planTemplate, 'plan');

if (recordTemplate.includes('No secrets, credentials')) {
  fail('record template still contains old sensitivity boilerplate');
}

if (recordTemplate.includes('suggested_action:')) {
  fail('record template still uses suggested_action');
}

if (!recordTemplate.includes('suggested_actions:')) {
  fail('record template missing suggested_actions');
}

for (const filePath of activeTextFiles()) {
  const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
  const content = read(filePath);
  if (/\bsuggested_action\b/.test(content)) {
    fail(`${relativePath} contains suggested_action`);
  }
  if (/Manual mode|Hooked mode/.test(content)) {
    fail(`${relativePath} contains removed installation mode language`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`feedback-contract: ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log('feedback-contract: ok');
}
