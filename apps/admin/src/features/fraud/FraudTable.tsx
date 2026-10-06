import { StatusBadge } from '@repo/ui';
import { formatNumber } from '@repo/utils';

import {
  DataTable,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '@admin/components/DataTable/DataTable';

import { FraudMemberAction } from './FraudMemberAction';
import type {
  CampaignFraudSummary,
  FraudSort,
  FraudSortKey,
  FraudTab,
  FraudTableRow,
} from './fraudTypes';
import { invalidReasonDescriptions } from './fraudUtils';

interface FraudTableProps {
  tab: FraudTab;
  rows: FraudTableRow[];
  campaigns: CampaignFraudSummary[];
  density: TableDensity;
  status: 'loading' | 'error' | 'success';
  sort: FraudSort | null;
  onSortChange: (key: FraudSortKey) => void;
  onManageMember: (userId: string) => void;
}

interface FraudTableHeader {
  label: string;
  key?: FraudSortKey;
  minWidth: number;
  width: string;
}

// 헤더와 열 너비를 같은 정의에서 생성해 탭별 로딩·빈 상태의 열 개수도 일치시킨다.
const impressionHeaders: FraudTableHeader[] = [
  { label: '캠페인 ID', key: 'campaignId', minWidth: 130, width: '14%' },
  { label: '사용자 ID', key: 'userId', minWidth: 130, width: '14%' },
  { label: '무효 사유 코드', key: 'reasonCode', minWidth: 220, width: '24%' },
  { label: '건수', key: 'count', minWidth: 80, width: '9%' },
  { label: '캠페인 무효 비율', minWidth: 135, width: '14%' },
  { label: '경고', minWidth: 170, width: '15%' },
  { label: '계정 관리', minWidth: 120, width: '10%' },
];

const requestHeaders: FraudTableHeader[] = [
  { label: '사용자 ID', key: 'userId', minWidth: 180, width: '40%' },
  { label: '요청 제한 초과 건수', key: 'count', minWidth: 180, width: '40%' },
  { label: '계정 관리', minWidth: 120, width: '20%' },
];

export const FraudTable = ({
  tab,
  rows,
  campaigns,
  density,
  status,
  sort,
  onSortChange,
  onManageMember,
}: FraudTableProps) => {
  const isImpressionTab = tab === 'impressions';
  const headers = isImpressionTab ? impressionHeaders : requestHeaders;
  const campaignMap = new Map(
    campaigns.map((campaign) => [campaign.campaignId, campaign]),
  );

  return (
    <div className="overflow-x-auto">
      <DataTable
        aria-label={
          isImpressionTab
            ? '무효 노출 사유별 집계'
            : '사용자별 피드 요청 제한 초과 집계'
        }
        className={
          isImpressionTab
            ? 'min-w-[1040px] table-fixed'
            : 'min-w-[480px] table-fixed'
        }
        columns={headers.map(({ minWidth, width }) => ({ minWidth, width }))}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            {headers.map(({ label, key }, index) => (
              <TableHeaderCell
                columnIndex={index}
                key={label}
                onSortChange={key ? () => onSortChange(key) : undefined}
                sortDirection={sort?.key === key ? sort?.direction : undefined}
              >
                {label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {status !== 'success' || rows.length === 0 ? (
            <tr>
              {status === 'loading' ? (
                <TableLoading colSpan={headers.length} />
              ) : status === 'error' ? (
                <TableError colSpan={headers.length} />
              ) : (
                <TableEmpty colSpan={headers.length}>
                  조회된 내역이 없습니다
                </TableEmpty>
              )}
            </tr>
          ) : (
            rows.map((row) => {
              const campaign = row.campaignId
                ? campaignMap.get(row.campaignId)
                : undefined;
              const warningLabels = [
                campaign?.highInvalidRate ? '무효 비율 초과' : '',
                campaign?.concentrated ? '소수 계정 집중' : '',
              ].filter(Boolean);
              return (
                <TableRow key={row.id}>
                  {isImpressionTab && <TableCell>{row.campaignId}</TableCell>}
                  <TableCell>{row.userId}</TableCell>
                  {isImpressionTab && (
                    <TableCell
                      title={
                        row.reasonCode
                          ? invalidReasonDescriptions[row.reasonCode]
                          : undefined
                      }
                    >
                      {row.reasonCode}
                    </TableCell>
                  )}
                  <TableCell>{formatNumber(row.count)}건</TableCell>
                  {isImpressionTab && (
                    <>
                      <TableCell
                        className={
                          campaign?.highInvalidRate
                            ? 'text-status-danger-fg'
                            : undefined
                        }
                      >
                        {campaign
                          ? `${(campaign.invalidRate * 100).toFixed(1)}%`
                          : '—'}
                      </TableCell>
                      <TableCell title={warningLabels.join(', ')}>
                        {warningLabels.length > 0 ? (
                          <StatusBadge variant="warning">
                            {warningLabels.join(' · ')}
                          </StatusBadge>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <FraudMemberAction
                      onManageMember={onManageMember}
                      userId={row.userId}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
};
