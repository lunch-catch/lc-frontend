import { formatNumber } from '@repo/utils';

import {
  DataTable,
  TableCell,
  TableEmpty,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable/DataTable';

import { FraudMemberAction } from './FraudMemberAction';
import type {
  CampaignFraudSummary,
  FraudFilters,
  FraudReport,
} from './fraudTypes';
import { getCampaignExposureUsers } from './fraudUtils';

interface FraudCampaignDetailProps {
  campaign: CampaignFraudSummary;
  report: FraudReport;
  filters: FraudFilters;
  onManageMember: (userId: string) => void;
}

export const FraudCampaignDetail = ({
  campaign,
  report,
  filters,
  onManageMember,
}: FraudCampaignDetailProps) => {
  // 유효 노출만 반복하는 사용자도 포함해 집중 노출의 전체 분포를 확인한다.
  const users = getCampaignExposureUsers(report, filters, campaign.campaignId);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm-web text-text-secondary">
        선택 기간의 전체 노출 {formatNumber(campaign.totalCount)}건 · 무효{' '}
        {formatNumber(campaign.invalidCount)}건 · 사용자{' '}
        {formatNumber(campaign.userCount)}명
      </p>
      <p className="text-caption-web text-text-secondary">
        유효 노출을 포함한 사용자별 집계입니다. 의심 신호를 확인한 뒤 계정
        정지를 검토해 주세요.
      </p>
      <div className="overflow-x-auto">
        <DataTable aria-label="캠페인 사용자별 노출 집계">
          <thead>
            <tr>
              <TableHeaderCell>사용자 ID</TableHeaderCell>
              <TableHeaderCell>전체 노출</TableHeaderCell>
              <TableHeaderCell>무효 노출</TableHeaderCell>
              <TableHeaderCell>계정 관리</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <TableEmpty colSpan={4}>조회된 사용자가 없습니다</TableEmpty>
              </tr>
            )}
            {users.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>{user.userId}</TableCell>
                <TableCell>{formatNumber(user.totalCount)}건</TableCell>
                <TableCell>{formatNumber(user.invalidCount)}건</TableCell>
                <TableCell>
                  <FraudMemberAction
                    userId={user.userId}
                    onManageMember={onManageMember}
                  />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
};
