import { useState } from 'react';
import { Tabs } from '@repo/ui';

import { createMockBillingState } from '@admin/api/mocks/billing';
import type { TableDensity } from '@admin/components/DataTable';
import { queryChoice } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import { createDailyCache, getKoreaDate } from './billingUtils';
import { PaymentHistoryTab } from './tabs/PaymentHistoryTab';
import { PointLedgerTab } from './tabs/PointLedgerTab';
import { SalesOverviewTab } from './tabs/SalesOverviewTab';

type BillingTab = 'payments' | 'ledger' | 'sales';

interface BillingTabItem {
  label: string;
  value: BillingTab;
}

const tabs: BillingTabItem[] = [
  { label: '결제 내역', value: 'payments' },
  { label: '포인트 변동 내역', value: 'ledger' },
  { label: '매출 현황', value: 'sales' },
];
const tabQuery = {
  tab: queryChoice(['payments', 'ledger', 'sales'] as const, 'payments'),
};

export const BillingManagementContent = () => {
  const [today] = useState(getKoreaDate);
  const [state] = useState(() => createMockBillingState(today));
  const [dailyCache] = useState(() => createDailyCache(state.ledger, today));
  const {
    filters: { tab },
    updateFilters,
  } = useUrlFilters('', tabQuery);
  const [density, setDensity] = useState<TableDensity>('normal');
  const preferences = { density, setDensity };
  const props = { state, today, preferences };

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-display-web font-semibold">포인트 / 정산 관리</h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          결제 내역, 점주별 포인트 원장 및 플랫폼 매출 현황을 조회합니다.
        </p>
      </header>
      <div className="overflow-x-auto">
        <Tabs
          items={tabs}
          onValueChange={(value) => {
            const next = tabs.find((item) => item.value === value);

            if (next) updateFilters({ tab: next.value });
          }}
          value={tab}
        />
      </div>
      {tab === 'payments' && <PaymentHistoryTab preferences={preferences} />}
      {tab === 'ledger' && (
        <PointLedgerTab today={today} preferences={preferences} />
      )}
      {tab === 'sales' && (
        <SalesOverviewTab {...props} dailyCache={dailyCache} />
      )}
    </section>
  );
};
