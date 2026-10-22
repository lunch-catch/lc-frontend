import { DatePicker } from '@repo/ui';
import { formatDate, formatNumber } from '@repo/utils';

import { ErrorState } from '@admin/ui/ErrorState/ErrorState';

import { getDashboardMetricHint } from './dashboardUtils';
import { useDashboardSnapshots } from './useDashboardSnapshots';

export const DashboardSnapshots = ({
  view,
}: {
  view: 'members' | 'owners';
}) => {
  const { date, maxDate, setDate, members, stores, sales } =
    useDashboardSnapshots(view);
  const member = members.data?.items.at(-1);
  // 차트 기간과 무관하게 별도로 선택한 하루의 스냅샷을 표시한다.
  const cards =
    view === 'members'
      ? [
          {
            label: '누적 회원',
            resource: members,
            value: member?.cumulativeMemberCount ?? null,
            unit: '명',
          },
          {
            label: '누적 탈퇴',
            resource: members,
            value: member?.withdrawnCount ?? null,
            unit: '명',
          },
          {
            label: '정지 회원',
            resource: members,
            value: member?.suspendedCount ?? null,
            unit: '명',
          },
        ]
      : [
          {
            label: '누적 입점 업체',
            resource: stores,
            value: stores.data?.items.at(-1)?.cumulativeStoreCount ?? null,
            unit: '개',
          },
          {
            label: '미소진 잔액',
            resource: sales,
            value: sales.data?.items.at(-1)?.unspentBalance ?? null,
            unit: 'P',
          },
        ];
  const failures = [members, stores, sales].filter(
    (resource) => resource.error,
  );
  return (
    <section
      aria-label="누적·잔액 현황"
      className="space-y-3 border-t border-border-subtle pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-body-sm-web font-medium text-text-secondary">
            누적·잔액 현황
          </h3>
          <p className="text-caption-web text-text-secondary">
            선택한 기준일의 현황입니다. 한국 시간 기준 어제까지 조회할 수
            있습니다.
          </p>
        </div>
        <div className="w-full sm:w-44">
          <DatePicker
            ariaLabel="누적·잔액 기준일 선택"
            value={date}
            maxDate={maxDate}
            onValueChange={setDate}
          />
        </div>
      </div>
      {failures.length > 0 && (
        <ErrorState
          title="누적·잔액 현황을 불러오지 못했습니다"
          description={failures[0].error}
          onRetry={() => failures.forEach((resource) => resource.retry())}
        />
      )}
      <dl
        className={`grid gap-3 sm:grid-cols-2 ${view === 'members' ? 'xl:grid-cols-3' : ''}`}
      >
        {cards.map(({ resource, ...card }) => (
          <div
            key={card.label}
            className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3"
          >
            <dt className="text-caption-web text-text-secondary">
              {card.label}
              <span className="mt-1 block text-text-tertiary">
                {formatDate(date)} 기준
              </span>
            </dt>
            <dd className="shrink-0 text-body-sm-web font-semibold tabular-nums text-text-secondary">
              {resource.loading
                ? '불러오는 중'
                : card.value === null
                  ? getDashboardMetricHint(resource)
                  : formatNumber(card.value) + card.unit}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
