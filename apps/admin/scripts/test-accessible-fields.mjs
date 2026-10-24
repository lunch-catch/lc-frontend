import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as icons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const loaded = new Map();
const load = (filename) => {
  if (loaded.has(filename)) return loaded.get(filename);
  const exports = {};
  loaded.set(filename, exports);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    Date,
    Intl,
    Set,
  })(exports, (name) => {
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (name === 'lucide-react') return icons;
    const base = path.resolve(path.dirname(filename), name);
    const dependency = ['.ts', '.tsx']
      .map((ext) => base + ext)
      .find(existsSync);
    if (!dependency) throw new Error('Missing dependency: ' + name);
    return load(dependency);
  });
  return exports;
};
const root = fileURLToPath(
  new URL('../../../packages/ui/src/components/', import.meta.url),
);
const { SelectField } = load(path.join(root, 'SelectField/SelectField.tsx'));
const { DateRangePicker } = load(
  path.join(root, 'DateRangePicker/DateRangePicker.tsx'),
);

test('select accessible name includes its visible option', () => {
  const markup = renderToStaticMarkup(
    React.createElement(SelectField, {
      'aria-label': '상태',
      value: 'ALL',
      options: [{ value: 'ALL', label: '상태 전체' }],
    }),
  );
  assert.ok(markup.includes('aria-label="상태: 상태 전체"'));
});
test('select accessible name includes placeholder', () => {
  const markup = renderToStaticMarkup(
    React.createElement(SelectField, {
      'aria-label': '상태',
      placeholder: '상태 선택',
      options: [],
    }),
  );
  assert.ok(markup.includes('aria-label="상태: 상태 선택"'));
});
test('date range accessible name includes visible dates', () => {
  const markup = renderToStaticMarkup(
    React.createElement(DateRangePicker, {
      ariaLabel: '조회 기간',
      value: { startDate: '2026-10-17', endDate: '2026-10-23' },
      todayDate: '2026-10-24',
    }),
  );
  assert.ok(markup.includes('aria-label="조회 기간: 2026.10.17 ~ 2026.10.23"'));
});
test('empty date range accessible name includes placeholder', () => {
  const markup = renderToStaticMarkup(
    React.createElement(DateRangePicker, {
      ariaLabel: '날짜',
      placeholder: '조회 날짜 선택',
      todayDate: '2026-10-24',
    }),
  );
  assert.ok(markup.includes('aria-label="날짜: 조회 날짜 선택"'));
});
