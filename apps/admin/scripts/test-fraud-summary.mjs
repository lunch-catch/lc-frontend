import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../src/features/fraud/useFraudManagement.ts', import.meta.url),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

// 목록 조회 상태를 순서대로 바꿔 실제 훅의 요약 유지·초기화 동작을 확인한다.
const createHarness = () => {
  let admin = { adminId: 1 };
  let filters = {
    tab: 'impressions',
    from: '2026-10-01',
    to: '2026-10-26',
    reason: 'ALL',
    type: 'ALL',
    campaignId: '',
    memberId: '',
    page: 1,
    size: 20,
    sortBy: '',
    sortDir: 'desc',
  };
  let invalid = { loading: true };
  const states = [];
  let index = 0;
  let updated = false;
  const getInvalidImpressions = () => {};
  const dependencies = {
    react: {
      useState: (initial) => {
        const slot = index++;
        if (!(slot in states)) states[slot] = initial;
        return [
          states[slot],
          (next) => {
            states[slot] = next;
            updated = true;
          },
        ];
      },
    },
    '@admin/api/analyticsDateUtils': { shiftDate: () => '2026-09-26' },
    '@admin/api/fraud': {
      getInvalidImpressions,
      getCampaignWarnings: () => {},
    },
    '@admin/auth/useAdminAuth': { useAdminAuth: () => ({ admin }) },
    '@admin/hooks/queryDateUtils': { getKstToday: () => '2026-10-26' },
    '@admin/hooks/urlQuery': {
      queryChoice: () => {},
      queryText: () => {},
      queryPastDate: () => {},
    },
    '@admin/hooks/useApiResource': {
      useApiResource: (load) => (load === getInvalidImpressions ? invalid : {}),
    },
    '@admin/hooks/useUrlFilters': {
      useUrlFilters: () => ({ filters, updateFilters: () => {} }),
    },
    '@admin/hooks/useUrlSearch': { useUrlSearch: () => ({}) },
    './fraudUtils': { getFraudRangeError: () => '' },
  };
  const exports = {};
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    URLSearchParams,
  })(exports, (id) => {
    assert.ok(id in dependencies, id);
    return dependencies[id];
  });
  return {
    render: () => {
      let result;
      let attempts = 0;
      do {
        assert.ok(attempts++ < 5, 'Render must settle');
        index = 0;
        updated = false;
        result = exports.useFraudManagement();
      } while (updated);
      return result;
    },
    load: (data) => {
      invalid = data ? { data } : { loading: true };
    },
    resource: (next) => {
      invalid = next;
    },
    filter: (next) => {
      filters = { ...filters, ...next };
    },
    account: () => {
      admin = { adminId: 2 };
    },
  };
};

test('무효 노출 요약은 페이지·크기·정렬 변경 중에도 유지하고 새 응답으로 갱신한다', () => {
  const hook = createHarness();
  const summary = [{ reasonCode: 'NOT_OWNER', count: 12 }];
  hook.load({ summaryByReason: summary });
  assert.equal(hook.render().summaryByReason, summary);
  hook.load();
  for (const change of [{ page: 2 }, { size: 50 }, { sortBy: 'memberId' }]) {
    hook.filter(change);
    assert.equal(hook.render().summaryByReason, summary);
    assert.equal(hook.render().invalid.loading, true);
  }
  const updated = [{ reasonCode: 'NOT_OWNER', count: 15 }];
  hook.load({ summaryByReason: updated });
  assert.equal(hook.render().summaryByReason, updated);
});

test('기간·사유·검색 조건이나 계정이 바뀌면 이전 요약을 표시하지 않는다', () => {
  for (const change of [
    { from: '2026-10-02' },
    { to: '2026-10-25' },
    { reason: 'NOT_OWNER' },
    { campaignId: '7' },
    { memberId: '8' },
    null,
  ]) {
    const hook = createHarness();
    hook.load({ summaryByReason: [{ reasonCode: 'NOT_OWNER', count: 12 }] });
    hook.render();
    hook.load();
    if (change) hook.filter(change);
    else hook.account();
    assert.equal(hook.render().summaryByReason, undefined);
  }
});

test('이전 요약은 로딩 중에만 유지하고 오류 시 숨기며 새 응답은 우선 표시한다', () => {
  const hook = createHarness();
  const summary = [{ reasonCode: 'NOT_OWNER', count: 12 }];
  hook.load({ summaryByReason: summary });
  hook.render();
  hook.filter({ page: 2 });
  hook.load();
  assert.equal(hook.render().summaryByReason, summary);

  hook.resource({ loading: false, error: '조회 실패' });
  assert.equal(hook.render().summaryByReason, undefined);
  hook.resource({ loading: true, error: '조회 실패' });
  assert.equal(hook.render().summaryByReason, undefined);
  hook.resource({ loading: false });
  assert.equal(hook.render().summaryByReason, undefined);

  const updated = [{ reasonCode: 'NOT_OWNER', count: 15 }];
  hook.resource({
    loading: false,
    error: '조회 실패',
    data: { summaryByReason: updated },
  });
  assert.equal(hook.render().summaryByReason, updated);
});
