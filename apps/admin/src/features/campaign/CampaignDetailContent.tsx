import { StatusBadge } from '@repo/ui';
import {
  formatDateRange,
  formatDateTime,
  formatNumber,
  formatPoints,
} from '@repo/utils';
import { Image } from 'lucide-react';

import type { Campaign, CampaignReport } from './campaignTypes';
import { campaignStatusMeta, getBudgetProgress } from './campaignUtils';

interface CampaignDetailContentProps {
  campaign: Campaign | null;
  report?: CampaignReport;
}

export const CampaignDetailContent = ({
  campaign,
  report,
}: CampaignDetailContentProps) => {
  const progress = campaign ? getBudgetProgress(campaign) : 0;
  const items = campaign
    ? [
        ['캠페인 ID', campaign.id],
        ['점주 ID', campaign.ownerId],
        ['등록 시각', formatDateTime(campaign.registeredAt)],
        ['가게', campaign.storeName],
        ['집행 기간', formatDateRange(campaign.startDate, campaign.endDate)],
        ['하루 사용 한도', formatPoints(campaign.dailyBudget)],
        ['오늘 사용 포인트', formatPoints(campaign.todaySpent)],
        ['예산 사용률', `${getBudgetProgress(campaign).toFixed(1)}%`],
        ['집계 확정일', report?.confirmedThrough ?? '-'],
        ['누적 소진 포인트', report ? formatPoints(report.spentPoints) : '-'],
        [
          '누적 유효 노출',
          report ? `${formatNumber(report.validImpressions)}회` : '-',
        ],
        ['배분 슬롯 노출', `${formatNumber(campaign.allocationImpressions)}회`],
        [
          '관련성 슬롯 노출',
          `${formatNumber(campaign.relevanceImpressions)}회`,
        ],
        ['무효 노출', `${formatNumber(campaign.invalidImpressions)}회`],
        [
          '노출 대상',
          `${campaign.radius}m · ${campaign.gender} · ${campaign.ageGroups}`,
        ],
      ]
    : [];

  return (
    <>
      {campaign && (
        <>
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption-web text-text-secondary">
                {campaign.id}
              </span>
              <StatusBadge
                variant={campaignStatusMeta[campaign.status].variant}
              >
                {campaignStatusMeta[campaign.status].label}
              </StatusBadge>
            </div>
            <h3 className="mt-3 text-title-sm-web font-semibold">
              {campaign.storeName}
            </h3>
            <p className="mt-1 text-caption-web text-text-secondary">
              {formatDateRange(campaign.startDate, campaign.endDate)}
            </p>
          </div>
          {campaign.pausedReason && (
            <p className="mb-6 rounded-lg bg-status-warning-bg px-4 py-3 text-caption-web text-status-warning-fg">
              중단 사유: {campaign.pausedReason}
            </p>
          )}
          <section className="mb-6 rounded-xl bg-surface-subtle p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-body-sm-web font-semibold">예산 사용률</h3>
              <span className="text-title-sm-web font-semibold text-action-primary">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div
              className="my-3 h-2 overflow-hidden rounded-full bg-border-subtle"
              role="meter"
              aria-label="예산 사용률"
              aria-valuemin={0}
              aria-valuemax={Math.max(100, progress)}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-action-primary"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
              <div>
                <dt className="text-caption-web text-text-secondary">
                  오늘 사용
                </dt>
                <dd className="mt-1 text-body-md-web font-semibold">
                  {formatPoints(campaign.todaySpent)}
                </dd>
              </div>
              <div>
                <dt className="text-caption-web text-text-secondary">
                  누적 유효 노출
                </dt>
                <dd className="mt-1 text-body-md-web font-semibold">
                  {report ? `${formatNumber(report.validImpressions)}회` : '-'}
                </dd>
              </div>
            </dl>
          </section>
          <section className="mb-6">
            <h3 className="mb-4 text-body-sm-web font-semibold">
              집행 및 노출 정보
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              {items
                .filter(
                  ([label]) =>
                    ![
                      '캠페인 ID',
                      '가게',
                      '집행 기간',
                      '오늘 사용 포인트',
                      '예산 사용률',
                      '누적 유효 노출',
                    ].includes(label),
                )
                .map(([label, value]) => (
                  <div className="min-w-0 text-body-sm-web" key={label}>
                    <dt className="text-caption-web text-text-secondary">
                      {label}
                    </dt>
                    <dd className="mt-1.5 break-words font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <section className="border-t border-border-subtle pt-4">
            <h3 className="mb-3 text-body-sm-web font-semibold">포스터</h3>
            <div className="overflow-hidden rounded-xl bg-surface-subtle">
              {campaign.posterImageUrl ? (
                <img
                  src={campaign.posterImageUrl}
                  alt={`${campaign.storeName} 캠페인 포스터`}
                  className="block h-auto w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div
                  role="img"
                  aria-label="포스터 이미지 없음"
                  className="flex aspect-[16/9] items-center justify-center text-text-tertiary"
                >
                  <Image
                    aria-hidden="true"
                    className="size-10 shrink-0 text-text-tertiary"
                  />
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
};
