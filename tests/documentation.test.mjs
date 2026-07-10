import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { discoverFiles } from '../scripts/lib/discovery.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

/**
 * @param {string} source
 * @returns {Set<string>}
 */
function headingAnchors(source) {
  return new Set(source.split(/\r?\n/)
    .map((line) => /^#{1,6}\s+(.+?)\s*$/.exec(line)?.[1])
    .filter(Boolean)
    .map((heading) => heading.toLowerCase()
      .replace(/[`*_]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')));
}

test('discovered Markdown documentation has no broken local links', () => {
  const documentation = discoverFiles(repoRoot, { extensions: ['.md'] });
  assert.ok(documentation.length > 0, 'no Markdown documentation discovered');

  for (const filePath of documentation) {
    const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
    const source = fs.readFileSync(filePath, 'utf8');
    const links = source.matchAll(/(?<!!)\[[^\r\n]+]\(([^)]+)\)/g);

    for (const match of links) {
      const destination = match[1].trim().replace(/^<|>$/g, '');
      if (/^[a-z][a-z0-9+.-]*:/i.test(destination)) {
        continue;
      }

      const [linkPath, fragment] = destination.split('#', 2);
      const resolved = linkPath
        ? path.resolve(path.dirname(filePath), decodeURIComponent(linkPath))
        : filePath;
      assert.ok(fs.existsSync(resolved), `${relativePath} has broken local link: ${destination}`);
      if (fragment && path.extname(resolved).toLowerCase() === '.md') {
        const anchors = headingAnchors(fs.readFileSync(resolved, 'utf8'));
        assert.ok(anchors.has(decodeURIComponent(fragment)), `${relativePath} has broken heading link: ${destination}`);
      }
    }
  }
});
