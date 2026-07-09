#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUSES = ['new', 'planned', 'in_progress', 'in_review', 'completed', 'archived'];
const ACTIVE_STALE_STATUSES = new Set(['planned', 'in_progress', 'in_review']);
const YAML_FIELDS = new Set([
  'schema_version',
  'id',
  'title',
  'status',
  'created_at',
  'updated_at',
  'completed_at',
  'area',
  'kind',
  'severity',
  'decision',
]);

function usage() {
  return [
    'Usage: node feedback-state.mjs [options]',
    '',
    'Options:',
    '  --root <path>            Feedback root. Defaults to the parent of tools/.',
    '  --format text|json       Output format. Defaults to text.',
    '  --status <status>        Filter records by lifecycle status.',
    '  --implemented            Alias for --status completed.',
    '  --stale-days <number>    Days before active records are stale. Defaults to 14.',
    '  --help                   Show this help.',
    '',
    `Valid statuses: ${STATUSES.join(', ')}`,
  ].join('\n');
}

function fail(message) {
  console.error(`feedback-state: ${message}`);
  process.exitCode = 1;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    root: undefined,
    format: 'text',
    status: undefined,
    implemented: false,
    staleDays: 14,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--root') {
      options.root = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--format') {
      options.format = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--status') {
      if (options.status) {
        throw new Error('--status may only be provided once');
      }
      options.status = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--implemented') {
      options.implemented = true;
      continue;
    }

    if (arg === '--stale-days') {
      const rawValue = requireValue(argv, index, arg);
      const staleDays = Number(rawValue);
      if (!Number.isFinite(staleDays) || staleDays < 0) {
        throw new Error('--stale-days must be a non-negative number');
      }
      options.staleDays = staleDays;
      index += 1;
      continue;
    }

    throw new Error(`unknown argument: ${arg}`);
  }

  if (!['text', 'json'].includes(options.format)) {
    throw new Error(`invalid format: ${options.format}`);
  }

  if (options.status && options.implemented) {
    throw new Error('--implemented is mutually exclusive with --status');
  }

  if (options.implemented) {
    options.status = 'completed';
  }

  if (options.status && !STATUSES.includes(options.status)) {
    throw new Error(`invalid status: ${options.status}`);
  }

  return options;
}

function defaultRoot() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.dirname(path.dirname(scriptPath));
}

function assertDirectory(directory, message) {
  let stats;
  try {
    stats = fs.statSync(directory);
  } catch {
    throw new Error(message);
  }

  if (!stats.isDirectory()) {
    throw new Error(message);
  }
}

function normalizeRecordPath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function isYamlFile(filePath) {
  return /\.ya?ml$/i.test(filePath);
}

function walkYamlFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkYamlFiles(entryPath));
    } else if (entry.isFile() && isYamlFile(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function stripInlineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if ((char === '"' || char === "'") && previous !== '\\') {
      if (!quote) {
        quote = char;
      } else if (quote === char) {
        quote = null;
      }
      continue;
    }

    if (char === '#' && !quote && (index === 0 || /\s/.test(previous))) {
      return value.slice(0, index).trimEnd();
    }
  }

  return value.trimEnd();
}

function parseScalar(rawValue) {
  const value = stripInlineComment(rawValue).trim();

  if (value === '' || value === '""' || value === "''") {
    return '';
  }

  if (value === 'null' || value === '~') {
    return null;
  }

  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

function parseYamlTopLevelScalars(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const record = {};

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#') || /^\s/.test(line)) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*):(?:\s*(.*))?$/.exec(line);
    if (!match) {
      continue;
    }

    const [, key, rawValue = ''] = match;
    if (YAML_FIELDS.has(key)) {
      record[key] = parseScalar(rawValue);
    }
  }

  return record;
}

function discoverRecords(root) {
  const recordsDir = path.join(root, 'records');
  assertDirectory(recordsDir, `missing records directory: ${recordsDir}`);

  const records = [];
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));

  for (const folder of STATUSES) {
    const lifecycleDir = path.join(recordsDir, folder);
    let stats;
    try {
      stats = fs.statSync(lifecycleDir);
    } catch {
      continue;
    }

    if (!stats.isDirectory()) {
      continue;
    }

    for (const filePath of walkYamlFiles(lifecycleDir)) {
      const fields = parseYamlTopLevelScalars(filePath);
      const record = {
        path: normalizeRecordPath(root, filePath),
        folder,
        ...fields,
      };
      records.push(record);
      counts[folder] += 1;
    }
  }

  return { records, counts };
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function dateValue(value) {
  if (isBlank(value)) {
    return 0;
  }

  const time = Date.parse(String(value));
  return Number.isNaN(time) ? 0 : time;
}

