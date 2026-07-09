import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const scriptPath = path.join(
  repoRoot,
  'scaffold',
  '.agents',
  'feedback',
  'tools',
  'feedback-state.mjs',
);
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

test('text output includes required sections, counts, and no-attention marker', () => {
  const result = runCli(['--root', validRoot, '--stale-days', '99999']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Feedback State/);
  assert.match(result.stdout, /Counts/);
  assert.match(result.stdout, /Needs Attention/);
  assert.match(result.stdout, /Records/);
  assert.match(result.stdout, /Completed/);
  assert.match(result.stdout, /- new: 1/);
  assert.match(result.stdout, /- planned: 1/);
  assert.match(result.stdout, /- in_progress: 1/);
  assert.match(result.stdout, /- in_review: 1/);
  assert.match(result.stdout, /- completed: 2/);
  assert.match(result.stdout, /- archived: 1/);
  assert.match(result.stdout, /- None/);
});

test('json output includes counts, records, and completed records sorted newest first', () => {
  const payload = runJson(['--root', validRoot, '--stale-days', '99999']);

  assert.equal(path.resolve(payload.root), validRoot);
  assert.deepEqual(payload.counts, {
    new: 1,
    planned: 1,
    in_progress: 1,
    in_review: 1,
    completed: 2,
    archived: 1,
  });
  assert.deepEqual(payload.needs_attention, []);
  assert.deepEqual(payload.records.map((record) => record.status), [
    'new',
    'planned',
    'in_progress',
    'in_review',
    'completed',
    'completed',
    'archived',
  ]);
  assert.deepEqual(payload.completed.map((record) => record.id), [
    'fb-20260708-1200-newest-completed',
    'fb-20260704-1200-older-completed',
  ]);
});

test('--status filters records only', () => {
  const payload = runJson(['--root', validRoot, '--status', 'planned', '--stale-days', '99999']);

  assert.deepEqual(payload.records.map((record) => record.status), ['planned']);
  assert.equal(payload.counts.completed, 2);
  assert.equal(payload.completed.length, 2);
});

test('--implemented aliases completed records', () => {
  const payload = runJson(['--root', validRoot, '--implemented', '--stale-days', '99999']);

  assert.equal(payload.records.length, 2);
  assert.ok(payload.records.every((record) => record.status === 'completed'));
  assert.deepEqual(payload.completed.map((record) => record.id), [
    'fb-20260708-1200-newest-completed',
    'fb-20260704-1200-older-completed',
  ]);
});

test('needs_attention reports stale, mismatch, missing title, and completed_at violations', () => {
  const payload = runJson(['--root', attentionRoot, '--stale-days', '14']);

  const stale = payload.needs_attention.find((item) => item.reason.includes('stale'));
  assert.ok(stale);
  assert.equal(stale.id, 'fb-20200101-0000-stale-planned');
  assert.match(stale.path, /stale-planned\.yaml$/);

  const mismatch = payload.needs_attention.find((item) =>
    item.reason.includes('status/folder mismatch'),
  );
  assert.ok(mismatch);
  assert.equal(mismatch.id, 'fb-20260709-1000-status-mismatch');
  assert.equal(mismatch.status, 'in_progress');
  assert.equal(mismatch.folder, 'in_review');

  const missingTitle = payload.needs_attention.find((item) =>
    item.reason.includes('missing title'),
  );
  assert.ok(missingTitle);
  assert.equal(missingTitle.id, 'fb-20260709-1015-missing-title');

  const completedMissingCompletedAt = payload.needs_attention.find(
    (item) =>
      item.id === 'fb-20260709-1030-completed-missing-completed-at' &&
      item.reason.includes('completed_at'),
  );
  assert.ok(completedMissingCompletedAt);

  const plannedWithCompletedAt = payload.needs_attention.find(
    (item) =>
      item.id === 'fb-20260709-1045-planned-with-completed-at' &&
      item.reason.includes('completed_at'),
  );
  assert.ok(plannedWithCompletedAt);
});

test('invalid status exits with code 1', () => {
  const result = runCli(['--root', validRoot, '--status', 'done']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid status/i);
});

test('default root is the parent of the script tools directory', () => {
  const payload = runJson([]);

  assert.equal(
    path.resolve(payload.root),
    path.join(repoRoot, 'scaffold', '.agents', 'feedback'),
  );
});
