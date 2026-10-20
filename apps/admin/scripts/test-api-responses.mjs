import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// 실제 API 모듈을 실행하되 fetch만 교체해 서버 없이 응답 계약을 검증한다.
const setup = (data, status = 200) => {
  const calls = [];
  const context = vm.createContext({
    fetch: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ code: 'SUCCESS', data }, { status });
    },
    Response,
    URLSearchParams,
  });
  const modules = {};
  for (const name of ['client', 'listResponse', 'members', 'adminAccounts']) {
    const source = readFileSync(
      new URL(`../src/api/${name}.ts`, import.meta.url),
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
      (path) => modules[path.slice(2)],
    );
    modules[name] = exports;
  }
  return { ...modules, calls };
};

const member = {
  memberId: 1,
  nickname: null,
  status: 'ACTIVE',
  joinedAt: '2026-10-20T10:00:00',
  lastLoginAt: null,
};
const page = { items: [member], page: 0, size: 20, totalElements: 1 };
const issueRequest = {
  loginId: 'test-admin',
  initialPassword: 'Test-only-123!',
  name: '테스트',
  role: 'ADMIN',
};
const issued = { loginId: 'test-admin', name: '테스트', role: 'ADMIN' };
const signal = new AbortController().signal;
const isApiError = (client) => (error) => error instanceof client.ApiError;

test('회원 목록은 nullable 필드와 인증 쿠키·취소 signal을 유지한다', async () => {
  const { members, calls } = setup(page);
  const result = await members.getMembers('page=0&size=20', signal);
  assert.equal(result.items[0].nickname, null);
  assert.equal(result.items[0].lastLoginAt, null);
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.credentials, 'include');
});

test('빈 회원 목록과 명시한 페이지 크기를 허용한다', async () => {
  const { members } = setup({ items: [], page: 2, size: 10, totalElements: 0 });
  const result = await members.getMembers('page=2&size=10', signal);
  assert.equal(result.items.length, 0);
});

test('잘못된 회원 필드와 목록 구조는 ApiError로 거부한다', async () => {
  const invalid = [
    null,
    {},
    { ...page, items: null },
    { ...page, totalElements: -1 },
    { ...page, items: [{ ...member, memberId: 0 }] },
    { ...page, items: [{ ...member, nickname: 10 }] },
    { ...page, items: [{ ...member, status: 'UNKNOWN' }] },
    { ...page, items: [{ ...member, status: ['ACTIVE'] }] },
    { ...page, items: [{ ...member, joinedAt: null }] },
    { ...page, items: [{ ...member, lastLoginAt: 10 }] },
  ];
  for (const data of invalid) {
    const { members, client } = setup(data);
    await assert.rejects(members.getMembers('', signal), isApiError(client));
  }
});

test('요청과 다른 페이지 번호·크기를 거부한다', async () => {
  for (const data of [
    { ...page, page: 1 },
    { ...page, size: 10 },
  ]) {
    const { members, client } = setup(data);
    await assert.rejects(
      members.getMembers('page=0&size=20', signal),
      isApiError(client),
    );
  }
});

test('관리자 발급은 계약에 맞는 응답을 반환하고 POST로 전송한다', async () => {
  const { adminAccounts, calls } = setup(issued, 201);
  const result = await adminAccounts.issueAdminAccount(issueRequest);
  assert.equal(result.loginId, issued.loginId);
  assert.equal(result.role, issued.role);
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), issueRequest);
});

test('잘못된 관리자 발급 응답은 TypeError 대신 ApiError로 처리한다', async () => {
  for (const data of [
    null,
    {},
    [],
    1,
    'invalid',
    { ...issued, role: ['ADMIN'] },
    { ...issued, name: null },
  ]) {
    const { adminAccounts, client } = setup(data, 201);
    await assert.rejects(
      adminAccounts.issueAdminAccount(issueRequest),
      isApiError(client),
    );
  }
});
