#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REQUIRED_SECTIONS = [
  'What This Provides',
  'Highlights',
  'Installation',
  'Validation',
  'Notes',
];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function releaseNotesPathForTag(tag) {
  return path.join('docs', 'releases', `${tag}.md`);
}

export function releaseTitleForTag(tag) {
  return `agents-feedback ${tag}`;
}

/**
 * @param {string} source
 * @returns {Array<{level: number, text: string, line: number}>}
 */
function markdownHeadings(source) {
  const headings = [];
  const lines = source.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const match = /^(#{1,6}) ([^\n#].*?)\s*$/.exec(line);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: index + 1,
      });
    }
  }

  return headings;
}

export function verifyReleaseNotes(notesPath, tag) {
  const errors = [];

  if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
    return {
      ok: false,
      errors: [`release tag must use vX.Y.Z format: ${tag}`],
    };
  }

  if (!fs.existsSync(notesPath)) {
    return {
      ok: false,
      errors: [`release notes file does not exist: ${notesPath}`],
    };
  }

  const source = fs.readFileSync(notesPath, 'utf8');
  const lines = source.split(/\r?\n/);
  const expectedTitle = `# ${releaseTitleForTag(tag)}`;
  if ((lines[0] ?? '') !== expectedTitle) {
    errors.push(`first line must be exactly: ${expectedTitle}`);
  }

  const headings = markdownHeadings(source);
  const h1Headings = headings.filter((heading) => heading.level === 1);
  if (h1Headings.length !== 1) {
    errors.push(`release notes must contain exactly one H1 heading; found ${h1Headings.length}`);
  }

  const requiredHeadings = REQUIRED_SECTIONS.map((section) => {
    const heading = headings.find((candidate) => candidate.level === 2 && candidate.text === section);
    if (!heading) {
      errors.push(`missing required section: ${section}`);
    }
    return heading;
  });

  const existingRequiredHeadings = requiredHeadings.filter(Boolean);
  for (let index = 1; index < existingRequiredHeadings.length; index += 1) {
    const previous = existingRequiredHeadings[index - 1];
    const current = existingRequiredHeadings[index];
    if (previous.line > current.line) {
      errors.push(`required section order is wrong: ${previous.text} appears after ${current.text}`);
    }
  }

  const firstRequiredHeading = requiredHeadings[0];
  const subtitle = headings.find(
    (heading) => heading.level === 2
      && heading.text !== REQUIRED_SECTIONS[0]
      && firstRequiredHeading
      && heading.line > 1
      && heading.line < firstRequiredHeading.line,
  );
  if (!subtitle) {
    errors.push(`missing H2 subtitle before ${REQUIRED_SECTIONS[0]}`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function releaseNotesBody(notesPath) {
  const lines = fs.readFileSync(notesPath, 'utf8').split(/\r?\n/);
  return `${lines.slice(1).join('\n').trimStart()}`;
}

function main() {
  const [, , fileArg, tagArg] = process.argv;

  let tag;
  let notesPath;
  if (!fileArg && !tagArg) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    tag = `v${packageJson.version}`;
    notesPath = releaseNotesPathForTag(tag);
  } else if (fileArg && tagArg) {
    tag = tagArg;
    notesPath = fileArg === '--tag' ? releaseNotesPathForTag(tag) : fileArg;
  } else {
    console.error('usage: node scripts/lib/release-notes.mjs [<notes-file|--tag> <vX.Y.Z>]');
    process.exitCode = 2;
    return;
  }

  const result = verifyReleaseNotes(notesPath, tag);

  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`release-notes: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`release-notes: ${notesPath} matches ${tag}`);
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  main();
}
