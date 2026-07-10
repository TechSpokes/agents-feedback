import fs from 'node:fs';
import path from 'node:path';

const defaultIgnoredDirectories = new Set(['.git', '.idea', '.intake', 'dist', 'node_modules']);

/**
 * Discovers regular files beneath a directory with optional extension and directory filters.
 * @param {string} root Absolute or relative directory to traverse.
 * @param {{extensions?: string[], excludedDirectories?: string[]}} [options] Discovery filters using lowercase-insensitive extensions and root-relative excluded directories.
 * @returns {string[]} Sorted file paths in the same path form as `root`.
 * @throws {Error} When the root or a traversed directory cannot be read.
 * @sideEffects Reads the directory tree synchronously.
 */
export function discoverFiles(root, options = {}) {
  const extensions = new Set((options.extensions ?? []).map((extension) => extension.toLowerCase()));
  const excludedDirectories = new Set(options.excludedDirectories ?? []);
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      const relativePath = path.relative(root, entryPath).split(path.sep).join('/');
      if (entry.isDirectory() && (defaultIgnoredDirectories.has(entry.name) || excludedDirectories.has(relativePath))) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && (extensions.size === 0 || extensions.has(path.extname(entry.name).toLowerCase()))) {
        files.push(entryPath);
      }
    }
  }

  walk(root);
  return files.sort();
}
