import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const scriptPath = path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'tools', 'feedback-state.mjs');
const fixturesRoot = path.join(repoRoot, 'tests', 'fixtures');
const validRoot = path.join(fixturesRoot, 'valid-feedback');
const attentionRoot = path.join(fixturesRoot, 'attention-feedback');

function runCli(args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runJson(args = []) {
  const result = runCli(['--format', 'json', ...args]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('default text output includes aggregate and scope counts without attention', () => {
  const result = runCli(['--root', validRoot, '--stale-days', '99999']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Feedback State/);
  assert.match(result.stdout, /Counts/);
  assert.match(result.stdout, /Scope Counts/);
  assert.match(result.stdout, /Needs Attention/);
  assert.match(result.stdout, /Records/);
  assert.match(result.stdout, /Completed/);
  assert.match(result.stdout, /- new: 2/);
  assert.match(result.stdout, /- shared: 7/);
  assert.match(result.stdout, /- local: 1/);
  assert.match(result.stdout, /Needs Attention\r?\n- None/);
});

test('default JSON includes shared and local records with completed records newest first', () => {
  const payload = runJson(['--root', validRoot, '--stale-days', '99999']);

  assert.equal(path.resolve(payload.root), validRoot);
  assert.deepEqual(payload.counts, {
    new: 2,
    planned: 1,
    in_progress: 1,
    in_review: 1,
    completed: 2,
    archived: 1,
  });
  assert.equal(payload.scope_counts.shared.new, 1);
  assert.equal(payload.scope_counts.local.new, 1);
  assert.equal(payload.needs_attention.length, 0);
  assert.ok(payload.records.some((record) => record.scope === 'local'));
  assert.deepEqual(payload.completed.map((record) => record.id), [
    'fb-20260708-120000-newest-completed',
    'fb-20260704-120000-older-completed',
  ]);
});

test('--shared-only excludes local records from records and counts', () => {
  const payload = runJson(['--root', validRoot, '--shared-only', '--stale-days', '99999']);

  assert.equal(payload.records.length, 7);
  assert.ok(payload.records.every((record) => record.scope === 'shared'));
  assert.equal(payload.counts.new, 1);
  assert.equal(payload.scope_counts.local.new, 0);
});

test('--active --brief sorts severity before recency and labels scope', () => {
  const result = runCli(['--root', validRoot, '--active', '--brief']);

  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split(/\r?\n/);
  assert.equal(lines[0], 'Feedback');
  assert.match(lines[1], /\[shared:in_review].*\| high \|/);
  assert.ok(lines.some((line) => /\[local:new]/.test(line)));
  assert.ok(lines.every((line, index) => index === 0 || !line.includes(':completed]')));
});

test('area and path filters narrow records with segment-aware ancestor matching', () => {
  const area = runJson(['--root', validRoot, '--brief', '--area', 'SETUP']);
  assert.deepEqual(area.records.map((record) => record.id), ['fb-20260701-090000-new-item']);

  const api = runJson(['--root', validRoot, '--active', '--brief', '--path', 'packages/api']);
  assert.deepEqual(api.records.map((record) => record.id), [
    'fb-20260704-090000-review-item',
    'fb-20260702-090000-planned-item',
    'fb-20260701-090000-new-item',
  ]);

  const unrelated = runJson(['--root', validRoot, '--active', '--brief', '--path', 'packages/api-client']);
  assert.deepEqual(unrelated.records, []);
});

test('--status and --implemented retain lifecycle selection behavior', () => {
  const planned = runJson(['--root', validRoot, '--status', 'planned', '--stale-days', '99999']);
  assert.deepEqual(planned.records.map((record) => record.status), ['planned']);
  assert.equal(planned.counts.completed, 2);

  const completed = runJson(['--root', validRoot, '--implemented', '--stale-days', '99999']);
  assert.equal(completed.records.length, 2);
  assert.ok(completed.records.every((record) => record.status === 'completed'));
});

test('attention reports lifecycle, stale, required-field, and completion problems', () => {
  const payload = runJson(['--root', attentionRoot, '--stale-days', '14']);
  const reasons = payload.needs_attention.map((item) => item.reason);

  assert.ok(reasons.includes('missing summary'));
  assert.ok(reasons.some((reason) => reason.includes('stale')));
  assert.ok(reasons.includes('completed timestamp belongs only in completed folder'));
  assert.ok(reasons.includes('in_review records require an accepted decision'));
  assert.ok(reasons.includes('completed timestamp required in completed folder'));
});

test('bounded parser reads inline paths, nested decisions, and duplicate action IDs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-feedback-parser-'));
  const recordDir = path.join(root, 'records', 'planned');
  fs.mkdirSync(recordDir, { recursive: true });
  fs.writeFileSync(
    path.join(recordDir, 'fb-20260710-130000-parser.yaml'),
    [
      'schema: feedback-record.v1',
      'id: fb-20260710-130000-parser',
      'summary: Parser fixture',
      'observation: |',
      '  A multiline body is intentionally ignored by state discovery.',
      'paths: ["packages/api", "docs"]',
      'created: "2026-07-10T13:00:00Z"',
      'updated: "2026-07-10T13:00:00Z"',
      'safety: public',
      'area: tooling',
      'kind: tooling',
      'severity: low',
      'evidence: Sanitized parser evidence.',
      'actions:',
      '  - id: action-1',
      '    action: First',
      '    reason: First reason',
      '    effort: low',
      '    risk: low',
      '  - id: action-1',
      '    action: Second',
      '    reason: Second reason',
      '    effort: low',
      '    risk: low',
      'decision:',
      '  status: accepted',
      '  reviewer: maintainer',
      '  reason: Parser coverage',
      '  action: action-1',
      '',
    ].join('\n'),
  );

  const payload = runJson(['--root', root]);
  assert.deepEqual(payload.records[0].paths, ['packages/api', 'docs']);
  assert.ok(payload.needs_attention.some((item) => item.reason === 'duplicate action id: action-1'));
});

test('invalid and conflicting options exit with code 1', () => {
  const cases = [
    ['--root', validRoot, '--status', 'done'],
    ['--root', validRoot, '--active', '--status', 'new'],
    ['--root', validRoot, '--active', '--implemented'],
    ['--root', validRoot, '--area', 'docs', '--area', 'tests'],
    ['--root', validRoot, '--path', ''],
  ];

  for (const args of cases) {
    const result = runCli(args);
    assert.equal(result.status, 1, `${args.join(' ')} unexpectedly succeeded`);
  }
});

test('default root is the parent of the installed tools directory', () => {
  const payload = runJson(['--shared-only']);
  assert.equal(path.resolve(payload.root), path.join(repoRoot, 'scaffold', '.agents', 'feedback'));
});
