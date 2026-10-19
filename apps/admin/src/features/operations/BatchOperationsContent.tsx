import { Tabs } from '@repo/ui';

import { queryChoice } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import { AggregationOperationsSection } from './AggregationOperationsSection';
import { BatchRetrySection } from './BatchRetrySection';

const tabs = [
  { value: 'aggregation', label: '통계 집계' },
  { value: 'retry', label: '실패한 배치 재실행' },
];
const schema = {
  tab: queryChoice(['aggregation', 'retry'] as const, 'aggregation'),
};

export const BatchOperationsContent = () => {
  const { filters, updateFilters } = useUrlFilters('operations.', schema);
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-display-web font-semibold">배치 운영</h2>
      <Tabs
        items={tabs}
        value={filters.tab}
        onValueChange={(value) => {
          if (value === 'aggregation' || value === 'retry')
            updateFilters({ tab: value });
        }}
      />
      {filters.tab === 'aggregation' ? (
        <AggregationOperationsSection />
      ) : (
        <BatchRetrySection />
      )}
    </section>
  );
};
