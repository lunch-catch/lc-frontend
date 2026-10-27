import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const load = (file, dependencies) => {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  vm.runInNewContext(`(function(exports, require) { ${outputText}\n})`)(
    exports,
    (id) => {
      assert.ok(id in dependencies, `Unexpected import: ${id}`);
      return dependencies[id];
    },
  );
  return exports;
};

const { ErrorState } = load('../src/ui/ErrorState/ErrorState.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'lucide-react': { RotateCw: () => null },
});

const render = ({ loading = false, error = null } = {}) => {
  let retry;
  let retries = 0;
  // 목록의 실제 오류 UI와 재조회 연결을 검증하고 별도 기능인 필터·모달은 생략한다.
  const { TemplateManagementContent } = load(
    '../src/features/template/ui/TemplateManagementContent.tsx',
    {
      react: React,
      'react/jsx-runtime': jsxRuntime,
      '@repo/ui': {
        Button: () => null,
        SearchField: () => null,
        SelectField: () => null,
      },
      'lucide-react': { Plus: () => null },
      '@admin/hooks/urlQuery': {
        queryChoice: () => null,
        queryText: () => null,
      },
      '@admin/hooks/useUrlFilters': {
        useUrlFilters: () => ({
          filters: { keyword: '', status: 'ALL', sort: 'LATEST' },
          updateFilters: () => {},
        }),
      },
      '@admin/hooks/useUrlSearch': {
        useUrlSearch: () => ({ keyword: '', draftKeyword: '' }),
      },
      '@admin/ui/AdminModal/AdminModal': { AdminModal: () => null },
      '@admin/ui/ErrorState/ErrorState': {
        ErrorState: (props) => {
          retry = props.onRetry;
          return React.createElement(ErrorState, props);
        },
      },
      '@admin/ui/FilterBar/FilterBar': { FilterBar: () => null },
      '../templateUtils': { TEMPLATE_LIMIT: 100 },
      './TemplateNameModal': { TemplateNameModal: () => null },
      './TemplatePreviewCard': { TemplatePreviewCard: () => null },
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(TemplateManagementContent, {
      loading,
      error,
      templates: [],
      refresh: () => {
        retries += 1;
      },
    }),
  );
  return { html, retry, getRetries: () => retries };
};

test('템플릿 목록 조회 실패는 오류와 재시도를 표시하고 실제 재조회를 연결한다', () => {
  const result = render({ error: '서버에 연결하지 못했습니다.' });
  assert.match(result.html, /role="alert"/);
  assert.match(result.html, /서버에 연결하지 못했습니다/);
  assert.match(result.html, /aria-label="다시 시도"/);
  assert.doesNotMatch(result.html, /조회된 템플릿이 없습니다/);
  result.retry();
  assert.equal(result.getRetries(), 1);
});

test('조회 중과 정상 빈 목록은 실패 상태로 표시하지 않는다', () => {
  const loading = render({ loading: true });
  assert.match(loading.html, /role="status"/);
  assert.doesNotMatch(loading.html, /role="alert"|다시 시도/);
  const empty = render();
  assert.match(empty.html, /조회된 템플릿이 없습니다/);
  assert.doesNotMatch(empty.html, /role="alert"|다시 시도/);
});
