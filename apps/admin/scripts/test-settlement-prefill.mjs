import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL(
      '../src/features/billing/ui/PointAdjustmentModal.tsx',
      import.meta.url,
    ),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
);
const dependencies = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  '@repo/ui': {
    Button: () => null,
    SegmentedControl: ({ items }) =>
      React.createElement(
        'div',
        null,
        items.map((item) =>
          React.createElement('span', { key: item.value }, item.label),
        ),
      ),
    Input: ({ label, 'aria-label': ariaLabel, value, readOnly, disabled }) =>
      React.createElement('input', {
        'aria-label': label ?? ariaLabel,
        value,
        readOnly,
        disabled,
        onChange: () => {},
      }),
    DatePicker: ({ value, disabled }) =>
      React.createElement('input', {
        'aria-label': '대상 영업일',
        value,
        disabled,
        readOnly: true,
      }),
  },
  '@repo/utils': { formatPoints: String },
  '@admin/api/pointAdjustments': {
    adjustPoints: () => {
      throw new Error('Unexpected mutation');
    },
  },
  '@admin/hooks/queryDateUtils': { getKstToday: () => '2026-10-26' },
  '@admin/ui/AdminModal/AdminModal': { AdminModal: ({ children }) => children },
  '../billingManagementUtils': { getPointAdjustmentError: () => '' },
  '../useBillingMutation': {
    useBillingMutation: () => ({ busy: false, error: '' }),
  },
};
const exports = {};
// 폼의 실제 초기 상태를 렌더링하고 모달·디자인 컴포넌트·변경 요청만 대체한다.
vm.runInNewContext('(function(exports, require) {' + outputText + '\n})')(
  exports,
  (id) => {
    assert.ok(id in dependencies, 'Unexpected import: ' + id);
    return dependencies[id];
  },
);
const render = (props) =>
  renderToStaticMarkup(
    React.createElement(exports.PointAdjustmentModal, {
      onClose: () => {},
      onSaved: () => {},
      ...props,
    }),
  );
const field = (html, label) =>
  html.match(new RegExp('<input[^>]*aria-label="' + label + '"[^>]*>'))?.[0];

test('캠페인 불일치 정정은 점주·캠페인·영업일을 채우고 대상 점주를 고정한다', () => {
  for (const checkType of ['CAMPAIGN_SPEND_VS_LEDGER', 'CAMPAIGN_OVERSPEND']) {
    const html = render({
      ownerId: '999',
      mismatch: {
        mismatchId: 55,
        ownerId: 7,
        targetId: 12,
        checkType,
        businessDate: '2026-10-01',
      },
    });
    assert.match(field(html, '점주 ID'), /value="7"/);
    assert.match(field(html, '점주 ID'), /disabled/);
    assert.match(field(html, '캠페인 ID'), /value="12"/);
    assert.match(field(html, '캠페인 ID'), /disabled/);
    assert.match(field(html, '대상 영업일'), /value="2026-10-01"/);
    assert.match(field(html, '조정 포인트'), /value=""/);
    assert.match(html, /지급 \(\+\)/);
    assert.match(html, /차감 \(−\)/);
  }
});

test('결제 불일치는 점주 ID만 채우고 결제 ID를 캠페인으로 넣지 않는다', () => {
  const html = render({
    mismatch: {
      mismatchId: 55,
      ownerId: 7,
      targetId: 12345,
      checkType: 'PG_VS_CHARGE',
      businessDate: '2026-10-01',
    },
  });
  assert.match(field(html, '점주 ID'), /value="7"/);
  assert.match(field(html, '점주 ID'), /disabled/);
  assert.match(field(html, '캠페인 ID \\(선택\\)'), /value=""/);
  assert.equal(field(html, '대상 영업일'), undefined);
});

test('일반 포인트 수동 조정의 점주 입력은 기존처럼 수정할 수 있다', () => {
  const html = render({ ownerId: '22' });
  assert.match(field(html, '점주 ID'), /value="22"/);
  assert.doesNotMatch(field(html, '점주 ID'), /readonly|disabled/i);
  assert.match(html, /지급 \(\+\)/);
  assert.match(html, /차감 \(−\)/);
});
