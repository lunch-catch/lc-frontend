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
      return status === 204
        ? new Response(null, { status })
        : Response.json(
            {
              code: 'SUCCESS',
              data:
                typeof data === 'function' ? await data(url, options) : data,
            },
            { status },
          );
    },
    Response,
    URLSearchParams,
  });
  const modules = {};
  for (const name of [
    'client',
    'listResponse',
    'members',
    'adminAccounts',
    'owners',
    'auth',
    'campaigns',
    'campaignReports',
    'templates',
  ]) {
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

test('로그인과 재발급은 실제 관리자 객체·권한만 허용한다', async () => {
  const admin = { adminId: 1, name: '테스트', role: 'SUPER_ADMIN' };
  for (const method of ['loginAdmin', 'refreshAdmin']) {
    const { auth } = setup(admin);
    const result = await auth[method]({ loginId: 'test', password: 'test' });
    assert.equal(result.adminId, 1);
    assert.equal(result.role, 'SUPER_ADMIN');
    for (const data of [
      null,
      {},
      [],
      1,
      'invalid',
      { ...admin, adminId: '1' },
      { ...admin, adminId: 0 },
      { ...admin, name: null },
      { ...admin, role: ['SUPER_ADMIN'] },
      { ...admin, role: 'UNKNOWN' },
    ]) {
      const { auth, client } = setup(data);
      await assert.rejects(
        auth[method]({ loginId: 'test', password: 'test' }),
        isApiError(client),
      );
    }
  }
});

test('점주 상태는 문자열만 허용하고 배열의 문자열 변환을 허용하지 않는다', async () => {
  const owner = {
    ownerId: 1,
    storeName: null,
    status: 'ONBOARDING',
    storeRegistered: false,
    businessNo: null,
    joinedAt: '2026-10-20',
    lastLoginAt: null,
  };
  for (const status of ['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN']) {
    const { owners } = setup({ ...page, items: [{ ...owner, status }] });
    const result = await owners.getOwners('page=0', signal);
    assert.equal(result.items[0].status, status);
  }
  for (const status of [['ACTIVE'], ['ONBOARDING'], null, {}, 1, 'UNKNOWN']) {
    const { owners, client } = setup({
      ...page,
      items: [{ ...owner, status }],
    });
    await assert.rejects(
      owners.getOwners('page=0', signal),
      isApiError(client),
    );
  }
});

const campaign = {
  campaignId: 501,
  ownerId: 7,
  storeId: 20,
  storeName: null,
  status: 'DRAFT',
  discountTargetType: 'ALL',
  discountType: 'PERCENT',
  discountValue: 15,
  dailyBudget: null,
  startDate: null,
  endDate: null,
  createdAt: '2026-10-20T11:00:00',
};
const campaignDetail = {
  ...campaign,
  pausedReason: null,
  targetMenuId: null,
  issueQuantity: 100,
  usableStartTime: '11:30:00',
  usableEndTime: '13:00:00',
  minOrderAmount: null,
  notice: null,
  targetRadius: 1000,
  targetGender: 'ALL',
  targetAgeGroups: [],
  statusChangedAt: '2026-10-20T11:00:00',
  statusLogs: [],
  poster: null,
};

test('캠페인 목록은 미설정 초안과 커서를 유지하고 조회 조건·취소 신호를 전달한다', async () => {
  const { campaigns, calls } = setup({
    items: [campaign],
    nextPageToken: 'next+cursor=',
  });
  const query = new URLSearchParams({
    storeId: '20',
    status: 'DRAFT',
    pageSize: '5',
    pageToken: 'previous+cursor=',
  }).toString();
  const result = await campaigns.getCampaigns(query, signal);
  assert.equal(result.items[0].storeName, null);
  assert.equal(result.items[0].dailyBudget, null);
  assert.equal(result.items[0].startDate, null);
  assert.equal(result.nextPageToken, 'next+cursor=');
  assert.equal(calls[0].url, `http://test/v1/admin/campaigns?${query}`);
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.credentials, 'include');
});

test('빈 캠페인 목록과 마지막 페이지의 null 커서를 허용한다', async () => {
  const { campaigns } = setup({ items: [], nextPageToken: null });
  const result = await campaigns.getCampaigns('pageSize=20', signal);
  assert.equal(result.items.length, 0);
  assert.equal(result.nextPageToken, null);
});

test('캠페인 목록은 잘못된 항목과 커서를 ApiError로 처리한다', async () => {
  const page = { items: [campaign], nextPageToken: null };
  for (const data of [
    null,
    {},
    { ...page, items: null },
    { ...page, nextPageToken: '' },
    { ...page, nextPageToken: [] },
    { ...page, items: [{ ...campaign, campaignId: '501' }] },
    { ...page, items: [{ ...campaign, status: ['ACTIVE'] }] },
    { ...page, items: [{ ...campaign, dailyBudget: -1 }] },
    { ...page, items: [{ ...campaign, discountType: 'UNKNOWN' }] },
  ]) {
    const { campaigns, client } = setup(data);
    await assert.rejects(
      campaigns.getCampaigns('pageSize=20', signal),
      isApiError(client),
    );
  }
});

