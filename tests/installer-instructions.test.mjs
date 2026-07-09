import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('bootstrap AGENTS.md points the agent to installer instructions', () => {
  const content = read('scaffold/.agents/feedback/AGENTS.md');

  assert.match(content, /INSTALL\.md/);
  assert.match(content, /root instruction/i);
  assert.match(content, /AGENTS\.final\.md/);
  assert.doesNotMatch(content, /Manual mode/i);
});

test('root hook template uses managed markers', () => {
  const content = read('scaffold/.agents/feedback/templates/root-agents-hook.md');

  assert.match(content, /agents-feedback:start/);
  assert.match(content, /agents-feedback:end/);
  assert.match(content, /Repository Feedback/);
});

test('installer procedure defines verification and conversion steps', () => {
  const content = read('scaffold/.agents/feedback/INSTALL.md');

  assert.match(content, /node \.agents\/feedback\/tools\/feedback-state\.mjs --root \.agents\/feedback/);
  assert.match(content, /Replace `\.agents\/feedback\/AGENTS\.md`/);
  assert.match(content, /agents-feedback:start/);
  assert.match(content, /agents-feedback:end/);
});
