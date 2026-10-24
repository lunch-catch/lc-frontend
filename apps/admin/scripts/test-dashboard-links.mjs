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

// 실제 Funnel·지표 카드·차트를 렌더링해 상세 링크, 비교 기간 안내, 날짜 정렬을 검증한다.
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

const comparisonResource = (from, to) => {
  const items = [];
  for (let label = from; label <= to; label = shiftDate(label, 1))
    items.push({
      label,
      status: 'FINAL',
      issueCount: 10,
      redeemCount: 5,
      wishCount: 20,
      validImpressionCount: 90,
      invalidImpressionCount: 10,
      spentAmount: 100,
      chargeAmount: 200,
      refundAmount: 10,
      adjustAmount: 5,
    });
  return {
    loading: false,
    data: { period: 'DAILY', from, to, aggregatedAt: null, items },
  };
};
const comparisonHints = (markup) =>
  Array.from(
    markup.matchAll(/<span\b[^>]*role="tooltip"[^>]*>([^<]*)<\/span>/g),
    (match) => match[1],
  );
const renderComparison = (resource, previousResource, compare = true) =>
  renderToStaticMarkup(
    React.createElement(
      router.MemoryRouter,
      null,
      React.createElement(DashboardFunnel, {
        resource,
        previousResource,
        metric: 'issued',
        onMetricChange() {},
        compare,
        onCompareChange() {},
      }),
    ),
  );

for (const [from, to, previousFrom, previousTo, expected] of [
  [
    '2026-10-17',
    '2026-10-23',
    '2026-10-10',
    '2026-10-16',
    '2026.10.10 ~ 2026.10.16 대비',
  ],
  [
    '2026-09-24',
    '2026-10-23',
    '2026-08-25',
    '2026-09-23',
    '2026.08.25 ~ 2026.09.23 대비',
  ],
]) {
  test(
    '비교 토글과 이전 기간 범례에 실제 비교 날짜를 표시한다: ' + expected,
    () => {
      const markup = renderComparison(
        comparisonResource(from, to),
        comparisonResource(previousFrom, previousTo),
      );
      assert.equal(
        comparisonHints(markup).filter((hint) => hint === expected).length,
        2,
      );
      assert.ok(!markup.includes('cursor-help'));
      assert.ok(!markup.includes('title="' + expected + '"'));
      assert.ok(markup.includes('이전 기간 비교'));
      assert.ok(markup.includes('이전 기간'));
      const withoutComparison = renderComparison(
        comparisonResource(from, to),
        comparisonResource(previousFrom, previousTo),
        false,
      );
      assert.equal(
        comparisonHints(withoutComparison).filter((hint) => hint === expected)
          .length,
        1,
      );
    },
  );
}

test('비교 데이터가 없으면 날짜를 추측하지 않고 로딩·비교 불가 사유를 안내한다', () => {
  const resource = comparisonResource('2026-10-17', '2026-10-23');
  assert.ok(
    renderComparison(resource, { loading: true }).includes(
      '이전 기간 데이터를 불러오는 중입니다.',
    ),
  );
  assert.ok(
    renderComparison(resource, { loading: false, error: '조회 실패' }).includes(
      '이전 기간 데이터가 없어 비교할 수 없습니다.',
    ),
  );
});

test('점주 카드 증감률의 툴팁에도 같은 비교 기간을 표시한다', () => {
  const { DashboardOverview } = load(
    '../src/features/dashboard/DashboardOverview.tsx',
  );
  const markup = renderToStaticMarkup(
    React.createElement(DashboardOverview, {
      metrics: {
        sales: comparisonResource('2026-10-17', '2026-10-23'),
        previousSales: comparisonResource('2026-10-10', '2026-10-16'),
      },
    }),
  );
  assert.equal(
    comparisonHints(markup).filter(
      (hint) => hint === '2026.10.10 ~ 2026.10.16 대비',
    ).length,
    4,
  );
});

test('막대그래프의 첫·마지막 날짜도 각 막대 중심에 맞춰 표시한다', () => {
  const { DashboardTrendChart } = dependencies['./DashboardTrendChart'];
  for (const count of [1, 2, 7]) {
    const labels = Array.from(
      { length: count },
      (_, index) => '2026-10-' + (17 + index),
    );
    const markup = renderToStaticMarkup(
      React.createElement(DashboardTrendChart, {
        title: '신규 회원 추이',
        variant: 'bar',
        labels,
        primary: { name: '신규 회원', values: labels.map(() => 50) },
      }),
    );
    const bars = [
      ...markup.matchAll(/<rect\b[^>]*fill="url\([^"]*-bar\)"[^>]*>/g),
    ].map((match) => match[0]);
    const dates = [...markup.matchAll(/<text\b([^>]*)>(10-\d{2})<\/text>/g)];
    assert.equal(bars.length, count);
    assert.equal(dates.length, count);
    dates.forEach((date, index) => {
      const center =
        Number(bars[index].match(/\bx="([^"]+)"/)[1]) +
        Number(bars[index].match(/\bwidth="([^"]+)"/)[1]) / 2;
      const labelX = Number(date[1].match(/\bx="([^"]+)"/)[1]);
      assert.ok(Math.abs(labelX - center) < 0.001);
      assert.ok(date[1].includes('text-anchor="middle"'));
    });
  }
});

test('선그래프 양끝 날짜는 축 경계 바깥으로 잘리지 않도록 기존 정렬을 유지한다', () => {
  const { DashboardTrendChart } = dependencies['./DashboardTrendChart'];
  const markup = renderToStaticMarkup(
    React.createElement(DashboardTrendChart, {
      title: '활성 회원 추이',
      labels: ['2026-10-17', '2026-10-23'],
      primary: { name: '활성 회원', values: [10, 20] },
    }),
  );
  const dates = [...markup.matchAll(/<text\b([^>]*)>(10-\d{2})<\/text>/g)];
  assert.ok(dates[0][1].includes('text-anchor="start"'));
  assert.ok(dates[1][1].includes('text-anchor="end"'));
});