function attentionItem(record, reason, includeStatusFolder = false) {
  const item = {
    path: record.path,
    reason,
  };

  if (!isBlank(record.id)) {
    item.id = record.id;
  }

  if (includeStatusFolder || !isBlank(record.status)) {
    if (!isBlank(record.status)) {
      item.status = record.status;
    }
    item.folder = record.folder;
  }

  return item;
}

function analyzeNeedsAttention(records, staleDays) {
  const needsAttention = [];
  const staleCutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;

  for (const record of records) {
    if (isBlank(record.id)) {
      needsAttention.push(attentionItem(record, 'missing id'));
    }

    if (isBlank(record.title)) {
      needsAttention.push(attentionItem(record, 'missing title'));
    }

    if (isBlank(record.status)) {
      needsAttention.push(attentionItem(record, 'missing status', true));
    } else if (record.status !== record.folder) {
      needsAttention.push(attentionItem(record, 'status/folder mismatch', true));
    }

    if (record.folder === 'completed') {
      if (isBlank(record.completed_at)) {
        needsAttention.push(
          attentionItem(record, 'completed_at required for completed records', true),
        );
      }
    } else if (!isBlank(record.completed_at)) {
      needsAttention.push(
        attentionItem(record, 'completed_at must be null until completed', true),
      );
    }

    if (ACTIVE_STALE_STATUSES.has(record.folder)) {
      const updatedAt = dateValue(record.updated_at);
      if (updatedAt > 0 && updatedAt < staleCutoff) {
        needsAttention.push(
          attentionItem(record, `stale: updated_at older than ${staleDays} days`, true),
        );
      }
    }
  }

  return needsAttention;
}

function compareCompleted(left, right) {
  const completedDiff = dateValue(right.completed_at) - dateValue(left.completed_at);
  if (completedDiff !== 0) {
    return completedDiff;
  }

  const updatedDiff = dateValue(right.updated_at) - dateValue(left.updated_at);
  if (updatedDiff !== 0) {
    return updatedDiff;
  }

  return left.path.localeCompare(right.path);
}

function buildState(options) {
  const root = path.resolve(options.root ?? defaultRoot());
  assertDirectory(root, `unreadable root: ${root}`);

  const { records, counts } = discoverRecords(root);
  const needsAttention = analyzeNeedsAttention(records, options.staleDays);
  const completed = records
    .filter((record) => record.folder === 'completed')
    .sort(compareCompleted);
  const filteredRecords = options.status
    ? records.filter((record) => record.folder === options.status)
    : records;

  return {
    root,
    counts,
    needs_attention: needsAttention,
    records: filteredRecords,
    completed,
  };
}

function formatRecordLine(record) {
  const id = isBlank(record.id) ? '(missing id)' : record.id;
  const title = isBlank(record.title) ? '(missing title)' : record.title;
  return `- [${record.folder}] ${id} - ${title} (${record.path})`;
}

function formatAttentionLine(item) {
  const details = [];
  if (item.id) {
    details.push(`id: ${item.id}`);
  }
  if (item.status) {
    details.push(`status: ${item.status}`);
  }
  if (item.folder) {
    details.push(`folder: ${item.folder}`);
  }

  const suffix = details.length > 0 ? ` (${details.join(', ')})` : '';
  return `- ${item.path}: ${item.reason}${suffix}`;
}

function formatCompletedLine(record) {
  const id = isBlank(record.id) ? '(missing id)' : record.id;
  const title = isBlank(record.title) ? '(missing title)' : record.title;
  const completedAt = isBlank(record.completed_at) ? 'none' : record.completed_at;
  const updatedAt = isBlank(record.updated_at) ? 'none' : record.updated_at;
  return `- ${id} - ${title} (completed_at: ${completedAt}, updated_at: ${updatedAt}, path: ${record.path})`;
}

function formatText(state) {
  const lines = ['Feedback State', `Root: ${state.root}`, '', 'Counts'];

  for (const status of STATUSES) {
    lines.push(`- ${status}: ${state.counts[status]}`);
  }

  lines.push('', 'Needs Attention');
  if (state.needs_attention.length === 0) {
    lines.push('- None');
  } else {
    lines.push(...state.needs_attention.map(formatAttentionLine));
  }

  lines.push('', 'Records');
  if (state.records.length === 0) {
    lines.push('- None');
  } else {
    lines.push(...state.records.map(formatRecordLine));
  }

  lines.push('', 'Completed');
  if (state.completed.length === 0) {
    lines.push('- None');
  } else {
    lines.push(...state.completed.map(formatCompletedLine));
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
    return;
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  let state;
  try {
    state = buildState(options);
  } catch (error) {
    fail(error.message);
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  process.stdout.write(formatText(state));
}

main();
