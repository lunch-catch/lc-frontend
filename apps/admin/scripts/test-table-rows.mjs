import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as React from 'react';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../src/ui/DataTable/tableColumnPreferences.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const exports = {};
vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {})(
  exports,
  (name) => {
    if (name === 'react') return React;
    throw Error('Unexpected import: ' + name);
  },
);
const { reorderTableChildren } = exports;
const Row = ({ children }) => React.createElement('tr', null, children);
const Header = ({ children }) => React.createElement('th', null, children);
const Deferred = () => null;
const renderRow = () =>
  React.createElement(
    Row,
    null,
    ['ID', 'Name', 'Amount'].map((value) =>
      React.createElement('td', { key: value }, value),
    ),
  );

test('가상 행에도 표시 열 순서와 숨김 설정을 적용한다', () => {
  const tree = React.createElement(Deferred, { renderRow, colSpan: 3 });
  const result = reorderTableChildren(tree, [2, 0], 3, Row, Header, [
    {},
    {},
    { align: 'right' },
  ]);
  assert.equal(result[0].props.colSpan, 2);
  const row = result[0].props.renderRow({});
  const cells = React.Children.toArray(row.props.children);
  assert.deepEqual(
    cells.map((cell) => cell.props.children),
    ['Amount', 'ID'],
  );
  assert.equal(cells[0].props.style.textAlign, 'right');
});

test('가상 행을 중복 변환해도 숨긴 열을 되살리지 않는다', () => {
  const first = reorderTableChildren(
    React.createElement(Deferred, { renderRow }),
    [2, 0],
    3,
    Row,
    Header,
  );
  const second = reorderTableChildren(first, [0, 1], 2, Row, Header);
  const cells = React.Children.toArray(
    second[0].props.renderRow({}).props.children,
  );
  assert.deepEqual(
    cells.map((cell) => cell.props.children),
    ['Amount', 'ID'],
  );
});
