import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { CircleCheck, ExternalLink, ListChecks } from 'lucide-react';

import { getSettlementMismatches } from '@admin/api/settlementMismatches';
import { useBillingResource } from '@admin/features/billing/useBillingResource';

const pendingQuery = new URLSearchParams({
  resolved: 'false',
  page: '0',
  size: '1',
}).toString();

export const DashboardActionQueue = () => {
  // 처리 대기 항목은 분석 기간과 무관하게 전체 미해결 건을 조회한다.
  const resource = useBillingResource(getSettlementMismatches, pendingQuery);
  const count = resource.data?.totalElements;
  const Icon = count === 0 ? CircleCheck : ListChecks;
  return (
    <section
      aria-label="처리할 항목"
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl border border-border-subtle bg-bg-surface px-5 py-4 sm:flex sm:flex-wrap sm:items-center sm:gap-4"
    >
      <Icon
        aria-hidden
        className={`size-5 shrink-0 ${count ? 'text-text-brand' : 'text-text-secondary'}`}
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-body-sm-web font-semibold">미해결 정산 불일치</h3>
        <p className="mt-1 text-caption-web text-text-secondary">
          전체 기간 ·{' '}
          {resource.loading
            ? '확인 중입니다.'
            : resource.error
              ? '처리 대기 건수를 조회하지 못했습니다.'
              : count === 0
                ? '현재 미해결 내역이 없습니다.'
                : '확인과 처리가 필요한 내역입니다.'}
        </p>
      </div>
      <span
        aria-live="polite"
        className={`text-h2-web font-semibold tabular-nums ${count ? 'text-text-brand' : 'text-text-primary'}`}
      >
        {count === undefined ? '—' : formatNumber(count)}
        <span className="ml-1 text-body-sm-web font-normal text-text-secondary">
          건
        </span>
      </span>
      <div className="col-span-2 col-start-2 sm:ml-auto">
        {resource.error ? (
          <Button variant="neutral" onClick={resource.refresh}>
            다시 확인
          </Button>
        ) : (
          <Link
            to="/settlements?tab=mismatches&mismatches.resolved=false"
            className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-body-sm-web text-text-secondary transition-colors hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
          >
            내역 확인
            <ExternalLink aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
};
