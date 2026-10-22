import { Link } from 'react-router';
import { Button, StatusBadge } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  ListChecks,
} from 'lucide-react';

import { usePendingSettlementCount } from './usePendingSettlementCount';

export const DashboardActionQueue = () => {
  const resource = usePendingSettlementCount();
  const count = resource.count;
  const hasPending = count !== undefined && count > 0;
  const Icon = hasPending
    ? CircleAlert
    : count === 0
      ? CircleCheck
      : ListChecks;
  return (
    <section
      aria-label="처리할 항목"
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-xl border bg-bg-surface px-5 py-4 sm:flex sm:flex-wrap sm:gap-5 ${hasPending ? 'border-action-primary ring-1 ring-action-primary/15' : 'border-border-subtle'}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="inline-flex items-center gap-2 text-body-sm-web font-semibold text-text-primary">
            <Icon
              aria-hidden
              className={`size-4 shrink-0 ${hasPending ? 'text-text-brand' : 'text-text-secondary'}`}
            />
            미해결 정산 불일치
          </h3>
          {hasPending && <StatusBadge variant="warning">확인 필요</StatusBadge>}
        </div>
        <p className="mt-1.5 text-caption-web text-text-secondary">
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
        className={`inline-flex items-baseline gap-1 rounded-lg px-3 py-2 font-semibold tabular-nums ${hasPending ? 'bg-surface-brand text-h1 text-text-brand' : 'text-h2-web text-text-primary'}`}
      >
        {count === undefined ? '—' : formatNumber(count)}
        <span className="text-caption-web font-normal">건</span>
      </span>
      <div className="col-span-2 sm:ml-auto">
        {resource.error ? (
          <Button variant="neutral" onClick={resource.refresh}>
            다시 확인
          </Button>
        ) : (
          <Link
            to="/settlements?tab=mismatches&mismatches.resolved=false"
            className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border-subtle px-3 py-2 text-caption-web font-medium text-text-secondary transition-colors hover:border-action-primary hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
          >
            내역 확인
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
};
