import type { ReactNode } from 'react';
import { Button, StatusBadge } from '@repo/ui';
import {
  formatDateTime,
  formatNumber,
  formatPoints,
  formatWon,
} from '@repo/utils';

import { type CampaignAgeGroup, getCampaign } from '@admin/api/campaigns';
import { useApiResource } from '@admin/hooks/useApiResource';

import { CampaignPerformance } from './CampaignPerformance';
import {
  campaignStatusMeta,
  getCampaignDiscount,
  getCampaignError,
  getCampaignPeriod,
} from './campaignUtils';

const actorLabels = { ADMIN: '관리자', OWNER: '점주', SYSTEM: '시스템' };
const pauseLabels = {
  ADMIN: '관리자에 의한 중단',
  OWNER: '점주에 의한 중단',
  NO_POINTS: '포인트 부족',
};
const genderLabels = { ALL: '전체', MALE: '남성', FEMALE: '여성' };
const ageLabels: Record<CampaignAgeGroup, string> = {
  AGE_20S: '20대',
  AGE_30S: '30대',
  AGE_40S: '40대',
  AGE_50_PLUS: '50대 이상',
};

const DetailItem = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-2 text-body-sm-web">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">
      {children}
    </dd>
  </div>
);

export const CampaignDetails = ({ campaignId }: { campaignId: string }) => {
  const validId =
    /^[1-9]\d*$/.test(campaignId) && Number.isSafeInteger(Number(campaignId));
  const resource = useApiResource(
    getCampaign,
    validId ? campaignId : null,
    getCampaignError,
  );
  if (!validId)
    return <p role="alert">캠페인 ID는 양의 정수로 입력해 주세요.</p>;
  if (resource.loading)
    return (
      <p role="status" className="text-body-sm-web text-text-secondary">
        캠페인 상세를 불러오는 중입니다.
      </p>
    );
  if (resource.error)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-body-sm-web text-status-danger-fg">
          {resource.error}
        </p>
        <Button variant="neutral" onClick={resource.refresh}>
          다시 조회
        </Button>
      </div>
    );
  const campaign = resource.data;
  if (!campaign) return null;
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-heading-sm-web font-semibold">기본 정보</h3>
          <StatusBadge variant={campaignStatusMeta[campaign.status].variant}>
            {campaignStatusMeta[campaign.status].label}
          </StatusBadge>
        </div>
        <dl>
          <DetailItem label="캠페인 ID">{campaign.campaignId}</DetailItem>
          <DetailItem label="점주 ID">{campaign.ownerId}</DetailItem>
          <DetailItem label="가게 ID">{campaign.storeId}</DetailItem>
          <DetailItem label="가게">
            {campaign.storeName ?? '미등록 가게'}
          </DetailItem>
          <DetailItem label="등록 시각">
            {formatDateTime(campaign.createdAt)}
          </DetailItem>
          <DetailItem label="상태 변경 시각">
            {formatDateTime(campaign.statusChangedAt)}
          </DetailItem>
          {campaign.pausedReason && (
            <DetailItem label="중단 사유">
              {pauseLabels[campaign.pausedReason]}
            </DetailItem>
          )}
        </dl>
      </section>
      <CampaignPerformance campaignId={campaign.campaignId} />
      <section className="border-t border-border-subtle pt-5">
        <h3 className="mb-3 text-heading-sm-web font-semibold">쿠폰 조건</h3>
        <dl>
          <DetailItem label="할인">{getCampaignDiscount(campaign)}</DetailItem>
          {campaign.targetMenuId !== null && (
            <DetailItem label="대상 메뉴 ID">
              {campaign.targetMenuId}
            </DetailItem>
          )}
          <DetailItem label="발급 수량">
            {formatNumber(campaign.issueQuantity)}개
          </DetailItem>
          <DetailItem label="사용 가능 시간">
            {campaign.usableStartTime.slice(0, 5)} ~{' '}
            {campaign.usableEndTime.slice(0, 5)}
          </DetailItem>
          <DetailItem label="최소 주문 금액">
            {campaign.minOrderAmount === null
              ? '없음'
              : formatWon(campaign.minOrderAmount)}
          </DetailItem>
          <DetailItem label="안내 문구">{campaign.notice ?? '없음'}</DetailItem>
        </dl>
      </section>
      <section className="border-t border-border-subtle pt-5">
        <h3 className="mb-3 text-heading-sm-web font-semibold">집행 설정</h3>
        <dl>
          <DetailItem label="하루 예산">
            {campaign.dailyBudget === null
              ? '미설정'
              : formatPoints(campaign.dailyBudget)}
          </DetailItem>
          <DetailItem label="집행 기간">
            {getCampaignPeriod(campaign)}
          </DetailItem>
          <DetailItem label="노출 반경">
            {formatNumber(campaign.targetRadius)}m
          </DetailItem>
          <DetailItem label="대상 성별">
            {genderLabels[campaign.targetGender]}
          </DetailItem>
          <DetailItem label="대상 연령">
            {campaign.targetAgeGroups.map((age) => ageLabels[age]).join(', ') ||
              '전체'}
          </DetailItem>
        </dl>
      </section>
      <section className="border-t border-border-subtle pt-5">
        <h3 className="mb-3 text-heading-sm-web font-semibold">
          상태 변경 이력
        </h3>
        {campaign.statusLogs.length === 0 ? (
          <p className="text-body-sm-web text-text-secondary">
            상태 변경 이력이 없습니다.
          </p>
        ) : (
          <ol className="space-y-3">
            {campaign.statusLogs.map((log, index) => (
              <li
                key={`${log.changedAt}-${index}`}
                className="rounded-md border border-border-subtle p-3 text-body-sm-web"
              >
                <p className="font-medium">
                  {campaignStatusMeta[log.fromStatus].label} →{' '}
                  {campaignStatusMeta[log.toStatus].label}
                </p>
                <p className="mt-1 text-text-secondary">
                  {formatDateTime(log.changedAt)} · {actorLabels[log.actorType]}
                </p>
                {log.reason && (
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {log.reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="border-t border-border-subtle pt-5">
        <h3 className="mb-3 text-heading-sm-web font-semibold">포스터</h3>
        {campaign.poster ? (
          <>
            <dl>
              <DetailItem label="제목">{campaign.poster.title}</DetailItem>
              <DetailItem label="포스터 ID">
                {campaign.poster.posterId}
              </DetailItem>
              <DetailItem label="템플릿 ID">
                {campaign.poster.templateId}
              </DetailItem>
            </dl>
            {/* 서버 HTML은 부모 문서에 삽입하지 않고 스크립트·폼 실행이 차단된 iframe에서 표시한다. */}
            <iframe
              title="캠페인 포스터 미리보기"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={campaign.poster.html}
              className="mt-3 aspect-[210/297] w-full rounded-md border border-border-subtle bg-white"
            />
          </>
        ) : (
          <p className="text-body-sm-web text-text-secondary">
            등록된 포스터가 없습니다.
          </p>
        )}
      </section>
    </div>
  );
};
