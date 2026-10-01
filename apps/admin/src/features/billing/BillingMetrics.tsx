interface BillingMetricsProps {
  items: [string, number, string][];
  balance: [string, number, string];
  pending?: boolean;
}
export const BillingMetrics = ({
  items,
  balance,
  pending = false,
}: BillingMetricsProps) => (
  <section className="space-y-3" aria-label="포인트 요약">
    <h3 className="text-body-sm-web font-semibold">기간 내 변동</h3>
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(([label, value, description]) => (
        <div
          className="flex flex-col rounded-lg border border-border-subtle bg-bg-surface p-4"
          key={label}
        >
          <dt className="text-body-sm-web font-medium text-text-primary">
            {label}
          </dt>
          <dd className="mt-3">
            <span className="text-title-sm-web font-semibold tabular-nums text-text-primary">
              {pending ? '—' : value.toLocaleString('ko-KR')}
            </span>
            <span className="ml-1 text-caption-web text-text-secondary">P</span>
            <p className="mt-2 text-caption-web leading-5 text-text-secondary">
              {description}
            </p>
          </dd>
        </div>
      ))}
    </dl>
    <dl className="rounded-lg border border-border-subtle bg-surface-subtle px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <dt>
          <span className="text-body-sm-web font-semibold text-text-primary">
            {balance[0]}
          </span>
          <p className="mt-1 text-caption-web leading-5 text-text-secondary">
            {balance[2]}
          </p>
        </dt>
        <dd className="shrink-0">
          <span className="text-title-sm-web font-semibold tabular-nums text-text-primary">
            {pending ? '—' : balance[1].toLocaleString('ko-KR')}
          </span>
          <span className="ml-1 text-caption-web text-text-secondary">P</span>
        </dd>
      </div>
    </dl>
  </section>
);
