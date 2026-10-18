import { useState } from 'react';
import { Button } from '@repo/ui';
import { formatDate, formatWon } from '@repo/utils';
import { ChevronDown, Settings2 } from 'lucide-react';

import {
  getPointPolicies,
  getPointPolicyHistory,
  type PointPolicy,
} from '@admin/api/pointPolicy';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import { policyHistoryQuery } from '../billingQuery';
import type { BillingTablePreferences } from '../billingView';
import {
  type BillingServerColumn,
  BillingServerTable,
} from '../components/BillingServerTable';
import { PointPolicyEditor } from '../components/PointPolicyEditor';
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
  title: string;
}) => (
  <section className="min-w-0 space-y-3">
    <h4 className="text-body-sm-web font-medium">{title}</h4>
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-caption-web">
      <dt className="text-text-secondary">적용일</dt>
      <dd>{formatDate(policy.effectiveDate)}</dd>
      <dt className="text-text-secondary">최소 충전 금액</dt>
      <dd>{formatWon(policy.minChargeAmount)}</dd>
      <dt className="text-text-secondary">충전 상품</dt>
      <dd className="break-words leading-5">
        {policy.chargeProducts.map((amount) => formatWon(amount)).join(' · ')}
      </dd>
      <dt className="text-text-secondary">변경자 ID</dt>
      <dd>{policy.createdBy ?? '—'}</dd>
      <dt className="text-text-secondary">변경 사유</dt>
      <dd className="break-words leading-5">{policy.changeReason || '—'}</dd>
    </dl>
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
  // 내일 적용분이 있으면 이어서 편집하고, 없으면 현재 정책을 초기값으로 사용한다.
  const editablePolicy = policies.data?.next ?? policies.data?.current;
  return (
    <div className="@container flex flex-col gap-6">
      {notice && (
        <p role="status" className="text-body-sm-web text-text-secondary">
          {notice}
        </p>
      )}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-heading-sm-web font-semibold">정책 변경 이력</h3>
          <p className="mt-1 text-caption-web text-text-secondary">
            적용일 최신순으로 표시합니다.
          </p>
        </div>
        <BillingServerTable
          tableId="billing.policyHistory"
          columns={columns}
          items={history.data?.items ?? []}
          rowId={(item) => item.effectiveDate}
          loading={history.loading}
          error={history.error}
          emptyMessage="등록된 정책 이력이 없습니다."
          preferences={preferences}
          page={filters.page}
          size={filters.size}
          total={history.data?.totalElements ?? 0}
          onPageChange={(page) => updateFilters({ page })}
          onSizeChange={(size) => updateFilters({ size, page: 1 })}
        />
      </section>
      <details className="group border-t border-border-subtle pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-2 focus-visible:outline-2 focus-visible:outline-action-primary [&::-webkit-details-marker]:hidden">
          <span className="text-body-sm-web font-medium">충전 정책 설정</span>
          <span className="flex items-center gap-2 text-caption-web text-text-secondary">
            {policies.error
              ? '정책 조회 실패'
              : policies.data?.next
                ? '내일 적용할 변경 있음'
                : '현재 정책 및 변경 예약'}
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </span>
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption-web text-text-secondary">
              변경한 정책은 내일부터 적용됩니다.
            </p>
            <Button
              variant="neutral"
              leadingIcon={<Settings2 aria-hidden className="size-4" />}
              disabled={!editablePolicy || policies.loading}
              onClick={() => {
                setNotice('');
                setEditing(true);
              }}
            >
              내일 적용할 정책 설정
            </Button>
          </div>
          {policies.loading ? (
            <p role="status" className="text-caption-web text-text-secondary">
              충전 정책을 불러오는 중입니다.
            </p>
          ) : policies.error ? (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {policies.error}
            </p>
          ) : (
            policies.data && (
              <div className="grid gap-6 pb-2 @3xl:grid-cols-2">
                <PolicySummary
                  policy={policies.data.current}
                  title="현재 적용 중"
                />
                {policies.data.next ? (
                  <PolicySummary
                    policy={policies.data.next}
                    title="내일 적용 예정"
                  />
                ) : (
                  <section className="space-y-3">
                    <h4 className="text-body-sm-web font-medium">
                      내일 적용 예정
                    </h4>
                    <p className="text-caption-web leading-5 text-text-secondary">
                      예약된 변경이 없습니다. 현재 정책이 계속 적용됩니다.
                    </p>
                  </section>
                )}
              </div>
            )
          )}
        </div>
      </details>
      {editing && editablePolicy && (
        <PointPolicyEditor
          policy={editablePolicy}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setNotice('내일 적용할 충전 정책을 저장했습니다.');
            updateFilters({ page: 1 }, true);
            policies.refresh();
            history.refresh();
          }}
        />
      )}
    </div>
  );
};
