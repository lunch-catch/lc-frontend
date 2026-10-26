import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../src/hooks/usePaginationTotal.ts', import.meta.url),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

const createHarness = () => {
  let state = null;
  const owner = {};
  const load = () => {};
  const exports = {};
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    URLSearchParams,
  })(exports, (id) => {
    assert.equal(id, 'react');
    return {
      useState: () => [
        state,
        (next) => {
          state = next;
        },
      ],
    };
  });
  return (total, loading, query, account = owner, loader = load) =>
    exports.usePaginationTotal(total, loading, query, account, loader);
};

test('페이지·개수·정렬 요청 중 전체 건수를 유지하고 새 응답의 0건도 반영한다', () => {
  const render = createHarness();
  assert.equal(render(120, false, 'status=ACTIVE&page=0&size=20'), 120);
  assert.equal(render(undefined, true, 'page=1&status=ACTIVE&size=20'), 120);
  assert.equal(
    render(
      undefined,
      true,
      'status=ACTIVE&page=0&size=50&sortBy=createdAt&sortDir=asc',
    ),
    120,
  );
  assert.equal(render(0, false, 'status=ACTIVE&page=0&size=50'), 0);
  assert.equal(render(undefined, true, 'status=ACTIVE&page=1&size=50'), 0);
});

test('필터·계정·조회 함수 변경과 오류·조회 보류에는 이전 건수를 사용하지 않는다', () => {
  const render = createHarness();
  render(120, false, 'status=ACTIVE&page=0');
  assert.equal(render(undefined, true, 'status=SUSPENDED&page=0'), undefined);
  assert.equal(render(undefined, true, 'status=ACTIVE&page=1', {}), undefined);
  assert.equal(
    render(undefined, true, 'status=ACTIVE&page=1', null),
    undefined,
  );
  assert.equal(
    render(undefined, true, 'status=ACTIVE&page=1', {}, () => {}),
    undefined,
  );
  assert.equal(render(undefined, false, 'status=ACTIVE&page=1'), undefined);
  assert.equal(render(undefined, false, null), undefined);
});
