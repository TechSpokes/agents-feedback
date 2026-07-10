import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
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
  return files.sort();
}

function assertDescriptions(schema, propertyPath = []) {
  for (const [name, definition] of Object.entries(schema.properties ?? {})) {
    const currentPath = [...propertyPath, name];
    assert.equal(typeof definition.description, 'string', `${currentPath.join('.')} missing description`);
    assert.notEqual(definition.description.trim(), '', `${currentPath.join('.')} empty description`);
    assertDescriptions(definition, currentPath);
    if (definition.items && typeof definition.items === 'object') {
      assertDescriptions(definition.items, [...currentPath, 'items']);
    }
  }
}

function createValidators() {
  const recordSchema = readJson('scaffold/.agents/feedback/schemas/record.schema.json');
  const planSchema = readJson('scaffold/.agents/feedback/schemas/plan.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  ajv.addSchema(planSchema);
  return {
    recordSchema,
    planSchema,
    validateRecord: ajv.compile(recordSchema),
    validatePlan: ajv.getSchema(planSchema.$id),
  };
}

test('record schema is the sole concise v1 contract', () => {
  const { recordSchema } = createValidators();

  assertDescriptions(recordSchema);
  assert.equal(recordSchema.properties['schema'].const, 'feedback-record.v1');
  assert.deepEqual(recordSchema.required, [
    'schema',
    'id',
    'summary',
    'observation',
    'paths',
    'created',
    'updated',
    'safety',
  ]);
  assert.equal(recordSchema.properties['status'], undefined);
  assert.equal(recordSchema.properties['schema_version'], undefined);
  assert.equal(recordSchema.properties['title'], undefined);
  assert.equal(recordSchema.properties['evidence'].type, 'string');
  assert.equal(recordSchema.properties['environment']['type'], 'object');
});

test('plan schema is flat and treats seven tasks as guidance', () => {
  const { planSchema, validatePlan } = createValidators();

  assertDescriptions(planSchema);
  assert.equal(planSchema.properties['schema'].const, 'feedback-plan.v1');
  assert.deepEqual(planSchema.required, ['schema', 'owner', 'tasks']);
  assert.equal(planSchema.properties['tasks'].maxItems, undefined);
  assert.equal(planSchema.properties['tasks'].items.properties['tasks'], undefined);

  const plan = parseYaml(read('tests/contract-fixtures/valid/plan-eight-tasks.yaml'));
  assert.equal(validatePlan(plan), true, JSON.stringify(validatePlan.errors));
});

test('all valid shared and local fixture records satisfy the record schema', () => {
  const { validateRecord } = createValidators();
  const root = path.join(repoRoot, 'tests', 'fixtures', 'valid-feedback');
  const fixtures = walkFiles(root).filter((filePath) => /\.ya?ml$/i.test(filePath));

  assert.ok(fixtures.length > 0);
  for (const filePath of fixtures) {
    const record = parseYaml(fs.readFileSync(filePath, 'utf8'));
    assert.equal(validateRecord(record), true, `${path.relative(repoRoot, filePath)}: ${JSON.stringify(validateRecord.errors)}`);
  }
});

test('every invalid contract fixture is rejected for its intended contract', () => {
  const { validateRecord, validatePlan } = createValidators();
  const root = path.join(repoRoot, 'tests', 'contract-fixtures', 'invalid');

  for (const filePath of walkFiles(root)) {
    const value = parseYaml(fs.readFileSync(filePath, 'utf8'));
    const validator = path.basename(filePath).startsWith('plan-') ? validatePlan : validateRecord;
    assert.equal(validator(value), false, `${path.relative(repoRoot, filePath)} unexpectedly validated`);
    assert.ok(validator.errors.length > 0, `${path.relative(repoRoot, filePath)} returned no validation errors`);
  }
});

test('templates are valid starting points with required fields and no legacy contract keys', () => {
  const { recordSchema, planSchema, validateRecord, validatePlan } = createValidators();
  const recordTemplateSource = read('scaffold/.agents/feedback/templates/record.yaml');
  const planTemplateSource = read('scaffold/.agents/feedback/templates/plan.yaml');
  const recordTemplate = parseYaml(recordTemplateSource);
  const planTemplate = parseYaml(planTemplateSource);

  assert.deepEqual(Object.keys(recordTemplate), recordSchema.required);
  assert.deepEqual(Object.keys(planTemplate), planSchema.required);
  assert.equal(validateRecord(recordTemplate), true, JSON.stringify(validateRecord.errors));
  assert.equal(validatePlan(planTemplate), true, JSON.stringify(validatePlan.errors));
  assert.doesNotMatch(recordTemplateSource, /schema_version|created_at|updated_at|completed_at|suggested_actions|sensitivity/);
  assert.doesNotMatch(planTemplateSource, /schema_version|phases|source_action_id/);
  assert.match(recordTemplateSource, /# evidence:/);
  assert.match(planTemplateSource, /# outcome:/);
});

test('local boundary is tracked while personal additions remain ignored', () => {
  const ignore = read('scaffold/.agents/feedback/local/.gitignore');
  const localReadme = read('scaffold/.agents/feedback/local/README.md');
  const operational = read('scaffold/.agents/feedback/AGENTS.final.md');

  assert.match(ignore, /^\*$/m);
  assert.match(ignore, /^!\.gitignore$/m);
  assert.match(ignore, /^!README\.md$/m);
  assert.match(localReadme, /cannot weaken root repository instructions/i);
  assert.match(operational, /lower priority/i);
});

test('public repository support files and release channels remain present', () => {
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

  const ciWorkflow = read('.github/workflows/ci.yml');
  const releaseWorkflow = read('.github/workflows/release.yml');
  assert.match(ciWorkflow, /actions\/checkout@v6/);
  assert.match(ciWorkflow, /actions\/setup-node@v6/);
  assert.match(ciWorkflow, /run: npm ci/);
  assert.match(releaseWorkflow, /actions\/checkout@v6/);
  assert.match(releaseWorkflow, /actions\/setup-node@v6/);
  assert.match(releaseWorkflow, /actions\/upload-artifact@v7/);
  assert.match(releaseWorkflow, /run: npm ci/);
  assert.match(read('.github/dependabot.yml'), /package-ecosystem: "npm"/);
});
