import { Button } from '@repo/ui';
import { formatNumber, formatPoints } from '@repo/utils';

import { useCampaignReports } from './useCampaignReports';

export const CampaignPerformance = ({ campaignId }: { campaignId: number }) => {
  const resource = useCampaignReports([campaignId]);
  const report = resource.reports.get(campaignId);

  return (
    <section className="border-t border-border-subtle pt-5">
      <h3 className="mb-3 text-heading-sm-web font-semibold">캠페인 실적</h3>
      <p className="mb-3 text-caption-web text-text-secondary">
        전일까지 집계된 전체 기간 기준입니다.
      </p>
      {resource.error ? (
        <div className="space-y-3">
          <p role="alert" className="text-body-sm-web text-status-danger-fg">
            {resource.error}
          </p>
          <Button variant="neutral" onClick={resource.refresh}>
            실적 다시 조회
          </Button>
        </div>
      ) : !report ? (
        <p role="status" className="text-body-sm-web text-text-secondary">
          실적을 불러오는 중입니다.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-4 text-body-sm-web">
          <div>
            <dt className="text-text-secondary">소진 포인트</dt>
            <dd className="mt-2 font-semibold text-action-primary">
              {formatPoints(report.spentAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">유효 노출</dt>
            <dd className="mt-2 font-semibold text-action-primary">
              {formatNumber(report.validImpressionCount)}회
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
};
