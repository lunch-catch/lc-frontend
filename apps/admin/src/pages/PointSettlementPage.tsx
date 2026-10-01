import { useState } from 'react';
import { Tabs } from '@repo/ui';

import type { TableDensity } from '@admin/components/DataTable/DataTable';
import {
  createBillingState,
  createDailyCache,
  getKoreaDate,
} from '@admin/features/billing/billingData';
import { PaymentHistoryTab } from '@admin/features/billing/PaymentHistoryTab';
import { PointLedgerTab } from '@admin/features/billing/PointLedgerTab';
import { PointPolicyTab } from '@admin/features/billing/PointPolicyTab';
import { RefundRequestsTab } from '@admin/features/billing/RefundRequestsTab';
import { SalesOverviewTab } from '@admin/features/billing/SalesOverviewTab';

type BillingTab = 'payments' | 'refunds' | 'ledger' | 'sales' | 'policy';
interface BillingTabItem {
  label: string;
  value: BillingTab;
  disabled?: boolean;
}
// 권장 기능은 후속 구현 대상으로 남기고 현재는 조회 가능한 필수 탭만 제공한다.
const tabs: BillingTabItem[] = [
  { label: '결제 내역', value: 'payments' },
  { label: '환불 요청', value: 'refunds', disabled: true },
  { label: '포인트 변동 내역', value: 'ledger' },
  { label: '매출 현황', value: 'sales' },
  { label: '충전 정책', value: 'policy', disabled: true },
];
export const PointSettlementPage = () => {
  const [today] = useState(getKoreaDate);
  // 탭 전환으로 조회 화면이 교체되어도 결제·환불·정책의 목업 변경은 유지한다.
  const [state, setState] = useState(() => createBillingState(today));
  // 서버의 일별 사전 집계 응답을 재현한다.
  const [dailyCache] = useState(() => createDailyCache(state.ledger, today));
  const [tab, setTab] = useState<BillingTab>('payments');
  const activeTab =
    tabs.find((item) => item.value === tab && !item.disabled)?.value ??
    'payments';
  // 행 높이와 페이지당 개수는 탭을 이동해도 유지한다.
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
          value={activeTab}
          onValueChange={(value) => {
            const next = tabs.find(
              (item) => item.value === value && !item.disabled,
            );
            if (next) setTab(next.value);
          }}
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