test('캠페인 상세의 상태 이력·포스터와 노출 대상을 검증한다', async () => {
  const detail = {
    ...campaignDetail,
    status: 'PAUSED',
    pausedReason: 'NO_POINTS',
    targetAgeGroups: ['AGE_20S', 'AGE_50_PLUS'],
    statusLogs: [
      {
        fromStatus: 'ACTIVE',
        toStatus: 'PAUSED',
        actorType: 'SYSTEM',
        reason: null,
        changedAt: '2026-10-20T12:00:00',
      },
    ],
    poster: {
      posterId: 9,
      templateId: 3,
      title: '점심 특선',
      html: '<div>poster</div>',
    },
  };
  const { campaigns, calls } = setup(detail);
  const result = await campaigns.getCampaign('501', signal);
  assert.equal(result.pausedReason, 'NO_POINTS');
  assert.equal(result.poster.html, '<div>poster</div>');
  assert.equal(result.statusLogs[0].actorType, 'SYSTEM');
  assert.equal(result.targetAgeGroups[1], 'AGE_50_PLUS');
  assert.equal(calls[0].url, 'http://test/v1/admin/campaigns/501');
});

test('포스터와 상태 이력이 없는 캠페인 상세도 허용한다', async () => {
  const { campaigns } = setup(campaignDetail);
  const result = await campaigns.getCampaign('501', signal);
  assert.equal(result.poster, null);
  assert.equal(result.statusLogs.length, 0);
});

test('요청과 다른 캠페인과 잘못된 상세 필드를 거부한다', async () => {
  for (const data of [
    { ...campaignDetail, campaignId: 502 },
    { ...campaignDetail, pausedReason: 'UNKNOWN' },
    { ...campaignDetail, targetAgeGroups: ['AGE_10S'] },
    { ...campaignDetail, issueQuantity: -1 },
    { ...campaignDetail, targetGender: ['ALL'] },
    { ...campaignDetail, statusLogs: null },
    {
      ...campaignDetail,
      statusLogs: [
        {
          fromStatus: 'ACTIVE',
          toStatus: 'ENDED',
          actorType: 'UNKNOWN',
          reason: null,
          changedAt: '',
        },
      ],
    },
    {
      ...campaignDetail,
      poster: { posterId: 1, templateId: 1, title: 'test', html: null },
    },
  ]) {
    const { campaigns, client } = setup(data);
    await assert.rejects(
      campaigns.getCampaign('501', signal),
      isApiError(client),
    );
  }
});

test('캠페인 상세 404 오류를 성공 응답으로 처리하지 않는다', async () => {
  const { campaigns, client } = setup({}, 404);
  await assert.rejects(
    campaigns.getCampaign('501', signal),
    (error) => error instanceof client.ApiError && error.status === 404,
  );
});

const templateHtml =
  '<div><h1 data-slot="eventName">이벤트명</h1><p data-slot="discount">할인 내용</p><p data-slot="period">기간</p><img data-slot="image" alt="메뉴 이미지"></div>';
const generatedTemplate = {
  templateId: 1,
  name: '테스트',
  versionNumber: 1,
  status: 'DRAFT',
  html: templateHtml,
  message: '요청하신 색상으로 만들었어요.',
  removedElements: [],
  suggestedPrompts: ['배경을 더 밝게 해줘'],
};
const templateRequest = {
  name: '테스트',
  requestPrompt: '요청',
  requestId: 'request-1',
};

test('템플릿 생성·수정은 data.message와 서버 추천 문구를 유지한다', async () => {
  for (const id of [undefined, '1']) {
    const { templates, calls } = setup(generatedTemplate, 201);
    const result = await templates.generateTemplate(templateRequest, id);
    assert.equal(result.html, templateHtml);
    assert.equal(result.message, generatedTemplate.message);
    assert.equal(
      result.suggestedPrompts[0],
      generatedTemplate.suggestedPrompts[0],
    );
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.requestId, 'request-1');
    assert.equal(body.requestPrompt, '요청');
    assert.equal(body.name, id ? undefined : '테스트');
  }
});

test('템플릿 설명은 빈 문자열을 허용하고 누락·잘못된 타입은 거부한다', async () => {
  const valid = setup({ ...generatedTemplate, message: '' }, 201);
  assert.equal(
    (await valid.templates.generateTemplate(templateRequest)).message,
    '',
  );
  for (const message of [undefined, null, [], {}, 1]) {
    const { templates, client } = setup({ ...generatedTemplate, message }, 201);
    await assert.rejects(
      templates.generateTemplate(templateRequest),
      isApiError(client),
    );
  }
});

