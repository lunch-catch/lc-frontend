import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import { usePendingSettlementCount } from './usePendingSettlementCount';

const mismatchLink = '/settlements?tab=mismatches&mismatches.resolved=false';

export const DashboardActionQueue = () => {
  const resource = usePendingSettlementCount();
  const count = resource.count;
  const hasPending = count !== undefined && count > 0;
  // 미해결 건이 있을 때만 위험 색과 펄스 점으로 띄우고, 그 외에는 다른 카드와 같은 톤의 한 줄로 둔다.
  return (
    <section
      aria-label="처리할 항목"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-body-sm-web ${hasPending ? 'border-status-danger-border/30 bg-status-danger-bg' : 'border-border-subtle bg-bg-surface'}`}
    >
      {hasPending && (
        <span aria-hidden className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-danger-fg opacity-60 [animation-duration:2s] motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-status-danger-fg" />
        </span>
      )}
      <h3 aria-live="polite" className="text-text-primary">
        {hasPending ? (
          <>
            처리되지 않은 정산 불일치가{' '}
            <strong className="font-semibold tabular-nums text-status-danger-fg">
              {formatNumber(count)}건
            </strong>{' '}
            있습니다.
          </>
        ) : resource.loading ? (
          '정산 불일치 내역을 확인하고 있습니다.'
        ) : resource.error ? (
          '정산 불일치 건수를 조회하지 못했습니다.'
        ) : (
          '처리되지 않은 정산 불일치가 없습니다.'
        )}
      </h3>
      <div className="ml-auto">
        {resource.error ? (
          <Button variant="neutral" onClick={resource.refresh}>
            다시 확인
          </Button>
        ) : (
          <Link
            to={mismatchLink}
            className={`inline-flex items-center gap-1 rounded-md font-medium hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-action-primary ${hasPending ? 'text-status-danger-fg' : 'text-caption-web text-text-secondary'}`}
          >
            내역 확인
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
};
