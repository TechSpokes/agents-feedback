import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const recordSchema = readJson('scaffold/.agents/feedback/schemas/record.schema.json');
const planSchema = readJson('scaffold/.agents/feedback/schemas/plan.schema.json');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertDescriptions(schema, propertyPath = []) {
  for (const [name, definition] of Object.entries(schema.properties ?? {})) {
    const currentPath = [...propertyPath, name];
    assert.equal(typeof definition.description, 'string', `${currentPath.join('.')} missing description`);
    assert.notEqual(definition.description.trim(), '', `${currentPath.join('.')} empty description`);
    assertDescriptions(definition, currentPath);
    if (definition.items && !definition.items.$ref) {
      assertDescriptions(definition.items, [...currentPath, 'items']);
    }
  }

  for (const [name, definition] of Object.entries(schema.definitions ?? {})) {
    assert.equal(typeof definition.description, 'string', `definitions.${name} missing description`);
    assert.notEqual(definition.description.trim(), '', `definitions.${name} empty description`);
    assertDescriptions(definition, ['definitions', name]);
  }
}

test('record schema describes all fields and uses v1 record shape', () => {
  assertDescriptions(recordSchema);
  assert.ok(recordSchema.required.includes('description'));
  assert.ok(recordSchema.required.includes('suggested_actions'));
  assert.ok(!recordSchema.required.includes('suggested_action'));
  assert.ok(recordSchema.properties.suggested_actions);
  assert.ok(recordSchema.properties.sensitivity.properties.classification);
  assert.ok(!recordSchema.properties.sensitivity.properties.notes);
});

test('plan schema describes all fields and uses phase task shape', () => {
  assertDescriptions(planSchema);
  assert.ok(planSchema.required.includes('schema_version'));
  assert.ok(planSchema.required.includes('status'));
  assert.ok(planSchema.required.includes('phases'));
  assert.ok(!planSchema.required.includes('steps'));
  assert.ok(planSchema.properties.phases);
  assert.ok(planSchema.definitions.task);
  assert.ok(planSchema.definitions.task.properties.tasks);
});

test('templates contain current contract fields without old boilerplate values', () => {
  const recordTemplate = read('scaffold/.agents/feedback/templates/record.yaml');
  const planTemplate = read('scaffold/.agents/feedback/templates/plan.yaml');

  assert.match(recordTemplate, /^description:/m);
  assert.match(recordTemplate, /^suggested_actions:/m);
  assert.match(recordTemplate, /^\s+classification: public/m);
  assert.match(recordTemplate, /^\s+redaction_notes: ""/m);
  assert.doesNotMatch(recordTemplate, /suggested_action:/);
  assert.doesNotMatch(recordTemplate, /No secrets, credentials/);
  assert.match(planTemplate, /^schema_version: feedback-plan\.v1/m);
  assert.match(planTemplate, /^phases:/m);
  assert.doesNotMatch(planTemplate, /^steps:/m);
});

test('public repository support files are present and route users correctly', () => {
  const requiredFiles = [
    'CHANGELOG.md',
    'SECURITY.md',
    'SUPPORT.md',
    'CODE_OF_CONDUCT.md',
    '.github/CODEOWNERS',
    '.github/dependabot.yml',
    '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/config.yml',
  ];

  for (const relativePath of requiredFiles) {
    assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} missing`);
  }

  assert.match(read('CHANGELOG.md'), /docs\/releases\/v1\.0\.0\.md/);
  assert.match(read('SECURITY.md'), /vulnerability/i);
  assert.match(read('SUPPORT.md'), /Discussions/);
  assert.match(read('.github/CODEOWNERS'), /^\* @sergeliatko/m);
  assert.match(read('.github/dependabot.yml'), /package-ecosystem: "github-actions"/);
  assert.match(read('.github/ISSUE_TEMPLATE/config.yml'), /Discussions/);
});
