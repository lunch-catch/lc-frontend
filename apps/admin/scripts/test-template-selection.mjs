import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../src/features/template/templateSelection.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const exports = {};
vm.runInNewContext('(function(exports) {' + outputText + '\n})')(exports);
const { buildSelectedTemplatePrompt, parseSelectedTemplatePrompt } = exports;

for (const source of ['preview', 'code']) {
  test(
    source + ' 선택 요청은 저장된 문구에서 태그와 원래 메시지를 복원한다',
    () => {
      const selection = {
        source,
        label: 'h1 · 점심 메뉴 🍱',
        selector: source === 'preview' ? '[data-slot="eventName"]' : undefined,
        line: 12,
        html: '<h1>점심 메뉴</h1>',
      };
      const text = '글자를 키워줘\n색상은 주황색으로 해줘';
      const saved = buildSelectedTemplatePrompt(text, selection);
      const parsed = parseSelectedTemplatePrompt(saved);
      assert.equal(parsed.text, text);
      assert.equal(parsed.targetLabel, '<h1>');
    },
  );
}

test('긴 HTML을 발췌한 요청에서도 태그와 사용자 요청은 유지한다', () => {
  const selection = {
    source: 'code',
    label: 'div',
    line: 10,
    html: '<div>' + '내용'.repeat(500) + '</div>',
  };
  const saved = buildSelectedTemplatePrompt('여백을 줄여줘', selection);
  assert.ok(saved.length <= 500);
  assert.ok(saved.includes('…'));
  assert.equal(parseSelectedTemplatePrompt(saved).text, '여백을 줄여줘');
  assert.equal(parseSelectedTemplatePrompt(saved).targetLabel, '<div>');
});

test('요청이나 코드에 구분 문구가 들어 있어도 요청 앞부분이 코드에 흡수되지 않는다', () => {
  const selection = {
    source: 'code',
    label: 'p',
    line: 3,
    html: '<p>안내\n수정 요청: 코드 속 문구</p>',
  };
  const text = '첫 줄\n수정 요청: 두 번째 줄';
  const saved = buildSelectedTemplatePrompt(text, selection);
  assert.ok(saved.length <= 500);
  const parsed = parseSelectedTemplatePrompt(saved);
  assert.equal(parsed.text, text);
  assert.equal(parsed.targetLabel, '<p>');
});

test('길이 표기가 없는 이전 형식의 이력도 읽는다', () => {
  const saved =
    '수정 대상: h1 · 점심 메뉴\n위치: HTML 12행\n선택 코드:\n<h1>점심 메뉴</h1>\n수정 요청: 글자를 키워줘\n선택한 부분 위주로 수정하고 다른 영역과 슬롯 구조는 유지해 주세요.';
  const parsed = parseSelectedTemplatePrompt(saved);
  assert.equal(parsed.text, '글자를 키워줘');
  assert.equal(parsed.targetLabel, '<h1>');
});

test('일반 요청과 불완전한 선택 문구는 지우지 않고 원문으로 표시한다', () => {
  for (const text of [
    '',
    '주황색 포스터를 만들어줘',
    '<h1>제목</h1>을 크게 해줘',
    '수정 대상: 제목\n수정 요청: 크게 해줘',
    '안내\n수정 대상: 제목',
  ]) {
    const parsed = parseSelectedTemplatePrompt(text);
    assert.equal(parsed.text, text);
    assert.equal(parsed.targetLabel, undefined);
  }
});

test('선택 라벨은 영역명 또는 HTML 태그명만 표시한다', () => {
  for (const [label, expected] of [
    ['이벤트명', '이벤트명'],
    ['할인 내용', '할인 내용'],
    ['기간', '기간'],
    ['이미지', '이미지'],
    ['h1 · 텍스트가 포함됨', '<h1>'],
    ['div', '<div>'],
    ['<p>', '<p>'],
    ['알 수 없는 요소 본문', '선택 영역'],
  ]) {
    assert.equal(exports.formatTemplateTargetLabel(label), expected);
  }
});
