import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'build-release-artifact.mjs');

test('release artifact check stages installable .agents feedback tree only', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'AGENTS.md')),
  );
  assert.ok(
    fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'INSTALL.md')),
  );
  assert.ok(
    fs.existsSync(path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'AGENTS.final.md')),
  );
  assert.ok(
    fs.existsSync(
      path.join(repoRoot, 'dist', 'artifact', '.agents', 'feedback', 'tools', 'feedback-state.mjs'),
    ),
  );
  assert.ok(!fs.existsSync(path.join(repoRoot, 'dist', 'artifact', 'package.json')));
});
