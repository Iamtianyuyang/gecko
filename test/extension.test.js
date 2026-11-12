const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

const SRC = [
  'import x from "y";',
  'function calculate() {',
  '  return 42;',
  '}',
  'const tpl = `hi ${x}`;',
  'const fenced = "```";',
].join('\n');

let written;
let warned;
let failure;
let clipboardRejects = false;
let command;

const vscode = {
  window: {
    activeTextEditor: undefined,
    showWarningMessage: message => { warned = message; },
    showErrorMessage: message => { failure = message; },
  },
  env: {
    clipboard: {
      writeText: async text => {
        if (clipboardRejects) throw new Error('clipboard busy');
        written = text;
      },
    },
  },
  workspace: { asRelativePath: () => 'src/core/engine.ts' },
  commands: {
    registerCommand: (id, fn) => {
      command = { id, fn };
      return { dispose() {} };
    },
  },
};

const load = Module._load;
Module._load = function (request, ...rest) {
  return request === 'vscode' ? vscode : load.call(this, request, ...rest);
};

require('../extension.js').activate({ subscriptions: [] });

function makeDocument(text, overrides = {}) {
  const lines = text.split('\n');
  const offsetAt = p =>
    lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + Math.min(p.character, lines[p.line].length);
  const positionAt = offset => {
    let rem = offset;
    for (let i = 0; i < lines.length; i++) {
      if (rem <= lines[i].length) return { line: i, character: rem };
      rem -= lines[i].length + 1;
    }
    return { line: lines.length - 1, character: lines[lines.length - 1].length };
  };
  return {
    isUntitled: false,
    isDirty: false,
    languageId: 'typescript',
    uri: {},
    offsetAt,
    positionAt,
    getText: selection => text.slice(offsetAt(selection.start), offsetAt(selection.end)),
    ...overrides,
  };
}

async function copy({ document = makeDocument(SRC), start, end, isEmpty = false } = {}) {
  written = warned = failure = undefined;
  vscode.window.activeTextEditor = document && { document, selection: { start, end, isEmpty } };
  await command.fn();
  return { written, warned, failure };
}

test('copies a single line as a reference', async () => {
  const { written } = await copy({ start: { line: 2, character: 0 }, end: { line: 2, character: 12 } });
  assert.strictEqual(written, '@src/core/engine.ts:3-3\n\n```typescript\n  return 42;\n```');
});

test('multi-line selection ending at column 0 has no blank line before the fence', async () => {
  const { written } = await copy({ start: { line: 1, character: 0 }, end: { line: 3, character: 0 } });
  assert.strictEqual(written, '@src/core/engine.ts:2-3\n\n```typescript\nfunction calculate() {\n  return 42;\n```');
});

test('grows the fence past the longest backtick run in the code', async () => {
  const { written } = await copy({ start: { line: 5, character: 0 }, end: { line: 5, character: 24 } });
  assert.match(written, /:6-6\n\n````typescript\nconst fenced = "```";\n````$/);
});

test('keeps the three-backtick fence for a single backtick', async () => {
  const { written } = await copy({ start: { line: 4, character: 0 }, end: { line: 4, character: 22 } });
  assert.match(written, /```typescript\nconst tpl = `hi \$\{x}`;\n```$/);
});

test('handles a selection with a very large number of backtick runs', async () => {
  const text = Array(200000).fill('`').join('a');
  const document = makeDocument(text);
  const { written } = await copy({ document, start: { line: 0, character: 0 }, end: { line: 0, character: text.length } });
  assert.ok(written.startsWith('@src/core/engine.ts:1-1\n\n```typescript\n`a`'));
});

test('does nothing for an empty selection, an untitled file, or no editor', async () => {
  const empty = await copy({ start: { line: 0, character: 0 }, end: { line: 0, character: 0 }, isEmpty: true });
  assert.strictEqual(empty.written ?? empty.warned ?? empty.failure, undefined);
  assert.match((await copy({ document: makeDocument(SRC, { isUntitled: true }), start: { line: 0, character: 0 }, end: { line: 0, character: 5 } })).warned, /save/i);
  const noEditor = await copy({ document: null });
  assert.strictEqual(noEditor.written ?? noEditor.warned ?? noEditor.failure, undefined);
});

test('warns instead of copying a file with unsaved changes', async () => {
  const { written, warned } = await copy({ document: makeDocument(SRC, { isDirty: true }), start: { line: 0, character: 0 }, end: { line: 0, character: 5 } });
  assert.strictEqual(written, undefined);
  assert.match(warned, /save/i);
});

test('CRLF file ending at column 0 leaves no stray carriage return', async () => {
  const document = makeDocument('a\r\nb\r\n');
  const { written } = await copy({ document, start: { line: 0, character: 0 }, end: { line: 1, character: 0 } });
  assert.strictEqual(written, '@src/core/engine.ts:1-1\n\n```typescript\na\n```');
});

test('selection ending at the end of a file without a final newline', async () => {
  const document = makeDocument('x\ny\nz');
  const { written } = await copy({ document, start: { line: 2, character: 0 }, end: { line: 2, character: 1 } });
  assert.strictEqual(written, '@src/core/engine.ts:3-3\n\n```typescript\nz\n```');
});

test('package.json contributes exactly the commands the extension registers', () => {
  const { contributes } = require('../package.json');
  const ids = contributes.commands.map(c => c.command);
  assert.deepStrictEqual(ids, [command.id]);
  for (const binding of contributes.keybindings) assert.ok(ids.includes(binding.command), binding.command);
  for (const item of contributes.menus['editor/context']) assert.ok(ids.includes(item.command), item.command);
});

test('reports a clipboard failure instead of throwing', async () => {
  clipboardRejects = true;
  const { failure } = await copy({ start: { line: 0, character: 0 }, end: { line: 0, character: 5 } });
  clipboardRejects = false;
  assert.match(failure, /clipboard busy/);
});
