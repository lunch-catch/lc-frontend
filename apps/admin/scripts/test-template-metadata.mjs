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
      '../src/features/template/ui/TemplatePreviewCard.tsx',
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
const exports = {};
const dependencies = {
  'react/jsx-runtime': jsxRuntime,
  '@repo/ui': {
    Button: () => null,
    StatusBadge: () => null,
    Toggle: () => null,
  },
  '@repo/utils': { formatDateTime: (value) => value },
  'lucide-react': { Trash2: () => null },
  './TemplateThumbnail': { TemplateThumbnail: () => null },
};
// 카드의 실제 메타데이터를 렌더링하고 별도 기능인 썸네일·컨트롤만 생략한다.
vm.runInNewContext('(function(exports, require) {' + outputText + '\n})')(
  exports,
  (id) => {
    assert.ok(id in dependencies, 'Unexpected import: ' + id);
    return dependencies[id];
  },
);
const render = (name) =>
  renderToStaticMarkup(
    React.createElement(exports.TemplatePreviewCard, {
      template: {
        templateId: 1,
        name: '템플릿',
        status: 'DRAFT',
        active: false,
        hasDraft: true,
        html: '',
        createdAt: '',
        lastModifiedAt: null,
        lastModifiedBy: 12345,
        lastModifiedByName: name,
        lastModifiedByLoginId: 'admin.login',
        activatedBy: null,
        activatedByName: null,
        activatedAt: null,
      },
      onActivationRequest: () => {},
      onOpenTemplate: () => {},
      onDeleteRequest: () => {},
    }),
  );
test('최종 수정자는 서버가 보낸 이름만 표시하고 ID와 로그인 ID는 표시하지 않는다', () => {
  const html = render('홍길동');
  assert.match(html, /홍길동/);
  assert.doesNotMatch(html, /12345|admin\.login|>관리자</);
});
test('관리자 이름을 확인할 수 없으면 이름 자리를 빈 값 표시로 둔다', () => {
  for (const name of [null, undefined, '', '  ']) {
    const html = render(name);
    assert.match(html, /최종 수정자:<\/dt><dd[^>]*>—<\/dd>/);
    assert.doesNotMatch(html, /12345|admin\.login|>관리자</);
  }
});
