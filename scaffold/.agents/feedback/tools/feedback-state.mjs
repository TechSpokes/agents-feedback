#!/usr/bin/env node
/**
 * Summarizes shared and local feedback records without installed dependencies.
 * @since 1.0.0
 * @constraints Parses only the bounded YAML fields required for discovery and attention checks.
 * @see ../schemas/record.schema.json
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const STATUSES = ['new', 'planned', 'in_progress', 'in_review', 'completed', 'archived'];
const ACTIVE_STATUSES = new Set(['new', 'planned', 'in_progress', 'in_review']);
const STALE_STATUSES = new Set(['planned', 'in_progress', 'in_review']);
const ARCHIVE_DECISIONS = new Set(['declined', 'duplicate', 'obsolete', 'transferred', 'retained']);
const VALID_KINDS = new Set([
  'unknown',
  'instruction',
  'setup',
  'tooling',
  'workflow',
  'verification',
  'documentation',
  'environment',
  'other',
]);
const VALID_SEVERITIES = new Set(['unknown', 'low', 'medium', 'high']);
const VALID_SAFETY = new Set(['unreviewed', 'public', 'internal']);
const TOP_LEVEL_SCALARS = new Set([
  'schema',
  'id',
  'summary',
  'observation',
  'created',
  'updated',
  'safety',
  'area',
  'kind',
  'severity',
  'evidence',
  'impact',
  'occurrences',
  'hypothesis',
  'confidence',
  'reproduction',
  'completed',
]);

function usage() {
  return [
    'Usage: node feedback-state.mjs [options]',
    '',
    'Options:',
    '  --root PATH              Feedback root. Defaults to the parent of tools/.',
    '  --format text|json       Output format. Defaults to text.',
    '  --status STATUS          Filter records by lifecycle status.',
    '  --implemented            Alias for --status completed.',
    '  --stale-days DAYS        Days before active records are stale. Defaults to 14.',
    '  --active                 Select unresolved active lifecycle folders.',
    '  --brief                  Print normalized scan output.',
    '  --area AREA              Filter by exact case-normalized area.',
    '  --path PATH              Filter by exact, ancestor, or descendant repository path.',
    '  --shared-only            Exclude ignored local records.',
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
    active: false,
    brief: false,
    area: undefined,
    path: undefined,
    sharedOnly: false,
    help: false,
  };
  const seenValues = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--implemented') {
      options.implemented = true;
      continue;
    }

    if (arg === '--active') {
      options.active = true;
      continue;
    }

    if (arg === '--brief') {
      options.brief = true;
      continue;
    }

    if (arg === '--shared-only') {
      options.sharedOnly = true;
      continue;
    }

    const valueOptions = new Map([
      ['--root', 'root'],
      ['--format', 'format'],
      ['--status', 'status'],
      ['--stale-days', 'staleDays'],
      ['--area', 'area'],
      ['--path', 'path'],
    ]);
    const optionName = valueOptions.get(arg);
    if (!optionName) {
      throw new Error(`unknown argument: ${arg}`);
    }
    if (seenValues.has(arg)) {
      throw new Error(`${arg} may only be provided once`);
    }

    const rawValue = requireValue(argv, index, arg);
    seenValues.add(arg);
    index += 1;

    if (arg === '--stale-days') {
      const staleDays = Number(rawValue);
      if (!Number.isFinite(staleDays) || staleDays < 0) {
        throw new Error('--stale-days must be a non-negative number');
      }
      options.staleDays = staleDays;
      continue;
    }

    options[optionName] = rawValue;
  }

  if (!['text', 'json'].includes(options.format)) {
    throw new Error(`invalid format: ${options.format}`);
  }
  if (options.status && options.implemented) {
    throw new Error('--implemented is mutually exclusive with --status');
  }
  if (options.active && (options.status || options.implemented)) {
    throw new Error('--active is mutually exclusive with --status and --implemented');
  }
  if (options.implemented) {
    options.status = 'completed';
  }
  if (options.status && !STATUSES.includes(options.status)) {
    throw new Error(`invalid status: ${options.status}`);
  }
  if (options.area) {
    options.area = options.area.toLowerCase();
  }
  if (options.path) {
    options.path = normalizeRepositoryPath(options.path);
    if (!options.path) {
      throw new Error('--path must not be empty');
    }
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

function normalizeRepositoryPath(value) {
  let normalized = String(value).trim().replace(/\\/g, '/').replace(/^\.\//, '');
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized !== '.') {
    normalized = normalized.replace(/\/$/, '');
  }
  return normalized;
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

  return files.sort(compareOrdinal);
}

function compareOrdinal(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function stripInlineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if ((char === '"' || char === "'") && previous !== '\\') {
      quote = quote === char ? null : (quote ?? char);
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
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (/^-?[0-9]+$/.test(value)) {
    return Number(value);
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

function parseInlineList(rawValue) {
  const value = stripInlineComment(rawValue).trim();
  if (!value.startsWith('[') || !value.endsWith(']')) {
    return null;
  }
  const body = value.slice(1, -1).trim();
  if (!body) {
    return [];
  }
  return body.split(',').map((item) => String(parseScalar(item)).trim());
}

function parseRecord(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const source = {
    paths: [],
    links: [],
    action_ids: [],
    plan_task_statuses: [],
  };
  let section = null;

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) {
      continue;
    }

    const topLevel = /^([A-Za-z_][A-Za-z0-9_]*):(?:\s*(.*))?$/.exec(line);
    if (topLevel) {
      const [, key, rawValue = ''] = topLevel;
      section = key;
      if (TOP_LEVEL_SCALARS.has(key)) {
        source[key] = parseScalar(rawValue);
      } else if (key === 'paths' || key === 'links') {
        const inline = parseInlineList(rawValue);
        if (inline) {
          source[key] = inline;
        }
      }
      continue;
    }

    if ((section === 'paths' || section === 'links')) {
      const item = /^\s{2}-\s+(.+?)\s*$/.exec(line);
      if (item) {
        source[section].push(String(parseScalar(item[1])));
      }
      continue;
    }

    if (section === 'decision') {
      const nested = /^\s{2}([A-Za-z_][A-Za-z0-9_]*):(?:\s*(.*))?$/.exec(line);
      if (nested) {
        source.decision ??= {};
        source.decision[nested[1]] = parseScalar(nested[2] ?? '');
      }
      continue;
    }

    if (section === 'actions') {
      const id = /^\s{2}-\s+id:\s*(.+?)\s*$/.exec(line);
      if (id) {
        source.action_ids.push(String(parseScalar(id[1])));
      }
      continue;
    }

    if (section === 'plan') {
      const taskStatus = /^\s{6}status:\s*(.+?)\s*$/.exec(line);
      if (taskStatus) {
        source.plan_task_statuses.push(String(parseScalar(taskStatus[1])));
      }
    }
  }

  return source;
}

function emptyCounts() {
  return Object.fromEntries(STATUSES.map((status) => [status, 0]));
}

function discoverScope(root, scope, recordsDir) {
  const records = [];
  const counts = emptyCounts();

  for (const folder of STATUSES) {
    const lifecycleDir = path.join(recordsDir, folder);
    for (const filePath of walkYamlFiles(lifecycleDir)) {
      const source = parseRecord(filePath);
      records.push({
        path: normalizeRecordPath(root, filePath),
        scope,
        folder,
        source,
        normalized: normalizeRecord(source, scope, folder, normalizeRecordPath(root, filePath)),
      });
      counts[folder] += 1;
    }
  }

  return { records, counts };
}

function discoverRecords(root, sharedOnly) {
  const sharedDir = path.join(root, 'records');
  assertDirectory(sharedDir, `missing records directory: ${sharedDir}`);

  const shared = discoverScope(root, 'shared', sharedDir);
  const local = sharedOnly
    ? { records: [], counts: emptyCounts() }
    : discoverScope(root, 'local', path.join(root, 'local', 'records'));
  const counts = emptyCounts();
  for (const status of STATUSES) {
    counts[status] = shared.counts[status] + local.counts[status];
  }

  return {
    records: [...shared.records, ...local.records],
    counts,
    scopeCounts: {
      shared: shared.counts,
      local: local.counts,
    },
  };
}

function normalizeRecord(source, scope, folder, recordPath) {
  return {
    path: recordPath,
    scope,
    status: folder,
    schema: source.schema,
    id: source.id,
    summary: source.summary,
    observation: source.observation,
    area: source.area ?? 'unknown',
    kind: source.kind ?? 'unknown',
    severity: source.severity ?? 'unknown',
    updated: source.updated,
    completed: source.completed,
    paths: source.paths,
    occurrences: source.occurrences ?? 1,
    safety: source.safety,
    decision: source.decision,
  };
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

function validStoredPath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  if (value === '.') {
    return true;
  }
  return !value.includes('\\')
    && !value.startsWith('/')
    && !/^[A-Za-z]:\//.test(value)
    && !value.split('/').includes('..');
}

function attentionItem(record, reason) {
  const item = {
    path: record.path,
    scope: record.scope,
    folder: record.folder,
    reason,
  };
  if (!isBlank(record.source.id)) {
    item.id = record.source.id;
  }
  return item;
}

function addAttention(items, record, condition, reason) {
  if (condition) {
    items.push(attentionItem(record, reason));
  }
}

function analyzeRecord(record, staleDays) {
  const items = [];
  const { source, folder } = record;
  const staleCutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;

  for (const field of ['schema', 'id', 'summary', 'observation', 'created', 'updated', 'safety']) {
    addAttention(items, record, isBlank(source[field]), `missing ${field}`);
  }
  addAttention(items, record, source.schema !== 'feedback-record.v1', 'invalid or missing schema identifier');
  addAttention(items, record, !Array.isArray(source.paths) || source.paths.length === 0, 'paths must contain at least one repository-relative path');
  for (const storedPath of source.paths ?? []) {
    addAttention(items, record, !validStoredPath(storedPath), `invalid repository path: ${storedPath}`);
  }
  addAttention(items, record, !VALID_SAFETY.has(source.safety), 'invalid safety value');
  addAttention(items, record, source.safety === 'unreviewed', 'safety review required before commit or handoff');
  addAttention(items, record, source.hypothesis !== undefined && isBlank(source.confidence), 'hypothesis requires confidence');
  addAttention(items, record, source.confidence !== undefined && isBlank(source.hypothesis), 'confidence requires hypothesis');
  addAttention(items, record, source.occurrences !== undefined && (!Number.isInteger(source.occurrences) || source.occurrences < 2), 'occurrences must be an integer of at least 2 when present');

  const baseName = path.basename(record.path).replace(/\.ya?ml$/i, '');
  addAttention(items, record, !isBlank(source.id) && !baseName.startsWith(source.id), 'filename must start with record id');

  const decisionStatus = source.decision?.status;
  if (folder === 'new') {
    addAttention(items, record, source.decision !== undefined, 'new records must not contain a decision');
  } else if (['planned', 'in_progress', 'in_review', 'completed'].includes(folder)) {
    addAttention(items, record, decisionStatus !== 'accepted', `${folder} records require an accepted decision`);
  } else if (folder === 'archived') {
    addAttention(items, record, !ARCHIVE_DECISIONS.has(decisionStatus), 'archived records require an archival decision');
  }

  if (decisionStatus === 'accepted') {
    addAttention(items, record, source.action_ids.length === 0, 'accepted decision requires candidate actions');
    addAttention(items, record, isBlank(source.decision?.action), 'accepted decision requires a selected action');
    addAttention(items, record, !source.action_ids.includes(source.decision?.action), 'selected action does not exist in actions');
  }
  if (decisionStatus === 'duplicate' || decisionStatus === 'transferred') {
    addAttention(items, record, source.links.length === 0, `${decisionStatus} decision requires links`);
  }

  const duplicateActions = source.action_ids.filter((id, index) => source.action_ids.indexOf(id) !== index);
  addAttention(items, record, duplicateActions.length > 0, `duplicate action id: ${duplicateActions[0]}`);

  if (folder !== 'new') {
    addAttention(items, record, isBlank(source.area), 'area should be classified after new');
    addAttention(items, record, !VALID_KINDS.has(source.kind) || source.kind === 'unknown' || isBlank(source.kind), 'kind should be classified after new');
    addAttention(items, record, !VALID_SEVERITIES.has(source.severity) || source.severity === 'unknown' || isBlank(source.severity), 'severity should be classified after new');
  }
  if (decisionStatus === 'accepted' || folder === 'completed') {
    addAttention(items, record, isBlank(source.evidence), 'accepted and completed records require evidence');
  }

  if (folder === 'completed') {
    addAttention(items, record, isBlank(source.completed), 'completed timestamp required in completed folder');
    addAttention(items, record, source.safety === 'unreviewed', 'completed records require reviewed safety');
    const unfinished = source.plan_task_statuses.find((status) => !['done', 'skipped'].includes(status));
    addAttention(items, record, Boolean(unfinished), `completed record has unfinished plan task: ${unfinished}`);
  } else {
    addAttention(items, record, !isBlank(source.completed), 'completed timestamp belongs only in completed folder');
  }

  if (STALE_STATUSES.has(folder)) {
    const updated = dateValue(source.updated);
    addAttention(items, record, updated > 0 && updated < staleCutoff, `stale: updated older than ${staleDays} days`);
  }

  return items;
}

function analyzeNeedsAttention(records, staleDays) {
  const needsAttention = records.flatMap((record) => analyzeRecord(record, staleDays));
  const recordsById = new Map();

  for (const record of records) {
    const id = record.source.id;
    if (isBlank(id)) {
      continue;
    }
    const previous = recordsById.get(id);
    if (previous) {
      needsAttention.push(attentionItem(record, `duplicate id also used by ${previous.path}`));
    } else {
      recordsById.set(id, record);
    }
  }

  return needsAttention;
}

function pathMatches(recordPaths, requestedPath) {
  if (!requestedPath || requestedPath === '.') {
    return true;
  }
  return recordPaths.some((storedPath) => {
    const recordPath = normalizeRepositoryPath(storedPath);
    return recordPath === '.'
      || recordPath === requestedPath
      || recordPath.startsWith(`${requestedPath}/`)
      || requestedPath.startsWith(`${recordPath}/`);
  });
}

function filterRecords(records, options) {
  return records.filter((record) => {
    const normalized = record.normalized;
    if (options.status && normalized.status !== options.status) {
      return false;
    }
    if (options.active && !ACTIVE_STATUSES.has(normalized.status)) {
      return false;
    }
    if (options.area && String(normalized.area).toLowerCase() !== options.area) {
      return false;
    }
    return pathMatches(normalized.paths, options.path);
  });
}

function compareCompleted(left, right) {
  const completedDiff = dateValue(right.normalized.completed) - dateValue(left.normalized.completed);
  if (completedDiff !== 0) {
    return completedDiff;
  }
  const updatedDiff = dateValue(right.normalized.updated) - dateValue(left.normalized.updated);
  return updatedDiff || compareOrdinal(left.path, right.path);
}

function compareBrief(left, right) {
  const severityRank = { high: 0, medium: 1, low: 2, unknown: 3 };
  const severityDiff = severityRank[left.normalized.severity] - severityRank[right.normalized.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }
  const updatedDiff = dateValue(right.normalized.updated) - dateValue(left.normalized.updated);
  if (updatedDiff !== 0) {
    return updatedDiff;
  }
  const idDiff = compareOrdinal(String(left.normalized.id ?? ''), String(right.normalized.id ?? ''));
  return idDiff || compareOrdinal(left.scope, right.scope);
}

function buildState(options) {
  const root = path.resolve(options.root ?? defaultRoot());
  assertDirectory(root, `unreadable root: ${root}`);

  const discovery = discoverRecords(root, options.sharedOnly);
  const needsAttention = analyzeNeedsAttention(discovery.records, options.staleDays);
  const completed = discovery.records.filter((record) => record.folder === 'completed').sort(compareCompleted);
  const selected = filterRecords(discovery.records, options);

  return {
    root,
    counts: discovery.counts,
    scope_counts: discovery.scopeCounts,
    needs_attention: needsAttention,
    records: selected,
    completed,
  };
}

function displayValue(value, fallback) {
  return isBlank(value) ? fallback : value;
}

function formatRecordLine(record) {
  const item = record.normalized;
  return `- [${item.scope}:${item.status}] ${displayValue(item.id, '(missing id)')} - ${displayValue(item.summary, '(missing summary)')} (${item.path})`;
}

function formatAttentionLine(item) {
  const id = item.id ? `, id: ${item.id}` : '';
  return `- ${item.path}: ${item.reason} (scope: ${item.scope}, folder: ${item.folder}${id})`;
}

function formatCompletedLine(record) {
  const item = record.normalized;
  return `- ${displayValue(item.id, '(missing id)')} - ${displayValue(item.summary, '(missing summary)')} (scope: ${item.scope}, completed: ${displayValue(item.completed, 'none')}, path: ${item.path})`;
}

function formatDefaultText(state) {
  const lines = ['Feedback State', `Root: ${state.root}`, '', 'Counts'];
  for (const status of STATUSES) {
    lines.push(`- ${status}: ${state.counts[status]}`);
  }

  lines.push('', 'Scope Counts');
  for (const scope of ['shared', 'local']) {
    const total = Object.values(state.scope_counts[scope]).reduce((sum, count) => sum + count, 0);
    lines.push(`- ${scope}: ${total}`);
  }

  lines.push('', 'Needs Attention');
  lines.push(...(state.needs_attention.length > 0 ? state.needs_attention.map(formatAttentionLine) : ['- None']));
  lines.push('', 'Records');
  lines.push(...(state.records.length > 0 ? state.records.map(formatRecordLine) : ['- None']));
  lines.push('', 'Completed');
  lines.push(...(state.completed.length > 0 ? state.completed.map(formatCompletedLine) : ['- None']));
  return `${lines.join('\n')}\n`;
}

function briefRecord(record) {
  return record.normalized;
}

function formatBriefText(state) {
  const records = [...state.records].sort(compareBrief);
  const lines = ['Feedback'];
  if (records.length === 0) {
    lines.push('- None');
  } else {
    for (const record of records) {
      const item = record.normalized;
      lines.push(`- [${item.scope}:${item.status}] ${displayValue(item.id, '(missing id)')} | ${item.area} | ${item.severity} | ${displayValue(item.summary, '(missing summary)')} | ${item.path}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function formatDefaultJson(state) {
  return {
    root: state.root,
    counts: state.counts,
    scope_counts: state.scope_counts,
    needs_attention: state.needs_attention,
    records: state.records.map(briefRecord),
    completed: state.completed.map(briefRecord),
  };
}

function formatBriefJson(state) {
  return {
    root: state.root,
    records: [...state.records].sort(compareBrief).map(briefRecord),
  };
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
    const payload = options.brief ? formatBriefJson(state) : formatDefaultJson(state);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  process.stdout.write(options.brief ? formatBriefText(state) : formatDefaultText(state));
}

main();
