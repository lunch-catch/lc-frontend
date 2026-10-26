import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// 실제 API 모듈을 실행하되 fetch만 교체해 서버 없이 응답 계약을 검증한다.
const setup = (data, status = 200, errorBody) => {
  const calls = [];
  const context = vm.createContext({
    fetch: async (url, options) => {
      calls.push({ url, options });
      return status === 204
        ? new Response(null, { status })
        : Response.json(
            errorBody ?? {
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
    'billingResponse',
    'pointAdjustments',
    'settlementMismatches',
    'members',
    'adminAccounts',
    'owners',
    'auth',
    'campaigns',
    'campaignReports',
    'templates',
    'templateUtils',
  ]) {
    const source = readFileSync(
      new URL(
        name === 'templateUtils'
          ? '../src/features/template/templateUtils.ts'
          : `../src/api/${name}.ts`,
        import.meta.url,
      ),
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
      (path) =>
        path === '@admin/api/client' ? modules.client : modules[path.slice(2)],
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

test('관리자 목록은 검색어만 인코딩하고 서버 순서·쿠키·취소 signal을 유지한다', async () => {
  const accounts = [
    issued,
    { loginId: 'root', name: '최고', role: 'SUPER_ADMIN' },
  ];
  const { adminAccounts, calls } = setup(accounts);
  const result = await adminAccounts.getAdminAccounts('  A%_! &홍  ', signal);
  assert.equal(JSON.stringify(result), JSON.stringify(accounts));
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, '/v1/admin/admins');
  assert.equal(url.searchParams.get('keyword'), 'A%_! &홍');
  assert.deepEqual([...url.searchParams.keys()], ['keyword']);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[0].options.credentials, 'include');
  assert.equal(calls[0].options.signal, signal);
});

test('관리자 전체 조회는 빈 검색어를 생략하고 빈 배열도 허용한다', async () => {
  for (const keyword of ['', '   ']) {
    const { adminAccounts, calls } = setup([]);
    assert.equal(
      (await adminAccounts.getAdminAccounts(keyword, signal)).length,
      0,
    );
    assert.equal(calls[0].url, 'http://test/v1/admin/admins');
  }
});

test('관리자 목록은 페이지 객체와 잘못된 필드·권한을 거부한다', async () => {
  for (const data of [
    { items: [issued] },
    {},
    [null],
    [{ ...issued, name: null }],
    [{ ...issued, loginId: 1 }],
    [{ ...issued, role: 'MEMBER' }],
  ]) {
    const { adminAccounts, client } = setup(data);
    await assert.rejects(
      adminAccounts.getAdminAccounts('', signal),
      isApiError(client),
    );
  }
});

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

const chatReply = {
  templateId: null,
  name: null,
  versionNumber: null,
  status: null,
  html: null,
  message: '안녕하세요. 어떤 템플릿이 필요하신가요?',
  removedElements: [],
  suggestedPrompts: [],
};

test('생성·수정 중 자연어 응답은 버전 없는 대화로 반환한다', async () => {
  for (const id of [undefined, '1']) {
    const { templates, calls } = setup(chatReply, 200);
    const result = await templates.generateTemplate(templateRequest, id);
    assert.equal(result.message, chatReply.message);
    assert.equal(result.templateId, null);
    assert.equal(result.versionNumber, null);
    assert.equal(result.html, null);
    assert.equal(result.suggestedPrompts.length, 0);
    assert.equal(calls.length, 1);
  }
});

test('자연어 응답에서 템플릿 필드가 섞이거나 메시지가 잘못되면 거부한다', async () => {
  for (const invalid of [
    { ...chatReply, templateId: 1 },
    { ...chatReply, html: templateHtml },
    { ...chatReply, versionNumber: 1 },
    { ...chatReply, message: null },
    { ...chatReply, suggestedPrompts: ['수정'] },
    null,
  ]) {
    const { templates, client } = setup(invalid, 200);
    await assert.rejects(
      templates.generateTemplate(templateRequest),
      isApiError(client),
    );
  }
});

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

const mismatch = {
  mismatchId: 55,
  checkType: 'CAMPAIGN_SPEND_VS_LEDGER',
  targetId: 12,
  ownerId: 7,
  businessDate: '2026-10-01',
  expectedValue: 9800,
  actualValue: 9790,
  diff: -10,
  resolutionType: null,
  createdAt: '2026-10-01T13:35:00+09:00',
  jobExecutionId: 301,
  resolvedAt: null,
  resolvedBy: null,
};

test('정산 불일치의 모든 검증 유형에서 점주 ID와 페이지 계약을 유지한다', async () => {
  for (const checkType of [
    'PG_VS_CHARGE',
    'CAMPAIGN_SPEND_VS_LEDGER',
    'CAMPAIGN_OVERSPEND',
  ]) {
    const item = { ...mismatch, checkType };
    const { settlementMismatches, calls } = setup({
      items: [item],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    const result = await settlementMismatches.getSettlementMismatches(
      'page=0&size=20&resolved=false',
      signal,
    );
    assert.equal(result.items[0].ownerId, 7);
    assert.equal(result.items[0].targetId, 12);
    assert.equal(result.items[0].checkType, checkType);
    assert.equal(result.page, 0);
    assert.equal(result.totalElements, 1);
    assert.match(
      calls[0].url,
      /settlement-mismatches\?page=0&size=20&resolved=false$/,
    );
    assert.equal(calls[0].options.signal, signal);
    assert.equal(calls[0].options.credentials, 'include');
  }
});

test('수동 조정의 새 해결 유형과 전환 전 해결 유형을 모두 읽는다', async () => {
  for (const resolutionType of [
    null,
    'CACHE_REBUILD',
    'LEDGER_CORRECTION',
    'MANUAL_ADJUSTMENT',
    'NO_ADJUSTMENT_REQUIRED',
    'OVERCHARGE_REVERSAL',
  ]) {
    const { settlementMismatches } = setup({
      items: [{ ...mismatch, resolutionType }],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    const result = await settlementMismatches.getSettlementMismatches(
      'page=0&size=20',
      signal,
    );
    assert.equal(result.items[0].resolutionType, resolutionType);
  }
});

test('정의되지 않은 해결 유형은 해결 상태로 임의 처리하지 않는다', async () => {
  const { settlementMismatches, client } = setup({
    items: [{ ...mismatch, resolutionType: 'UNKNOWN' }],
    page: 0,
    size: 20,
    totalElements: 1,
  });
  await assert.rejects(
    settlementMismatches.getSettlementMismatches('page=0&size=20', signal),
    isApiError(client),
  );
});

test('정산 불일치의 잘못된 점주 ID를 대상 ID로 대신하지 않는다', async () => {
  for (const ownerId of [0, -1, '7', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const { settlementMismatches, client } = setup({
      items: [{ ...mismatch, ownerId }],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    await assert.rejects(
      settlementMismatches.getSettlementMismatches('page=0&size=20', signal),
      isApiError(client),
    );
  }
});

test('점주 ID가 없는 이전 불일치 응답도 전체 건수를 유지하고 점주는 null로 표시한다', async () => {
  for (const checkType of [
    'PG_VS_CHARGE',
    'CAMPAIGN_SPEND_VS_LEDGER',
    'CAMPAIGN_OVERSPEND',
  ]) {
    const item = { ...mismatch, checkType };
    delete item.ownerId;
    const { settlementMismatches } = setup({
      items: [item],
      page: 0,
      size: 1,
      totalElements: 3,
    });
    const result = await settlementMismatches.getSettlementMismatches(
      'page=0&size=1',
      signal,
    );
    assert.equal(result.totalElements, 3);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].ownerId, null);
    assert.equal(result.items[0].targetId, item.targetId);
  }
});

test('대상을 찾지 못해 점주 ID가 null인 불일치도 목록에서 제외하지 않는다', async () => {
  for (const checkType of [
    'PG_VS_CHARGE',
    'CAMPAIGN_SPEND_VS_LEDGER',
    'CAMPAIGN_OVERSPEND',
  ]) {
    const { settlementMismatches } = setup({
      items: [{ ...mismatch, checkType, ownerId: null }],
      page: 0,
      size: 20,
      totalElements: 1,
    });
    const result = await settlementMismatches.getSettlementMismatches(
      'page=0&size=20',
      signal,
    );
    assert.equal(result.items[0].ownerId, null);
    assert.equal(result.totalElements, 1);
  }
});

test('조정 없이 종결은 본문 없는 POST로 요청하고 서버의 처리자·시각을 반환한다', async () => {
  const response = {
    ...mismatch,
    resolutionType: 'NO_ADJUSTMENT_REQUIRED',
    resolvedAt: '2026-10-26T17:00:00+09:00',
    resolvedBy: 2,
  };
  const { settlementMismatches, calls } = setup(response);
  const result = await settlementMismatches.closeSettlementMismatch(
    mismatch.mismatchId,
  );
  assert.equal(
    calls[0].url,
    `http://test/v1/admin/settlement-mismatches/${mismatch.mismatchId}:closeWithoutAdjustment`,
  );
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[0].options.credentials, 'include');
  assert.equal(result.resolutionType, 'NO_ADJUSTMENT_REQUIRED');
  assert.equal(result.resolvedBy, 2);
});

test('종결 응답의 다른 ID·미해결 상태·처리 정보 누락을 성공으로 처리하지 않는다', async () => {
  const response = {
    ...mismatch,
    resolutionType: 'NO_ADJUSTMENT_REQUIRED',
    resolvedAt: '2026-10-26T17:00:00+09:00',
    resolvedBy: 2,
  };
  for (const patch of [
    { mismatchId: mismatch.mismatchId + 1 },
    { resolutionType: null },
    { resolvedAt: null },
    { resolvedBy: null },
  ]) {
    const { settlementMismatches, client } = setup({ ...response, ...patch });
    await assert.rejects(
      settlementMismatches.closeSettlementMismatch(mismatch.mismatchId),
      isApiError(client),
    );
  }
});

test('종결 시 이미 처리된 건과 없는 건의 서버 오류 코드를 보존한다', async () => {
  for (const [status, code] of [
    [409, 'BILLING-021'],
    [404, 'BILLING-020'],
  ]) {
    const { settlementMismatches } = setup(null, status, {
      code,
      message: '종결 불가',
    });
    await assert.rejects(
      settlementMismatches.closeSettlementMismatch(mismatch.mismatchId),
      (error) => error.status === status && error.code === code,
    );
  }
});

const adjustmentRequest = {
  requestId: 'adjust-test-1',
  ownerId: 7,
  amount: 1000,
  reason: '중복 과금 정정',
  campaignId: 12,
  targetBusinessDate: '2026-10-13',
  mismatchId: 55,
};
const adjustmentResponse = {
  ledgerId: 100,
  ownerId: 7,
  amount: 1000,
  campaignId: 12,
  targetBusinessDate: '2026-10-13',
  reason: '중복 과금 정정',
  createdAt: '2026-10-21T12:00:00+09:00',
};

test('캠페인 포인트 조정은 대상 영업일과 멱등 키를 전송하고 200·201 응답을 허용한다', async () => {
  for (const status of [200, 201]) {
    const { pointAdjustments, calls } = setup(adjustmentResponse, status);
    const result = await pointAdjustments.adjustPoints(adjustmentRequest);
    assert.equal(
      result.targetBusinessDate,
      adjustmentRequest.targetBusinessDate,
    );
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.targetBusinessDate, adjustmentRequest.targetBusinessDate);
    assert.equal(body.campaignId, 12);
    assert.equal(body.mismatchId, 55);
    assert.equal(body.requestId, adjustmentRequest.requestId);
    assert.equal(calls[0].options.credentials, 'include');
  }
});

test('불일치 정정의 지급·차감 요청에도 mismatchId와 대상 정보를 유지한다', async () => {
  for (const amount of [1000, -1000]) {
    const { pointAdjustments, calls } = setup(
      { ...adjustmentResponse, amount },
      201,
    );
    const result = await pointAdjustments.adjustPoints({
      ...adjustmentRequest,
      amount,
    });
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.amount, amount);
    assert.equal(body.mismatchId, 55);
    assert.equal(body.ownerId, 7);
    assert.equal(body.campaignId, 12);
    assert.equal(body.targetBusinessDate, adjustmentRequest.targetBusinessDate);
    assert.equal(result.amount, amount);
  }
});

test('캠페인 없는 조정은 영업일을 보내지 않고 null 응답을 허용한다', async () => {
  const values = {
    requestId: adjustmentRequest.requestId,
    ownerId: 7,
    amount: 1000,
    reason: adjustmentRequest.reason,
  };
  const { pointAdjustments, calls } = setup(
    { ...adjustmentResponse, campaignId: null, targetBusinessDate: null },
    201,
  );
  const result = await pointAdjustments.adjustPoints(values);
  assert.equal(result.targetBusinessDate, null);
  const body = JSON.parse(calls[0].options.body);
  assert.equal(Object.hasOwn(body, 'campaignId'), false);
  assert.equal(Object.hasOwn(body, 'targetBusinessDate'), false);
});

test('조정 응답의 대상 영업일 누락·불일치와 캠페인 불일치를 거부한다', async () => {
  for (const data of [
    { ...adjustmentResponse, targetBusinessDate: undefined },
    { ...adjustmentResponse, targetBusinessDate: null },
    { ...adjustmentResponse, targetBusinessDate: '2026-10-14' },
    { ...adjustmentResponse, targetBusinessDate: [] },
    { ...adjustmentResponse, campaignId: 13 },
  ]) {
    const { pointAdjustments, client } = setup(data, 201);
    await assert.rejects(
      pointAdjustments.adjustPoints(adjustmentRequest),
      isApiError(client),
    );
  }
});

test('템플릿 프롬프트 거절은 HTTP 상태 대신 서버의 구체적인 사유를 표시한다', async () => {
  for (const code of [
    'POSTER-022',
    'POSTER-023',
    'POSTER-024',
    'POSTER-025',
    'POSTER-026',
  ]) {
    for (const id of [undefined, '1']) {
      const message = code + ': 요청 문구를 수정해 주세요.';
      const { templates, templateUtils, client } = setup(null, 422, {
        code,
        message,
        data: null,
      });
      await assert.rejects(
        templates.generateTemplate(templateRequest, id),
        (error) => {
          assert.ok(error instanceof client.ApiError);
          assert.equal(error.code, code);
          assert.equal(templateUtils.getTemplateError(error), message);
          // 다른 화면에서 쓰는 공통 안내는 유지한다.
          assert.notEqual(error.message, message);
          return true;
        },
      );
    }
  }
});

test('템플릿 오류는 잘못된 서버 메시지에 기본 안내를 쓰고 기존 코드 안내를 유지한다', async () => {
  for (const message of [undefined, null, '', '   ', {}, 12]) {
    const { templates, templateUtils } = setup(null, 422, {
      code: 'POSTER-023',
      message,
      data: null,
    });
    await assert.rejects(
      templates.generateTemplate(templateRequest),
      (error) => {
        assert.equal(templateUtils.getTemplateError(error), error.message);
        assert.equal(error.serverMessage, undefined);
        return true;
      },
    );
  }
  const { templates, templateUtils } = setup(null, 503, {
    code: 'POSTER-004',
    message: 'server timeout',
    data: null,
  });
  await assert.rejects(templates.generateTemplate(templateRequest), (error) => {
    assert.match(templateUtils.getTemplateError(error), /템플릿 생성이 지연/);
    assert.equal(error.retryAfterSeconds, 1);
    return true;
  });
});

test('템플릿 생성 대기 중 취소하면 같은 AbortSignal로 HTTP 요청을 중단한다', async () => {
  const controller = new AbortController();
  const api = setup(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        assert.equal(options.signal, controller.signal);
        options.signal.addEventListener(
          'abort',
          () => reject(options.signal.reason),
          { once: true },
        );
      }),
  );
  const pending = api.templates.generateTemplate(
    {
      name: '테스트',
      requestPrompt: '포스터 수정',
      requestId: 'cancel-request',
    },
    '1',
    controller.signal,
  );
  controller.abort();
  await assert.rejects(pending, (error) => error.name === 'AbortError');
  assert.equal(api.calls.length, 1);
});

const publishedTemplate = {
  templateId: 1,
  name: '테스트',
  status: 'PUBLISHED',
  active: true,
  hasDraft: false,
  html: templateHtml,
  createdAt: '2026-10-20T10:00:00+09:00',
  activatedBy: 1,
  activatedAt: '2026-10-20T10:00:00+09:00',
  lastModifiedBy: 1,
  lastModifiedAt: '2026-10-24T10:00:00+09:00',
};

test('게시된 템플릿의 임시저장 유무와 게시본 HTML을 목록·상세에서 보존한다', async () => {
  for (const hasDraft of [true, false]) {
    const template = { ...publishedTemplate, hasDraft };
    const list = setup([template]);
    const detail = setup(template);
    assert.equal((await list.templates.getTemplates())[0].hasDraft, hasDraft);
    assert.equal((await detail.templates.getTemplate('1')).html, templateHtml);
  }
});

test('템플릿의 hasDraft 누락이나 잘못된 타입을 거부한다', async () => {
  for (const hasDraft of [undefined, null, 0, 'true']) {
    const { templates, client } = setup({ ...publishedTemplate, hasDraft });
    await assert.rejects(templates.getTemplate('1'), isApiError(client));
  }
});

test('게시된 템플릿 수정 응답은 PUBLISHED 상태와 새 임시저장 번호를 유지한다', async () => {
  const { templates, calls } = setup(
    { ...generatedTemplate, status: 'PUBLISHED', versionNumber: 6 },
    201,
  );
  const response = await templates.generateTemplate(templateRequest, '1');
  assert.equal(response.status, 'PUBLISHED');
  assert.equal(response.versionNumber, 6);
  assert.equal(calls[0].url, 'http://test/v1/admin/templates/1/versions');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    requestPrompt: templateRequest.requestPrompt,
    requestId: templateRequest.requestId,
  });
  const create = setup({ ...generatedTemplate, status: 'PUBLISHED' }, 201);
  await assert.rejects(
    create.templates.generateTemplate(templateRequest),
    isApiError(create.client),
  );
});

const renamedTemplate = {
  templateId: 1,
  name: '바꾼 이름',
  lastModifiedBy: 2,
  lastModifiedAt: '2026-10-24T11:00:00+09:00',
};

test('이름 수정은 공백을 제거한 이름만 PATCH로 보내고 수정자·시각을 반환한다', async () => {
  const { templates, calls } = setup(renamedTemplate);
  const renamed = await templates.renameTemplate('1', '  바꾼 이름  ');
  assert.equal(renamed.lastModifiedBy, 2);
  assert.equal(renamed.lastModifiedAt, renamedTemplate.lastModifiedAt);
  assert.equal(calls[0].url, 'http://test/v1/admin/templates/1');
  assert.equal(calls[0].options.method, 'PATCH');
  assert.equal(calls[0].options.credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: '바꾼 이름' });
});

test('잘못된 이름은 전송하지 않고 이름 변경의 잘못된 응답·서버 실패는 거부한다', async () => {
  const invalid = setup(renamedTemplate);
  for (const name of ['', '   ', '가'.repeat(101)])
    await assert.rejects(
      invalid.templates.renameTemplate('1', name),
      isApiError(invalid.client),
    );
  assert.equal(invalid.calls.length, 0);
  for (const data of [
    null,
    { ...renamedTemplate, templateId: 2 },
    { ...renamedTemplate, name: '다른 이름' },
    { ...renamedTemplate, lastModifiedBy: null },
    { ...renamedTemplate, lastModifiedAt: null },
  ]) {
    const { templates, client } = setup(data);
    await assert.rejects(
      templates.renameTemplate('1', '바꾼 이름'),
      isApiError(client),
    );
  }
  const failure = setup(null, 403, {
    code: 'COMMON-004',
    message: '권한 없음',
  });
  await assert.rejects(
    failure.templates.renameTemplate('1', '바꾼 이름'),
    isApiError(failure.client),
  );
});

test('재게시는 선택한 임시저장 번호만 전송하고 활성 상태 변경을 요청하지 않는다', async () => {
  const { templates, calls } = setup({
    ...publishedTemplate,
    publishedAt: '2026-10-24T11:00:00+09:00',
  });
  const result = await templates.publishTemplate('1', 6);
  assert.equal(result.status, 'PUBLISHED');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://test/v1/admin/templates/1/publish');
  assert.deepEqual(JSON.parse(calls[0].options.body), { versionNumber: 6 });
});

test('POSTER-006은 삭제 제한, POSTER-007은 새 임시저장 없음으로 안내한다', () => {
  const { templateUtils, client } = setup(null);
  assert.equal(
    templateUtils.getTemplateError(new client.ApiError('', 409, 'POSTER-006')),
    '게시된 템플릿은 삭제할 수 없습니다.',
  );
  assert.match(
    templateUtils.getTemplateError(new client.ApiError('', 409, 'POSTER-007')),
    /새로 게시할 임시저장/,
  );
});

test('템플릿 목록·상세는 관리자 이름을 유지하고 누락·null은 이름 없음으로 처리한다', async () => {
  for (const name of ['수정 담당자', null, undefined]) {
    const template = {
      ...publishedTemplate,
      lastModifiedByName: name,
      activatedByName: name,
    };
    const list = await setup([template]).templates.getTemplates();
    const detail = await setup(template).templates.getTemplate('1');
    for (const result of [list[0], detail]) {
      assert.equal(result.lastModifiedByName, name ?? null);
      assert.equal(result.activatedByName, name ?? null);
      assert.equal(result.lastModifiedBy, publishedTemplate.lastModifiedBy);
    }
  }
});

test('이름 수정·활성 변경 응답의 관리자 이름은 그대로 전달한다', async () => {
  for (const name of ['담당 관리자', null, undefined]) {
    const renamed = await setup({
      ...renamedTemplate,
      lastModifiedByName: name,
    }).templates.renameTemplate('1', renamedTemplate.name);
    assert.equal(renamed.lastModifiedByName, name ?? null);
    const active = await setup({
      templateId: 1,
      active: false,
      activatedBy: 2,
      activatedAt: publishedTemplate.activatedAt,
      activatedByName: name,
    }).templates.changeTemplateActive('1', false);
    assert.equal(active.activatedByName, name ?? null);
  }
});

test('문자열이나 null이 아닌 템플릿 관리자 이름 필드는 거부한다', async () => {
  for (const name of [12, {}, []]) {
    for (const field of ['lastModifiedByName', 'activatedByName']) {
      const api = setup({ ...publishedTemplate, [field]: name });
      await assert.rejects(
        api.templates.getTemplate('1'),
        isApiError(api.client),
      );
    }
    const rename = setup({ ...renamedTemplate, lastModifiedByName: name });
    await assert.rejects(
      rename.templates.renameTemplate('1', renamedTemplate.name),
      isApiError(rename.client),
    );
    const active = setup({
      templateId: 1,
      active: false,
      activatedBy: 2,
      activatedAt: publishedTemplate.activatedAt,
      activatedByName: name,
    });
    await assert.rejects(
      active.templates.changeTemplateActive('1', false),
      isApiError(active.client),
    );
  }
});
