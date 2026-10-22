import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const adminA = { adminId: 1, name: 'A', role: 'SUPER_ADMIN' };
const adminB = { adminId: 2, name: 'B', role: 'SUPER_ADMIN' };
const success = (admin = adminA) =>
  Response.json({ code: 'SUCCESS', data: admin });
const expired = () => Response.json({ code: 'AUTH-005' }, { status: 401 });
const credentials = { loginId: 'test', password: 'test' };
const deferred = () => {
  let resolve;
  const promise = new Promise((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
};

/**
 * 브라우저 없이 실제 요청 모듈과 Store를 검사한다.
 * 테스트마다 모듈 상태를 격리하고 fetch만 교체해 응답 순서를 제어한다.
 */
const setup = (fetchMock) => {
  const context = vm.createContext({
    fetch: fetchMock,
    Response,
    Date,
    Promise,
    Set,
    Error,
    Number,
    JSON,
  });
  const modules = {};
  for (const [key, path] of [
    ['client', 'api/client.ts'],
    ['listResponse', 'api/listResponse.ts'],
    ['auth', 'api/auth.ts'],
    ['store', 'auth/adminAuthStore.ts'],
  ]) {
    const source = readFileSync(
      new URL(`../src/${path}`, import.meta.url),
      'utf8',
    ).replace('import.meta.env.VITE_API_BASE_URL', "'http://test'");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const exports = {};
    vm.runInContext(`(function(exports, require) { ${outputText}\n})`, context)(
      exports,
      (name) => modules[name.split('/').at(-1)],
    );
    modules[key] = exports;
  }
  return modules;
};

test('동일 세션의 동시 인증 오류는 재발급 한 번 후 각각 재시도한다', async () => {
  let refreshes = 0;
  const calls = new Map();
  const { client, store } = setup(async (url, options) => {
    assert.equal(options.credentials, 'include');
    if (url.endsWith('/tokens')) return success();
    if (url.endsWith(':refresh')) {
      refreshes++;
      assert.equal(options.body, undefined);
      return success();
    }
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    return count === 1 ? expired() : success();
  });
  await store.loginAdmin(credentials);
  await Promise.all([
    client.request('/v1/admin/members'),
    client.request('/v1/admin/admins', { method: 'POST', body: '{}' }),
  ]);
  assert.equal(refreshes, 1);
  assert.deepEqual([...calls.values()], [2, 2]);
});

test('A의 늦은 인증 오류는 B의 쿠키로 계정 발급을 재전송하지 않는다', async () => {
  const response = deferred();
  let current = adminA,
    protectedCalls = 0;
  const { client, store } = setup(async (url, options) => {
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    if (url.endsWith('/tokens')) return success(current);
    protectedCalls++;
    return response.promise;
  });
  await store.loginAdmin(credentials);
  const request = client.request('/v1/admin/admins', {
    method: 'POST',
    body: '{}',
  });
  const rejected = assert.rejects(request, (error) => error.status === 0);
  await store.logoutAdmin();
  current = adminB;
  await store.loginAdmin(credentials);
  response.resolve(expired());
  await rejected;
  assert.equal(protectedCalls, 1);
  assert.equal(store.getAuthState().admin.adminId, 2);
});

test('이전 세션의 재시도 실패가 새로 로그인한 계정을 만료시키지 않는다', async () => {
  const response = deferred();
  let current = adminA,
    protectedCalls = 0;
  const { client, store } = setup(async (url, options) => {
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    if (url.endsWith('/tokens') || url.endsWith(':refresh'))
      return success(current);
    protectedCalls++;
    return protectedCalls === 1 ? expired() : response.promise;
  });
  await store.loginAdmin(credentials);
  const request = client.request('/v1/admin/members');
  const rejected = assert.rejects(request, (error) => error.status === 0);
  await setImmediate();
  assert.equal(protectedCalls, 2);
  await store.logoutAdmin();
  current = adminB;
  await store.loginAdmin(credentials);
  response.resolve(expired());
  await rejected;
  assert.equal(store.getAuthState().admin.adminId, 2);
});

test('계정 변경 뒤에 도착한 이전 세션의 성공 응답도 폐기한다', async () => {
  const response = deferred();
  let current = adminA;
  const { client, store } = setup(async (url) =>
    url.endsWith('/tokens') ? success(current) : response.promise,
  );
  await store.loginAdmin(credentials);
  const request = client.request('/v1/admin/members');
  const rejected = assert.rejects(request, (error) => error.status === 0);
  current = adminB;
  await store.loginAdmin(credentials);
  response.resolve(success(adminA));
  await rejected;
  assert.equal(store.getAuthState().admin.adminId, 2);
});

test('재발급 응답의 계정이 달라지면 기존 요청을 재시도하지 않는다', async () => {
  let protectedCalls = 0;
  const { client, store } = setup(async (url) => {
    if (url.endsWith('/tokens')) return success();
    if (url.endsWith(':refresh')) return success(adminB);
    protectedCalls++;
    return expired();
  });
  await store.loginAdmin(credentials);
  await assert.rejects(
    client.request('/v1/admin/admins', { method: 'POST', body: '{}' }),
    (error) => error.status === 0,
  );
  assert.equal(protectedCalls, 1);
  assert.equal(store.getAuthState().admin.adminId, 2);
});

test('같은 세션에서 재시도도 만료되면 인증을 초기화하고 반복하지 않는다', async () => {
  let protectedCalls = 0;
  const { client, store } = setup(async (url) => {
    if (url.endsWith('/tokens') || url.endsWith(':refresh')) return success();
    protectedCalls++;
    return expired();
  });
  await store.loginAdmin(credentials);
  await assert.rejects(
    client.request('/v1/admin/members'),
    (error) => error.code === 'AUTH-005',
  );
  assert.equal(protectedCalls, 2);
  assert.equal(store.getAuthState().admin, null);
});