test('템플릿 버전 이력의 요청과 설명을 복원할 수 있다', async () => {
  const version = {
    versionNumber: 1,
    requestPrompt: '요청',
    html: templateHtml,
    message: '만들었어요.',
    createdAt: '2026-10-20T10:00:00',
  };
  for (const message of ['만들었어요.', '']) {
    const { templates } = setup({
      items: [{ ...version, message }],
      nextPageToken: null,
    });
    const result = await templates.getTemplateVersions('1');
    assert.equal(result.items[0].html, templateHtml);
    assert.equal(result.items[0].message, message);
    assert.equal(result.items[0].requestPrompt, '요청');
  }
  for (const message of [undefined, null, [], 1]) {
    const { templates, client } = setup({
      items: [{ ...version, message }],
      nextPageToken: null,
    });
    await assert.rejects(
      templates.getTemplateVersions('1'),
      isApiError(client),
    );
  }
});

test('템플릿 삭제는 DELETE의 빈 204 응답을 허용한다', async () => {
  const { templates, calls } = setup(null, 204);
  await templates.deleteTemplate('1');
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].url, 'http://test/v1/admin/templates/1');
});

test('템플릿 삭제의 예상하지 못한 성공 상태와 서버 실패를 거부한다', async () => {
  for (const status of [200, 404, 409]) {
    const { templates, client } = setup({}, status);
    await assert.rejects(templates.deleteTemplate('1'), isApiError(client));
  }
});

const campaignReport = {
  campaignId: 501,
  spentAmount: 1200,
  validImpressionCount: 240,
  todayStatus: 'IN_PROGRESS',
};

test('캠페인 실적은 전체 기간의 0과 집계 상태 및 인증·취소 신호를 유지한다', async () => {
  const { campaignReports, calls } = setup({
    items: [{ ...campaignReport, spentAmount: 0, validImpressionCount: 0 }],
  });
  const result = await campaignReports.getCampaignReports([501], signal);
  assert.equal(result[0].spentAmount, 0);
  assert.equal(result[0].validImpressionCount, 0);
  assert.equal(result[0].todayStatus, 'IN_PROGRESS');
  assert.equal(
    calls[0].url,
    'http://test/v1/admin/campaign-reports?campaignIds=501',
  );
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.credentials, 'include');
});

test('캠페인 실적은 중복 ID를 제거하고 100개 제한에 맞게 나눠 조회한다', async () => {
  const { campaignReports, calls } = setup((url) => ({
    items: new URL(url).searchParams
      .get('campaignIds')
      .split(',')
      .map((id) => ({
        ...campaignReport,
        campaignId: Number(id),
      })),
  }));
  const ids = Array.from({ length: 101 }, (_, index) => index + 1);
  const result = await campaignReports.getCampaignReports([...ids, 1], signal);
  assert.equal(result.length, 101);
  assert.equal(calls.length, 2);
  assert.equal(
    new URL(calls[0].url).searchParams.get('campaignIds').split(',').length,
    100,
  );
  assert.equal(new URL(calls[1].url).searchParams.get('campaignIds'), '101');
  assert.ok(calls.every((call) => call.options.signal === signal));
});

test('빈 캠페인 실적 요청은 전송하지 않고 잘못된 ID는 거부한다', async () => {
  const { campaignReports, calls, client } = setup({ items: [] });
  assert.equal(
    (await campaignReports.getCampaignReports([], signal)).length,
    0,
  );
  for (const ids of [
    [0],
    [-1],
    [1.5],
    ['501'],
    [Number.MAX_SAFE_INTEGER + 1],
  ]) {
    await assert.rejects(
      campaignReports.getCampaignReports(ids, signal),
      isApiError(client),
    );
  }
  assert.equal(calls.length, 0);
});

test('캠페인 실적은 ID 기준으로 검증하고 누락·중복·잘못된 수치를 거부한다', async () => {
  const { campaignReports } = setup({
    items: [{ ...campaignReport, campaignId: 502 }, campaignReport],
  });
  assert.equal(
    (await campaignReports.getCampaignReports([501, 502], signal)).length,
    2,
  );
  for (const data of [
    null,
    {},
    { items: null },
    { items: [] },
    { items: [campaignReport, campaignReport] },
    { items: [{ ...campaignReport, campaignId: 502 }] },
    { items: [{ ...campaignReport, spentAmount: -1 }] },
    { items: [{ ...campaignReport, spentAmount: '1200' }] },
    { items: [{ ...campaignReport, validImpressionCount: 1.5 }] },
    { items: [{ ...campaignReport, todayStatus: 'FINAL' }] },
    { items: [{ ...campaignReport, todayStatus: ['IN_PROGRESS'] }] },
  ]) {
    const { campaignReports, client } = setup(data);
    await assert.rejects(
      campaignReports.getCampaignReports([501], signal),
      isApiError(client),
    );
  }
  const duplicate = setup({ items: [campaignReport, campaignReport] });
  await assert.rejects(
    duplicate.campaignReports.getCampaignReports([501, 502], signal),
    isApiError(duplicate.client),
  );
});

test('캠페인 실적 조회 실패는 0으로 대체하지 않고 오류를 전달한다', async () => {
  const { campaignReports, client } = setup({}, 503);
  await assert.rejects(
    campaignReports.getCampaignReports([501], signal),
    (error) => error instanceof client.ApiError && error.status === 503,
  );
});
