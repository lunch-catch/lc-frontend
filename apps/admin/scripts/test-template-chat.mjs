import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ts from 'typescript';

const load = (name, dependencies) => {
  const source = readFileSync(
    new URL('../src/features/template/ui/' + name + '.tsx', import.meta.url),
    'utf8',
  );
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  assert.equal(
    diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error)
      .length,
    0,
  );
  const exports = {};
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})')(
    exports,
    (id) => {
      assert.ok(id in dependencies, 'Unexpected import: ' + id);
      return dependencies[id];
    },
  );
  return exports;
};
const markdown = load('TemplateChatMarkdown', {
  'react/jsx-runtime': jsxRuntime,
  'react-markdown': { __esModule: true, default: Markdown },
  'remark-gfm': { __esModule: true, default: remarkGfm },
});
const { TemplateChatBubble } = load('TemplateChatBubble', {
  'react/jsx-runtime': jsxRuntime,
  './TemplateChatMarkdown': markdown,
});
const render = (text, variant = 'assistant') =>
  renderToStaticMarkup(
    React.createElement(TemplateChatBubble, { variant }, text),
  );

test('AI 답변의 제목·강조·목록·표·취소선·코드 블록을 렌더링한다', () => {
  const html = render(
    [
      '## 수정 내용',
      '',
      '**강조**와 ~~취소~~',
      '',
      '- 첫 번째',
      '- 두 번째',
      '',
      '| 항목 | 값 |',
      '| --- | --- |',
      '| 색상 | 주황 |',
      '',
      '~~~html',
      '<h1>제목</h1>',
      '~~~',
    ].join('\n'),
  );
  assert.match(html, /<h2>수정 내용<\/h2>/);
  assert.match(html, /<strong>강조<\/strong>/);
  assert.match(html, /<del>취소<\/del>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<table/);
  assert.match(html, /<pre><code/);
  assert.match(html, /&lt;h1&gt;제목&lt;\/h1&gt;/);
});

test('원시 HTML과 위험한 링크를 실행 가능한 요소로 만들지 않는다', () => {
  const html = render(
    '<script>alert(1)</script>\n\n[링크](javascript:alert)\n\n![이미지](https://example.com/image.png)',
  );
  assert.doesNotMatch(html, /<script|href="javascript:|<img/);
  assert.match(html, /&lt;script&gt;/);
});

test('사용자 메시지는 마크다운으로 변환하지 않는다', () => {
  const html = render('**이 문구**를 넣어줘 <h1>', 'user');
  assert.doesNotMatch(html, /<strong>|<h1>/);
  assert.match(html, /\*\*이 문구\*\*/);
  assert.match(html, /&lt;h1&gt;/);
});
