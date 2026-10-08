import { useState } from 'react';
import { Tabs } from '@repo/ui';

import { createMockBillingState } from '@admin/api/mocks/billing';
import type { TableDensity } from '@admin/components/DataTable';

import { createDailyCache, getKoreaDate } from './billingUtils';
import { PaymentHistoryTab } from './tabs/PaymentHistoryTab';
import { PointLedgerTab } from './tabs/PointLedgerTab';
import { PointPolicyTab } from './tabs/PointPolicyTab';
import { RefundRequestsTab } from './tabs/RefundRequestsTab';
import { SalesOverviewTab } from './tabs/SalesOverviewTab';

type BillingTab = 'payments' | 'refunds' | 'ledger' | 'sales' | 'policy';

interface BillingTabItem {
  disabled?: boolean;
  label: string;
  value: BillingTab;
}

const tabs: BillingTabItem[] = [
  { label: '결제 내역', value: 'payments' },
  { label: '환불 요청', value: 'refunds', disabled: true },
  { label: '포인트 변동 내역', value: 'ledger' },
  { label: '매출 현황', value: 'sales' },
  { label: '충전 정책', value: 'policy', disabled: true },
];

export const BillingManagementContent = () => {
  const [today] = useState(getKoreaDate);
  const [state, setState] = useState(() => createMockBillingState(today));
  const [dailyCache] = useState(() => createDailyCache(state.ledger, today));
  const [tab, setTab] = useState<BillingTab>('payments');
  const activeTab =
    tabs.find((item) => item.value === tab && !item.disabled)?.value ??
    'payments';
  const [density, setDensity] = useState<TableDensity>('normal');
  const [pageSize, setPageSize] = useState(20);
  const preferences = { density, setDensity, pageSize, setPageSize };
  const props = { state, setState, today, preferences };

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-display-web font-semibold">포인트 / 정산 관리</h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          충전과 환불, 점주별 포인트 원장 및 플랫폼 집계 현황을 관리합니다.
        </p>
      </header>
      <div className="overflow-x-auto">
        <Tabs
          items={tabs}
          onValueChange={(value) => {
            const next = tabs.find(
              (item) => item.value === value && !item.disabled,
            );

            if (next) setTab(next.value);
          }}
          value={activeTab}
        />
      </div>
      {activeTab === 'payments' && <PaymentHistoryTab {...props} />}
      {activeTab === 'refunds' && <RefundRequestsTab {...props} />}
      {activeTab === 'ledger' && <PointLedgerTab {...props} />}
      {activeTab === 'sales' && (
        <SalesOverviewTab {...props} dailyCache={dailyCache} />
      )}
      {activeTab === 'policy' && <PointPolicyTab {...props} />}
    </section>
  );
};
