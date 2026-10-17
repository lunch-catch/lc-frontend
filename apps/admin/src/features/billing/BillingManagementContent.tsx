import { useState } from 'react';
import { Tabs } from '@repo/ui';

import { createMockBillingState } from '@admin/api/mocks/billing';
import { useAdminAuth } from '@admin/auth/useAdminAuth';
import type { TableDensity } from '@admin/components/DataTable';
import { queryChoice } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import { createDailyCache, getKoreaDate } from './billingUtils';
import { PaymentHistoryTab } from './tabs/PaymentHistoryTab';
import { PointLedgerTab } from './tabs/PointLedgerTab';
import { PointPolicyTab } from './tabs/PointPolicyTab';
import { RefundRequestsTab } from './tabs/RefundRequestsTab';
import { SalesOverviewTab } from './tabs/SalesOverviewTab';
import { SettlementMismatchesTab } from './tabs/SettlementMismatchesTab';

type BillingTab =
  'payments' | 'ledger' | 'refunds' | 'policy' | 'mismatches' | 'sales';

interface BillingTabItem {
  label: string;
  value: BillingTab;
}

const tabs: BillingTabItem[] = [
  { label: '결제 내역', value: 'payments' },
  { label: '포인트 변동 내역', value: 'ledger' },
  { label: '환불 요청', value: 'refunds' },
  { label: '충전 정책', value: 'policy' },
  { label: '정산 검증', value: 'mismatches' },
  { label: '매출 현황', value: 'sales' },
];
const tabQuery = {
  tab: queryChoice(
    ['payments', 'ledger', 'refunds', 'policy', 'mismatches', 'sales'] as const,
    'payments',
  ),
};

export const BillingManagementContent = () => {
  const { admin } = useAdminAuth();
  const [ledgerRevision, setLedgerRevision] = useState(0);
  const [ledgerNotice, setLedgerNotice] = useState('');
  const [today] = useState(getKoreaDate);
  // 매출 현황은 집계 API 연동 전까지 예시 원장으로 계산하며 다른 탭 조회에는 사용하지 않는다.
  const [state] = useState(() => createMockBillingState(today));
  const [dailyCache] = useState(() => createDailyCache(state.ledger, today));
  const {
    filters: { tab },
    updateFilters,
  } = useUrlFilters('', tabQuery);
  const [density, setDensity] = useState<TableDensity>('normal');
  const preferences = { density, setDensity };
  const salesProps = { state, today, preferences };

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-display-web font-semibold">포인트 / 정산 관리</h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          결제·포인트 내역과 환불 요청, 충전 정책 및 정산 불일치를 관리합니다.
        </p>
      </header>
      <div className="overflow-x-auto ui-scrollbar">
        <div className="w-max">
          <Tabs
            items={tabs}
            onValueChange={(value) => {
              const next = tabs.find((item) => item.value === value);

              if (next) updateFilters({ tab: next.value });
            }}
            value={tab}
          />
        </div>
      </div>
      {tab === 'payments' && <PaymentHistoryTab preferences={preferences} />}
      {tab === 'ledger' && (
        <>
          {ledgerNotice && (
            <p role="status" className="text-body-sm-web text-text-secondary">
              {ledgerNotice}
            </p>
          )}
          {/* 조정 후 기존 커서를 버리고 원장과 기간 합계를 함께 다시 읽는다. */}
          <PointLedgerTab
            key={`${admin?.adminId}:${ledgerRevision}`}
            today={today}
            preferences={preferences}
            onAdjusted={(ledgerId) => {
              setLedgerRevision((value) => value + 1);
              setLedgerNotice(
                `포인트 조정을 완료했습니다. (원장 ID: ${ledgerId})`,
              );
            }}
          />
        </>
      )}
      {tab === 'refunds' && (
        <RefundRequestsTab key={admin?.adminId} preferences={preferences} />
      )}
      {tab === 'policy' && (
        <PointPolicyTab key={admin?.adminId} preferences={preferences} />
      )}
      {tab === 'mismatches' && (
        <SettlementMismatchesTab
          key={admin?.adminId}
          preferences={preferences}
        />
      )}
      {tab === 'sales' && (
        <SalesOverviewTab {...salesProps} dailyCache={dailyCache} />
      )}
    </section>
  );
};
