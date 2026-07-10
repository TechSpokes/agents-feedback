import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('bootstrap instructions distinguish fresh installation from staged upgrade', () => {
  const content = read('scaffold/.agents/feedback/AGENTS.md');

  assert.match(content, /INSTALL\.md/);
  assert.match(content, /UPGRADE\.md/);
  assert.match(content, /existing managed hook/i);
  assert.match(content, /existed before extraction/i);
  assert.match(content, /pre-extraction state is unknown/i);
  assert.match(content, /Node\.js 22/i);
  assert.match(content, /AGENTS\.final\.md/);
});

test('managed root hook stays short and delegates details to operational instructions', () => {
  const content = read('scaffold/.agents/feedback/templates/root-agents-hook.md');

  assert.match(content, /agents-feedback:start/);
  assert.match(content, /agents-feedback:end/);
  assert.match(content, /substantial or unfamiliar work/i);
  assert.match(content, /observations, not canonical instructions/i);
  assert.doesNotMatch(content, /feedback-state\.mjs/);
  assert.ok(content.length < 900, `root hook template is too long: ${content.length}`);
});

test('fresh installer supports automated and manual verification', () => {
  const content = read('scaffold/.agents/feedback/INSTALL.md');

  assert.match(content, /Never extract a new artifact directly over/i);
  assert.match(content, /pre-existing `.agents` directory is allowed/i);
  assert.match(content, /pre-extraction state is unknown/i);
  assert.match(content, /node --version/);
  assert.match(content, /Node\.js 22 or newer/i);
  assert.doesNotMatch(content, /older than 18/i);
  assert.match(content, /--active --brief --shared-only/);
  assert.match(content, /Manually verify/i);
  assert.match(content, /exactly one managed feedback block/i);
  assert.match(content, /only after verification succeeds/i);
});

test('upgrade instructions require staging and preserve shared and local content', () => {
  const content = read('scaffold/.agents/feedback/UPGRADE.md');

  assert.match(content, /temporary staging directory/i);
  assert.match(content, /Never extract.*directly over/i);
  assert.match(content, /Preserve every file under.*records/i);
  assert.match(content, /Preserve personal content under.*local/i);
  assert.match(content, /Do not rewrite existing records automatically/i);
  assert.match(content, /path sets are unchanged/i);
});

test('operational instructions consume feedback and subordinate local instructions', () => {
  const content = read('scaffold/.agents/feedback/AGENTS.final.md');

  assert.match(content, /Before Substantial or Unfamiliar Work/);
  assert.match(content, /--active --brief/);
  assert.match(content, /--shared-only/);
  assert.match(content, /Read `local\/AGENTS\.md`/);
  assert.match(content, /lower priority/i);
  assert.match(content, /cannot weaken/i);
  assert.match(content, /update a match instead of creating a duplicate/i);
});

test('local ignore boundary keeps personal additions untracked', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-feedback-local-ignore-'));
  const localRoot = path.join(tempRoot, '.agents', 'feedback', 'local');
  fs.mkdirSync(path.join(localRoot, 'records', 'new'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'local', '.gitignore'),
    path.join(localRoot, '.gitignore'),
  );
  fs.copyFileSync(
    path.join(repoRoot, 'scaffold', '.agents', 'feedback', 'local', 'README.md'),
    path.join(localRoot, 'README.md'),
  );
  fs.writeFileSync(path.join(localRoot, 'AGENTS.md'), '# Local instructions\n');
  fs.writeFileSync(path.join(localRoot, 'records', 'new', 'local.yaml'), 'schema: feedback-record.v1\n');

  const init = spawnSync('git', ['init', '--quiet'], { cwd: tempRoot, encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr);

  const ignoredAgent = spawnSync('git', ['check-ignore', '--quiet', '.agents/feedback/local/AGENTS.md'], { cwd: tempRoot });
  const ignoredRecord = spawnSync('git', ['check-ignore', '--quiet', '.agents/feedback/local/records/new/local.yaml'], { cwd: tempRoot });
  const trackedReadme = spawnSync('git', ['check-ignore', '--quiet', '.agents/feedback/local/README.md'], { cwd: tempRoot });

  assert.equal(ignoredAgent.status, 0);
  assert.equal(ignoredRecord.status, 0);
  assert.equal(trackedReadme.status, 1);
});
