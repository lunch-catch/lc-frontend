import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const setup = () => {
  let now = 0;
  const source = readFileSync(
    new URL('../src/hooks/apiResourceCache.ts', import.meta.url),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext('(function(exports) {' + outputText + '\n})', {
    Date: { now: () => now },
  })(exports);
  return {
    cache: exports.apiResourceCache,
    advance: (ms) => {
      now += ms;
    },
  };
};

test('같은 세션·조회 함수·조건에서 성공 응답을 재사용한다', () => {
  const { cache } = setup();
  const owner = {},
    load = () => {},
    data = { items: [1] };
  cache.write(owner, load, 'page=0', data);
  assert.equal(cache.read(owner, load, 'page=0').data, data);
  assert.equal(cache.read(owner, load, 'page=1'), undefined);
  assert.equal(
    cache.read(owner, () => {}, 'page=0'),
    undefined,
  );
});

test('동일한 관리자 ID라도 재로그인한 인증 객체는 이전 응답을 보지 않는다', () => {
  const { cache } = setup();
  const first = { adminId: 1 },
    next = { adminId: 1 },
    load = () => {};
  cache.write(first, load, '', { secret: 'previous session' });
  assert.equal(cache.read(next, load, ''), undefined);
});

test('30초 이내 재진입은 재사용하고 만료된 응답은 다시 읽는다', () => {
  const { cache, advance } = setup();
  const owner = {},
    load = () => {};
  cache.write(owner, load, '', 0);
  advance(29999);
  assert.equal(cache.read(owner, load, '').data, 0);
  advance(1);
  assert.equal(cache.read(owner, load, ''), undefined);
});

test('변경 후 같은 조회 함수의 모든 페이지·필터 캐시를 비운다', () => {
  const { cache } = setup();
  const owner = {},
    otherOwner = {},
    load = () => {},
    otherLoad = () => {};
  cache.write(owner, load, 'page=0', 1);
  cache.write(owner, load, 'page=1', 2);
  cache.write(owner, otherLoad, '', 3);
  cache.write(otherOwner, load, '', 4);
  cache.invalidate(owner, load);
  assert.equal(cache.read(owner, load, 'page=0'), undefined);
  assert.equal(cache.read(owner, load, 'page=1'), undefined);
  assert.equal(cache.read(owner, otherLoad, '').data, 3);
  assert.equal(cache.read(otherOwner, load, '').data, 4);
});

test('계정별 캐시는 최근 32건만 유지하고 같은 조건을 덮어쓴다', () => {
  const { cache } = setup();
  const owner = {},
    load = () => {};
  for (let i = 0; i < 33; i++) cache.write(owner, load, String(i), i);
  assert.equal(cache.read(owner, load, '0'), undefined);
  assert.equal(cache.read(owner, load, '1').data, 1);
  cache.write(owner, load, '1', 99);
  assert.equal(cache.read(owner, load, '1').data, 99);
  assert.equal(cache.read(owner, load, '2').data, 2);
});

test('무효화 전에 시작된 요청은 캐시 세대가 달라져 완료 결과를 재사용하지 않는다', () => {
  const { cache } = setup();
  const owner = {},
    load = () => {};
  const started = cache.revision(owner, load);
  cache.invalidate(owner, load);
  assert.notEqual(cache.revision(owner, load), started);
  assert.equal(cache.revision({}, load), 0);
  assert.equal(
    cache.revision(owner, () => {}),
    0,
  );
});
