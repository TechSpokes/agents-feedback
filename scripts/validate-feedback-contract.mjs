#!/usr/bin/env node
/**
 * Validates complete feedback fixtures, schemas, templates, and active documentation.
 * @since 1.0.0
 * @sideEffects Writes validation failures to stderr and sets the process exit code.
 * @constraints Repository-only dependencies must never enter the installed scaffold artifact.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(relativeOrAbsolutePath) {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function fail(message) {
  failures.push(message);
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '.idea', '.intake', 'dist', 'node_modules'].includes(entry.name)) {
        continue;
      }
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function assertDescriptions(schema, label, propertyPath = []) {
  for (const [name, definition] of Object.entries(schema.properties ?? {})) {
    const currentPath = [...propertyPath, name];
    if (typeof definition.description !== 'string' || definition.description.trim() === '') {
      fail(`${label}.${currentPath.join('.')} missing description`);
    }
    assertDescriptions(definition, label, currentPath);
    if (definition.items && typeof definition.items === 'object') {
      assertDescriptions(definition.items, label, [...currentPath, 'items']);
    }
  }
}

function validateMarkdown(filePath) {
  const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
  const source = read(filePath);
  const lines = source.split(/\r?\n/);
  /** @type {string[]} */
  const outsideFence = [];
  if (/[^\x00-\x7f]/.test(source)) {
    fail(`${relativePath} contains non-ASCII text`);
  }

  let inFence = false;
  for (const [index, line] of lines.entries()) {
    if (line.startsWith('```')) {
      if (!inFence && line === '```') {
        fail(`${relativePath}:${index + 1} has an unlabeled code fence`);
      }
      inFence = !inFence;
      continue;
    }
    if (!inFence) {
      outsideFence.push(line);
      if (/^\s{2,}[-*+] /.test(line)) {
        fail(`${relativePath}:${index + 1} contains a nested list`);
      }
    }
  }
  if (inFence) {
    fail(`${relativePath} contains an unclosed code fence`);
  }

  const markdown = outsideFence.join('\n');
  const h1Count = outsideFence.filter((line) => /^# [^#]/.test(line)).length;
  if (h1Count !== 1) {
    fail(`${relativePath} must contain exactly one H1; found ${h1Count}`);
  }
  if (/\*\*[^*]+\*\*/.test(markdown)) {
    fail(`${relativePath} contains bold emphasis`);
  }
  if (/^(---|\*\*\*|___)\s*$/m.test(markdown)) {
    fail(`${relativePath} contains a horizontal rule`);
  }
}

const recordSchema = readJson('scaffold/.agents/feedback/schemas/record.schema.json');
const planSchema = readJson('scaffold/.agents/feedback/schemas/plan.schema.json');
assertDescriptions(recordSchema, 'record');
assertDescriptions(planSchema, 'plan');

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
ajv.addSchema(planSchema);
const validateRecord = ajv.compile(recordSchema);
const validatePlan = ajv.getSchema(planSchema.$id);

const validFixtureRoot = path.join(repoRoot, 'tests', 'fixtures', 'valid-feedback');
for (const filePath of walkFiles(validFixtureRoot).filter((candidate) => /\.ya?ml$/i.test(candidate))) {
  const value = parseYaml(read(filePath));
  if (!validateRecord(value)) {
    fail(`${path.relative(repoRoot, filePath)} invalid: ${ajv.errorsText(validateRecord.errors)}`);
  }
}

const validPlanPath = path.join(repoRoot, 'tests', 'contract-fixtures', 'valid', 'plan-eight-tasks.yaml');
const validPlan = parseYaml(read(validPlanPath));
if (!validatePlan(validPlan)) {
  fail(`${path.relative(repoRoot, validPlanPath)} invalid: ${ajv.errorsText(validatePlan.errors)}`);
}

const invalidFixtureRoot = path.join(repoRoot, 'tests', 'contract-fixtures', 'invalid');
for (const filePath of walkFiles(invalidFixtureRoot)) {
  const value = parseYaml(read(filePath));
  const validator = path.basename(filePath).startsWith('plan-') ? validatePlan : validateRecord;
  if (validator(value)) {
    fail(`${path.relative(repoRoot, filePath)} unexpectedly validated`);
  }
}

const recordTemplate = parseYaml(read('scaffold/.agents/feedback/templates/record.yaml'));
const planTemplate = parseYaml(read('scaffold/.agents/feedback/templates/plan.yaml'));
if (JSON.stringify(Object.keys(recordTemplate)) !== JSON.stringify(recordSchema.required)) {
  fail('record template required keys do not match record schema');
}
if (JSON.stringify(Object.keys(planTemplate)) !== JSON.stringify(planSchema.required)) {
  fail('plan template required keys do not match plan schema');
}
if (!validateRecord(recordTemplate)) {
  fail(`record template invalid: ${ajv.errorsText(validateRecord.errors)}`);
}
if (!validatePlan(planTemplate)) {
  fail(`plan template invalid: ${ajv.errorsText(validatePlan.errors)}`);
}

for (const filePath of walkFiles(repoRoot)) {
  const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
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
  const active = activeRoots.some((root) => relativePath === root || relativePath.startsWith(root));
  if (!active || relativePath.startsWith('docs/plans/') || !/\.(md|yaml|yml|json|mjs)$/.test(relativePath)) {
    continue;
  }
  const content = read(filePath);
  if (/\bschema_version\b|\bcreated_at\b|\bupdated_at\b|\bcompleted_at\b/.test(content)) {
    fail(`${relativePath} contains a removed record contract key`);
  }
  if (/feedback-record\.v2|feedback-plan\.v2|record\.v1\.schema|plan\.v1\.schema/.test(content)) {
    fail(`${relativePath} contains discarded multi-version schema language`);
  }
  if (relativePath.endsWith('.md')) {
    validateMarkdown(filePath);
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
