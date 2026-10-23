import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// 실제 링크 생성 함수와 부정 관리 검증 함수를 실행해 화면 사이의 기간 계약을 확인한다.
const load = (path, dependencies = {}) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    URLSearchParams,
  })(exports, (name) => dependencies[name]);
  return exports;
};
const dates = load('../src/api/analyticsDateUtils.ts');
const { getFraudDetailQuery } = load(
  '../src/features/dashboard/dashboardUtils.ts',
  { '@admin/api/analyticsDateUtils': dates },
);
const { getFraudRangeError } = load('../src/features/fraud/fraudUtils.ts');

for (const [from, to, expectedFrom] of [
  ['2026-10-23', '2026-10-23', '2026-10-23'],
  ['2026-10-17', '2026-10-23', '2026-10-17'],
  ['2026-09-23', '2026-10-23', '2026-09-23'],
  ['2026-09-22', '2026-10-23', '2026-09-23'],
  ['2026-07-24', '2026-10-23', '2026-09-23'],
  ['2026-12-01', '2027-01-10', '2026-12-11'],
  ['2024-01-01', '2024-03-01', '2024-01-31'],
]) {
  test('부정 관리 링크: ' + from + ' ~ ' + to, () => {
    const query = new URLSearchParams(getFraudDetailQuery(from, to));
    assert.equal(query.get('fraud.from'), expectedFrom);
    assert.equal(query.get('fraud.to'), to);
    assert.equal(
      getFraudRangeError(query.get('fraud.from'), query.get('fraud.to')),
      '',
    );
  });
}
