import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
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
const setup = (fetchMock, browser = {}) => {
  const context = vm.createContext({
    fetch: fetchMock,
    Response,
    Date,
    Promise,
    Set,
    Error,
    Number,
    JSON,
    crypto: webcrypto,
    ...browser,
  });
  const modules = {};
  for (const [key, path] of [
    ['client', 'api/client.ts'],
    ['listResponse', 'api/listResponse.ts'],
    ['auth', 'api/auth.ts'],
    ['adminAuthSync', 'auth/adminAuthSync.ts'],
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

// 서로 다른 VM이 공유하는 브라우저 잠금·저장소. 이벤트 지연도 재현한다.
const createBrowserTabs = () => {
  const values = new Map();
  const tabs = [];
  const lockNames = new Set();
  let tail = Promise.resolve();
  const locks = {
    request(name, work) {
      lockNames.add(name);
      const pending = tail.then(work);
      tail = pending.catch(() => undefined);
      return pending;
    },
  };
  return {
    lockNames,
    values,
    create() {
      const handlers = new Map();
      const tab = {
        paused: false,
        dispatch(type, event) {
          if (!tab.paused)
            handlers.get(type)?.forEach((listener) => listener(event));
        },
        window: {
          localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem(key, value) {
              values.set(key, value);
              for (const other of tabs)
                if (other !== tab)
                  queueMicrotask(() => other.dispatch('storage', { key }));
            },
          },
          addEventListener(type, listener) {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(listener);
          },
        },
        navigator: { locks },
      };
      tabs.push(tab);
      return tab;
    },
  };
};

test('여러 탭의 동시 401은 한 번만 재발급하고 각 원래 요청을 재시도한다', async () => {
  const browser = createBrowserTabs();
  const gate = deferred();
  let refreshes = 0;
  let calls = 0;
  const fetchMock = async (url) => {
    if (url.endsWith('/tokens')) return success();
    if (url.endsWith(':refresh')) {
      refreshes++;
      await gate.promise;
      return success();
    }
    calls++;
    return refreshes && calls > 2 ? success() : expired();
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  await setImmediate();
  const requests = Promise.all([
    left.client.request('/v1/admin/members'),
    right.client.request('/v1/admin/members'),
  ]);
  await setImmediate();
  assert.equal(refreshes, 1);
  gate.resolve();
  await requests;
  assert.equal(refreshes, 1);
  assert.equal(calls, 4);
  assert.equal(browser.lockNames.size, 1);
});

test('새 탭들의 초기 인증 복원도 동시에 토큰을 회전하지 않는다', async () => {
  const browser = createBrowserTabs();
  const gate = deferred();
  let refreshes = 0;
  const fetchMock = async () => {
    refreshes++;
    await gate.promise;
    return success();
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  const restores = Promise.all([
    left.store.restoreAdmin(),
    right.store.restoreAdmin(),
  ]);
  await setImmediate();
  gate.resolve();
  await restores;
  assert.equal(refreshes, 1);
  assert.equal(left.store.getAuthState().admin.adminId, 1);
  assert.equal(right.store.getAuthState().admin.adminId, 1);
});

test('다른 탭 로그인·계정 변경은 기존 요청을 재전송하지 않는다', async () => {
  const browser = createBrowserTabs();
  const gate = deferred();
  let current = adminA;
  let protectedCalls = 0;
  let refreshes = 0;
  const fetchMock = async (url) => {
    if (url.endsWith('/tokens')) return success(current);
    if (url.endsWith(':refresh')) {
      refreshes++;
      return success(current);
    }
    protectedCalls++;
    return gate.promise;
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  const request = left.client.request('/v1/admin/admins', {
    method: 'POST',
    body: '{}',
  });
  const rejected = assert.rejects(request, (error) => error.status === 0);
  current = adminB;
  await right.store.loginAdmin(credentials);
  gate.resolve(expired());
  await rejected;
  assert.equal(protectedCalls, 1);
  assert.equal(refreshes, 0);
  assert.equal(left.store.getAuthState().admin.adminId, 2);
});

test('storage 알림이 늦어도 계정 변경 후의 요청과 이전 성공 응답을 막는다', async () => {
  const browser = createBrowserTabs();
  const leftTab = browser.create();
  const gate = deferred();
  let current = adminA;
  let calls = 0;
  const fetchMock = async (url) => {
    if (url.endsWith('/tokens')) return success(current);
    calls++;
    return gate.promise;
  };
  const left = setup(fetchMock, leftTab);
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  const request = left.client.request('/v1/admin/members');
  const rejected = assert.rejects(request, (error) => error.status === 0);
  leftTab.paused = true;
  current = adminB;
  await right.store.loginAdmin(credentials);
  await assert.rejects(
    left.client.request('/v1/admin/members'),
    (error) => error.status === 0,
  );
  gate.resolve(success());
  await rejected;
  assert.equal(calls, 1);
  leftTab.paused = false;
  leftTab.dispatch('focus');
  assert.equal(left.store.getAuthState().admin.adminId, 2);
});

test('재발급과 로그아웃은 같은 잠금으로 직렬화하고 모든 탭 화면을 로그아웃한다', async () => {
  const browser = createBrowserTabs();
  const gate = deferred();
  const order = [];
  const fetchMock = async (url, options) => {
    if (options.method === 'DELETE') {
      order.push('logout');
      return new Response(null, { status: 204 });
    }
    if (url.endsWith(':refresh')) {
      order.push('refresh:start');
      await gate.promise;
      order.push('refresh:end');
    }
    return success();
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  const refresh = left.store.refreshAdmin();
  await setImmediate();
  const logout = right.store.logoutAdmin();
  await setImmediate();
  assert.deepEqual(order, ['refresh:start']);
  gate.resolve();
  await Promise.all([refresh, logout]);
  await setImmediate();
  assert.deepEqual(order, ['refresh:start', 'refresh:end', 'logout']);
  assert.equal(left.store.getAuthState().admin, null);
  assert.equal(right.store.getAuthState().admin, null);
  assert.equal(browser.lockNames.size, 1);
});

test('재사용 감지와 회전 결과 미확정은 현재 브라우저 탭들에 재로그인을 안내한다', async () => {
  for (const [status, code] of [
    [401, 'AUTH-004'],
    [503, 'AUTH-002'],
  ]) {
    const browser = createBrowserTabs();
    let refreshes = 0;
    const fetchMock = async (url) => {
      if (url.endsWith('/tokens')) return success();
      refreshes++;
      return Response.json({ code }, { status });
    };
    const left = setup(fetchMock, browser.create());
    const right = setup(fetchMock, browser.create());
    await left.store.loginAdmin(credentials);
    await assert.rejects(
      left.store.refreshAdmin(),
      (error) => error.code === code,
    );
    await setImmediate();
    assert.equal(refreshes, 1);
    assert.equal(left.store.getAuthState().admin, null);
    assert.equal(right.store.getAuthState().admin, null);
    assert.match(right.store.getAuthState().authNotice, /다시 로그인/);
    assert.doesNotMatch(right.store.getAuthState().authNotice, /모든 기기/);
  }
});

test('새로 열린 탭은 저장된 관리자 정보만 믿고 인증 복원을 생략하지 않는다', async () => {
  const browser = createBrowserTabs();
  const first = setup(async () => success(), browser.create());
  await first.store.loginAdmin(credentials);
  let refreshes = 0;
  const tab = browser.create();
  const second = setup(async () => {
    refreshes++;
    return Response.json({ code: 'AUTH-003' }, { status: 401 });
  }, tab);
  tab.dispatch('focus');
  tab.dispatch('pageshow');
  assert.equal(second.store.getAuthState().admin, null);
  await assert.rejects(second.store.restoreAdmin());
  assert.equal(refreshes, 1);
  assert.equal(second.store.getAuthState().admin, null);
  assert.equal(first.store.getAuthState().admin, null);
});

test('다른 탭의 재발급이 끝난 뒤에만 로그인 요청이 실행된다', async () => {
  const browser = createBrowserTabs();
  const gate = deferred();
  const order = [];
  let current = adminA;
  const fetchMock = async (url) => {
    if (url.endsWith(':refresh')) {
      order.push('refresh:start');
      await gate.promise;
      order.push('refresh:end');
      return success(adminA);
    }
    order.push('login');
    return success(current);
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  order.length = 0;
  const refresh = left.store.refreshAdmin();
  await setImmediate();
  current = adminB;
  const login = right.store.loginAdmin(credentials);
  await setImmediate();
  assert.deepEqual(order, ['refresh:start']);
  gate.resolve();
  await Promise.all([refresh, login]);
  await setImmediate();
  assert.deepEqual(order, ['refresh:start', 'refresh:end', 'login']);
  assert.equal(left.store.getAuthState().admin.adminId, 2);
  assert.equal(right.store.getAuthState().admin.adminId, 2);
});

test('429 대기 시간은 탭 간 공유하고 재발급 요청을 반복하지 않는다', async () => {
  const browser = createBrowserTabs();
  let refreshes = 0;
  const fetchMock = async (url) => {
    if (url.endsWith('/tokens')) return success();
    refreshes++;
    return new Response(null, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  };
  const left = setup(fetchMock, browser.create());
  const right = setup(fetchMock, browser.create());
  await left.store.loginAdmin(credentials);
  const results = await Promise.allSettled([
    left.store.refreshAdmin(),
    right.store.refreshAdmin(),
  ]);
  assert.equal(refreshes, 1);
  assert.ok(
    results.every(
      (result) => result.status === 'rejected' && result.reason.status === 429,
    ),
  );
  assert.equal(left.store.getAuthState().admin.adminId, 1);
  assert.equal(right.store.getAuthState().admin.adminId, 1);
});

test('Web Locks를 사용할 수 없으면 잠금 없는 인증 요청을 보내지 않는다', async () => {
  const browser = createBrowserTabs();
  const tab = browser.create();
  tab.navigator = {};
  let calls = 0;
  const { store } = setup(async () => {
    calls++;
    return success();
  }, tab);
  await assert.rejects(store.restoreAdmin(), (error) => error.status === 0);
  await assert.rejects(
    store.loginAdmin(credentials),
    (error) => error.status === 0,
  );
  assert.equal(calls, 0);
  assert.equal(store.getAuthState().isRestoring, false);
});

test('같은 탭에서 로그인 직후 요청한 로그아웃은 로그인 완료 후 실행한다', async () => {
  const gate = deferred();
  const order = [];
  const { store } = setup(async (_url, options) => {
    if (options.method === 'DELETE') {
      order.push('logout');
      return new Response(null, { status: 204 });
    }
    order.push('login');
    await gate.promise;
    return success();
  });
  const login = store.loginAdmin(credentials);
  await setImmediate();
  const logout = store.logoutAdmin();
  gate.resolve();
  await Promise.all([login, logout]);
  assert.deepEqual(order, ['login', 'logout']);
  assert.equal(store.getAuthState().admin, null);
});

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

test('같은 세션의 토큰 재발급은 관리자 객체를 유지해 진행 중인 조회를 취소하지 않는다', async () => {
  const { store } = setup(async () => success());
  await store.loginAdmin(credentials);
  const before = store.getAuthState().admin;
  await store.refreshAdmin();
  assert.equal(store.getAuthState().admin, before);
});

test('같은 관리자라도 재로그인하면 이전 조회 캐시와 다른 객체를 사용한다', async () => {
  const { store } = setup(async (_url, options) =>
    options?.method === 'DELETE'
      ? new Response(null, { status: 204 })
      : success(),
  );
  await store.loginAdmin(credentials);
  const before = store.getAuthState().admin;
  await store.logoutAdmin();
  await store.loginAdmin(credentials);
  assert.notEqual(store.getAuthState().admin, before);
  assert.equal(store.getAuthState().admin.adminId, before.adminId);
});

test('재발급 때 이름이나 권한이 바뀌면 새 관리자 정보와 조회 기준을 반영한다', async () => {
  let current = adminA;
  const { store } = setup(async () => success(current));
  await store.loginAdmin(credentials);
  const before = store.getAuthState().admin;
  current = { ...adminA, name: '변경된 이름', role: 'ADMIN' };
  await store.refreshAdmin();
  assert.notEqual(store.getAuthState().admin, before);
  assert.equal(store.getAuthState().admin.name, current.name);
  assert.equal(store.getAuthState().admin.role, current.role);
});
