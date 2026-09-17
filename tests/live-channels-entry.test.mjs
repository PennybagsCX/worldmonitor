import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { guardBuiltOutput, shouldSkipBuiltOutput } from './_lib/built-output-guard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(root, 'dist/live-channels.html');

describe('built standalone channel management', { skip: shouldSkipBuiltOutput(htmlPath) }, () => {
  guardBuiltOutput(htmlPath);

  it('does not statically load dashboard startup or panel bundles', () => {
    const html = readFileSync(htmlPath, 'utf8');
    const entry = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/)?.[1];
    assert.ok(entry, 'standalone page must have a module entry');
    const visited = new Set();
    function visit(path) {
      if (visited.has(path)) return;
      visited.add(path);
      const source = readFileSync(path, 'utf8');
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      for (const statement of ast.statements) {
        if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))
          && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
          visit(resolve(dirname(path), statement.moduleSpecifier.text));
        }
      }
    }
    visit(resolve(root, 'dist', entry.replace(/^\//, '')));
    assert.deepEqual([...visited].filter(path => /\/(?:main|App|panels-[\w]+)-[^/]+\.js$/.test(path)), []);
  });
});
