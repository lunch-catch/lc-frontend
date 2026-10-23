import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as router from 'react-router';
import * as icons from 'lucide-react';
import ts from 'typescript';

// 실제 Funnel과 하위 카드·Link를 렌더링한다. 링크 생성 함수가 화면에 연결되지 않으면 실패한다.
const dependencies = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  'react-router': router,
  'lucide-react': icons,
};
const load = (path) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const errors =
    diagnostics?.filter(
      (item) => item.category === ts.DiagnosticCategory.Error,
    ) ?? [];
  assert.equal(
    errors.length,
    0,
    path +
      ': ' +
      errors
        .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
        .join('\n'),
  );
  const exports = {};
  vm.runInNewContext('(function(exports, require) {' + outputText + '\n})', {
    URLSearchParams,
  })(exports, (name) => {
    if (!(name in dependencies)) throw new Error('테스트 의존성 누락: ' + name);
    return dependencies[name];
  });
  return exports;
};
dependencies['@repo/ui'] = load(
  '../../../packages/ui/src/components/Toggle/Toggle.tsx',
);
dependencies['@repo/utils'] = {
  ...load('../../../packages/utils/src/formatNumber.ts'),
  ...load('../../../packages/utils/src/formatDate.ts'),
};
dependencies['@admin/api/analyticsDateUtils'] = load(
  '../src/api/analyticsDateUtils.ts',
);
dependencies['@admin/api/analyticsUtils'] = load(
  '../src/api/analyticsUtils.ts',
);
dependencies['@admin/hooks/queryDateUtils'] = load(
  '../src/hooks/queryDateUtils.ts',
);
for (const name of [
  'dashboardUtils',
  'dashboardChartUtils',
  'DashboardSparkline',
  'DashboardMetricCard',
  'DashboardSection',
  'DashboardTrendChart',
]) {
  dependencies['./' + name] = load(
    '../src/features/dashboard/' +
      name +
      (name.startsWith('Dashboard') ? '.tsx' : '.ts'),
  );
}
const { DashboardFunnel } = load(
  '../src/features/dashboard/DashboardFunnel.tsx',
);
const { getFraudRangeError } = load('../src/features/fraud/fraudUtils.ts');
const { shiftDate } = dependencies['@admin/api/analyticsDateUtils'];

const renderDetailLink = (from, to) => {
  const items = [];
  for (let label = from; label <= to; label = shiftDate(label, 1)) {
    items.push({
      label,
      status: 'FINAL',
      validImpressionCount: 9,
      invalidImpressionCount: 1,
      validRatio: 0.9,
      wishCount: 2,
      issueCount: 3,
      redeemCount: 1,
    });
  }
  const resource = {
    loading: false,
    data: { period: 'DAILY', from, to, aggregatedAt: null, items },
  };
  const markup = renderToStaticMarkup(
    React.createElement(
      router.MemoryRouter,
      null,
      React.createElement(DashboardFunnel, {
        resource,
        previousResource: { loading: false },
        metric: 'impressions',
        onMetricChange() {},
        compare: false,
        onCompareChange() {},
      }),
    ),
  );
  const link = markup.match(
    /<a\b(?=[^>]*aria-label="무효 노출 상세 보기")[^>]*>[\s\S]*?<\/a>/,
  )?.[0];
  assert.ok(link, '무효 노출 상세 링크가 실제 화면에 렌더링되어야 한다.');
  const href = link.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&');
  assert.ok(href);
  return {
    href,
    text: link.replace(/<[^>]*>/g, '').replaceAll('<!-- -->', ''),
    link,
    count: items.length,
  };
};

for (const [from, to, expectedFrom] of [
  ['2026-10-23', '2026-10-23', '2026-10-23'],
  ['2026-10-17', '2026-10-23', '2026-10-17'],
  ['2026-09-23', '2026-10-23', '2026-09-23'],
  ['2026-09-22', '2026-10-23', '2026-09-23'],
  ['2026-07-24', '2026-10-23', '2026-09-23'],
  ['2026-12-01', '2027-01-10', '2026-12-11'],
  ['2024-01-01', '2024-03-01', '2024-01-31'],
]) {
  test('Funnel의 실제 상세 링크 기간: ' + from + ' ~ ' + to, () => {
    const { href, text, link } = renderDetailLink(from, to);
    const url = new URL(href, 'http://test');
    assert.equal(url.pathname, '/fraud');
    assert.equal(url.searchParams.get('fraud.from'), expectedFrom);
    assert.equal(url.searchParams.get('fraud.to'), to);
    assert.equal(
      getFraudRangeError(
        url.searchParams.get('fraud.from'),
        url.searchParams.get('fraud.to'),
      ),
      '',
    );
    assert.ok(text.includes(expectedFrom));
    assert.ok(text.includes(to));
    assert.equal(text.includes('마지막 31일'), expectedFrom !== from);
    assert.ok(
      link.includes(
        'title="부정 관리는 선택한 기간의 마지막 최대 31일을 조회합니다."',
      ),
    );
  });
}

test('링크 기간을 줄여도 표시되는 무효 건수는 전체 선택 기간의 합계를 유지한다', () => {
  const { text, count } = renderDetailLink('2026-07-24', '2026-10-23');
  assert.equal(count, 92);
  assert.match(text, /무효\s*92건/);
  assert.match(text, /유효 비율\s*90.0%/);
});
