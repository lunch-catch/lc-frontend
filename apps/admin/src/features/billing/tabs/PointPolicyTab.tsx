import { useState } from 'react';
import { Button } from '@repo/ui';
import { formatDate, formatWon } from '@repo/utils';
import { Clock3, Plus, Settings2 } from 'lucide-react';

import {
  getPointPolicies,
  getPointPolicyHistory,
  type PointPolicy,
} from '@admin/api/pointPolicy';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { ErrorState } from '@admin/ui/ErrorState/ErrorState';

import { policyHistoryQuery } from '../billingQuery';
import type { BillingTablePreferences } from '../billingView';
import {
  type BillingServerColumn,
  BillingServerTable,
} from '../ui/BillingServerTable';
import { PointPolicyEditor } from '../ui/PointPolicyEditor';
import { useBillingResource } from '../useBillingResource';

const columns: BillingServerColumn<PointPolicy>[] = [
  {
    key: 'effectiveDate',
    label: '적용일',
    width: '16%',
    minWidth: 110,
    render: (item) => formatDate(item.effectiveDate),
  },
  {
    key: 'minChargeAmount',
    label: '최소 충전 금액',
    width: '19%',
    minWidth: 130,
    align: 'right',
    render: (item) => formatWon(item.minChargeAmount),
  },
  {
    key: 'chargeProducts',
    label: '충전 상품',
    align: 'right',
    width: '30%',
    minWidth: 230,
    render: (item) =>
      item.chargeProducts.map((amount) => formatWon(amount)).join(' · '),
  },
  {
    key: 'createdBy',
    label: '변경자 ID',
    width: '12%',
    minWidth: 100,
    render: (item) => item.createdBy ?? '—',
  },
  {
    key: 'changeReason',
    label: '변경 사유',
    width: '23%',
    minWidth: 180,
    render: (item) => item.changeReason || '—',
  },
];
const PolicySummary = ({
  policy,
  title,
}: {
  policy: PointPolicy;
  title?: string;
}) => (
  <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-surface p-4">
    {title && (
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-body-sm-web font-semibold">{title}</h4>
        <span className="text-caption-web text-text-secondary">
          {formatDate(policy.effectiveDate)}부터
        </span>
      </div>
    )}
    <dl className={title ? 'mt-4 space-y-4' : 'space-y-4'}>
      <div>
        <dt className="text-caption-web text-text-secondary">최소 충전 금액</dt>
        <dd className="mt-1 text-h2-web font-semibold tabular-nums">
          {formatWon(policy.minChargeAmount)}
        </dd>
      </div>
      <div>
        <dt className="text-caption-web text-text-secondary">
          충전 상품 · {policy.chargeProducts.length}개
        </dt>
        <dd className="mt-2 flex flex-wrap gap-2">
          {policy.chargeProducts.map((amount, index) => (
            <span
              key={index}
              className="rounded-md bg-surface-subtle px-2.5 py-1 text-caption-web font-medium tabular-nums"
            >
              {formatWon(amount)}
            </span>
          ))}
        </dd>
      </div>
    </dl>
    <div className="mt-4 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
      <p>변경자 ID · {policy.createdBy ?? '—'}</p>
      <p className="mt-1 break-words leading-5">
        변경 사유 · {policy.changeReason || '없음'}
      </p>
    </div>
  </section>
);

export const PointPolicyTab = ({
  preferences,
}: {
  preferences: BillingTablePreferences;
}) => {
  const policies = useBillingResource(getPointPolicies, '');
  const { filters, updateFilters } = useUrlFilters(
    'policy.',
    policyHistoryQuery,
  );
  const history = useBillingResource(
    getPointPolicyHistory,
    new URLSearchParams({
      page: String(filters.page - 1),
      size: String(filters.size),
    }).toString(),
  );
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const hasScheduledPolicy = Boolean(policies.data?.next);
  // 내일 적용분이 있으면 이어서 편집하고, 없으면 현재 정책을 초기값으로 사용한다.
  const editablePolicy = policies.data?.next ?? policies.data?.current;
  return (
    <div className="@container flex flex-col gap-6">
      {notice && (
        <p role="status" className="text-body-sm-web text-text-secondary">
          {notice}
        </p>
      )}
      <section aria-label="현재 충전 정책" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-heading-sm-web font-semibold">
              현재 충전 정책
            </h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-caption-web text-text-secondary">
              <Clock3 aria-hidden className="size-3.5 shrink-0" />
              변경 사항은 내일 00:00(한국 시간)부터 적용됩니다.
            </p>
          </div>
          <Button
            variant="primary"
            leadingIcon={
              hasScheduledPolicy ? (
                <Settings2 aria-hidden className="size-4" />
              ) : (
                <Plus aria-hidden className="size-4" />
              )
            }
            disabled={
              !editablePolicy || policies.loading || Boolean(policies.error)
            }
            onClick={() => {
              setNotice('');
              setEditing(true);
            }}
          >
            {hasScheduledPolicy ? '예약 정책 수정' : '정책 변경 예약'}
          </Button>
        </div>
        {policies.loading ? (
          <p role="status" className="text-caption-web text-text-secondary">
            충전 정책을 불러오는 중입니다.
          </p>
        ) : policies.error ? (
          <ErrorState description={policies.error} onRetry={policies.refresh} />
        ) : (
          policies.data && (
            <div className="grid gap-3 pb-2 @3xl:grid-cols-2">
              <PolicySummary policy={policies.data.current} />
              {policies.data.next ? (
                <PolicySummary
                  policy={policies.data.next}
                  title="내일 적용 예정"
                />
              ) : (
                <section className="flex flex-col justify-center rounded-lg border border-dashed border-border-subtle p-4">
                  <h4 className="text-body-sm-web font-medium">
                    내일 적용 예정
                  </h4>
                  <p className="mt-2 text-caption-web leading-5 text-text-secondary">
                    예약된 변경이 없습니다. 현재 정책이 계속 적용됩니다.
                  </p>
                </section>
              )}
            </div>
          )
        )}
      </section>
      <section className="flex flex-col gap-4 border-t border-border-subtle pt-6">
        <BillingServerTable
          heading="정책 변경 이력"
          description="적용일 최신순으로 표시합니다."
          tableId="billing.policyHistory"
          columns={columns}
          items={history.data?.items ?? []}
          rowId={(item) => item.effectiveDate}
          loading={history.loading}
          error={history.error}
          onRetry={history.refresh}
          emptyMessage="등록된 정책 이력이 없습니다."
          preferences={preferences}
          page={filters.page}
          size={filters.size}
          total={history.data?.totalElements}
          onPageChange={(page) => updateFilters({ page })}
          onSizeChange={(size) => updateFilters({ size, page: 1 })}
        />
      </section>
      {editing && editablePolicy && policies.data && (
        <PointPolicyEditor
          policy={editablePolicy}
          currentPolicy={policies.data.current}
          hasScheduledPolicy={hasScheduledPolicy}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setNotice('내일 적용할 충전 정책을 저장했습니다.');
            // 예약 정책도 이력 첫 행에 포함되므로 저장 후 첫 페이지와 두 조회를 함께 갱신한다.
            updateFilters({ page: 1 }, true);
            policies.refresh();
            history.refresh();
          }}
        />
      )}
    </div>
  );
};
