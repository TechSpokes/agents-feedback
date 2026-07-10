import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import { discoverFiles } from '../scripts/lib/discovery.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

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
  assert.equal(new Set(recordSchema.required).size, recordSchema.required.length);
  assert.ok(recordSchema.required.every((name) => Object.hasOwn(recordSchema.properties, name)));
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
  assert.equal(new Set(planSchema.required).size, planSchema.required.length);
  assert.ok(planSchema.required.every((name) => Object.hasOwn(planSchema.properties, name)));
  assert.equal(planSchema.properties['tasks'].maxItems, undefined);
  assert.equal(planSchema.properties['tasks'].items.properties['tasks'], undefined);

  const validPlanRoot = path.join(repoRoot, 'tests', 'contract-fixtures', 'valid');
  const plans = discoverFiles(validPlanRoot, { extensions: ['.yaml', '.yml'] })
    .map((filePath) => parseYaml(fs.readFileSync(filePath, 'utf8')));
  assert.ok(plans.length > 0, 'no valid plan fixtures discovered');
  for (const plan of plans) {
    assert.equal(validatePlan(plan), true, JSON.stringify(validatePlan.errors));
  }
  assert.ok(plans.some((plan) => plan.tasks.length > 7), 'valid fixtures do not prove task guidance is non-binding');
});

test('all valid shared and local fixture records satisfy the record schema', () => {
  const { validateRecord } = createValidators();
  const root = path.join(repoRoot, 'tests', 'fixtures', 'valid-feedback');
  const fixtures = discoverFiles(root, { extensions: ['.yaml', '.yml'] });

  assert.ok(fixtures.length > 0);
  for (const filePath of fixtures) {
    const record = parseYaml(fs.readFileSync(filePath, 'utf8'));
    assert.equal(validateRecord(record), true, `${path.relative(repoRoot, filePath)}: ${JSON.stringify(validateRecord.errors)}`);
  }
});

test('every invalid contract fixture is rejected for its intended contract', () => {
  const { validateRecord, validatePlan } = createValidators();
  const root = path.join(repoRoot, 'tests', 'contract-fixtures', 'invalid');

  for (const filePath of discoverFiles(root, { extensions: ['.yaml', '.yml'] })) {
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
  const githubRoot = path.join(repoRoot, '.github');
  const githubFiles = discoverFiles(githubRoot);
  const issueTemplates = discoverFiles(path.join(githubRoot, 'ISSUE_TEMPLATE'), { extensions: ['.yml', '.yaml'] })
    .map((filePath) => fs.readFileSync(filePath, 'utf8'));
  const workflows = discoverFiles(path.join(githubRoot, 'workflows'), { extensions: ['.yml', '.yaml'] })
    .map((filePath) => fs.readFileSync(filePath, 'utf8'));
  const ciWorkflow = workflows.find((source) => /pull_request:/.test(source) && /npm run release:check/.test(source));
  const releaseWorkflow = workflows.find((source) => /gh release/.test(source) && /npm run artifact:build/.test(source));

  assert.ok(githubFiles.some((filePath) => path.basename(filePath) === 'CODEOWNERS'));
  assert.ok(githubFiles.some((filePath) => path.basename(filePath) === 'dependabot.yml'));
  assert.ok(githubFiles.some((filePath) => path.basename(filePath) === 'pull_request_template.md'));
  assert.ok(issueTemplates.some((source) => /name: Bug report/.test(source)));
  assert.ok(issueTemplates.some((source) => /name: Feature request/.test(source)));
  assert.ok(issueTemplates.some((source) => /contact_links:/.test(source)));
  assert.ok(ciWorkflow, 'CI workflow not discovered');
  assert.ok(releaseWorkflow, 'draft release workflow not discovered');
  assert.match(ciWorkflow, /actions\/checkout@v6/);
  assert.match(ciWorkflow, /actions\/setup-node@v6/);
  assert.match(ciWorkflow, /run: npm ci/);
  assert.match(releaseWorkflow, /actions\/checkout@v6/);
  assert.match(releaseWorkflow, /actions\/setup-node@v6/);
  assert.match(releaseWorkflow, /actions\/upload-artifact@v7/);
  assert.match(releaseWorkflow, /run: npm ci/);
  const dependabot = githubFiles.find((filePath) => path.basename(filePath) === 'dependabot.yml');
  assert.match(fs.readFileSync(dependabot, 'utf8'), /package-ecosystem: "npm"/);
});
