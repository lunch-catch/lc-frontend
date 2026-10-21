import { ApiError, requestData } from './client';
import { isCount, isId, isRecord } from './listResponse';

const maxCampaignsPerRequest = 100;

export interface CampaignReport {
  campaignId: number;
  spentAmount: number;
  validImpressionCount: number;
  todayStatus: 'IN_PROGRESS';
}

/** 기간을 생략해 전일까지 집계된 전체 실적을 조회한다. */
export const getCampaignReports = async (
  campaignIds: readonly number[],
  signal: AbortSignal,
): Promise<CampaignReport[]> => {
  if (!campaignIds.every(isId))
    throw new ApiError('캠페인 ID는 양의 정수여야 합니다.', 400);
  const ids = [...new Set(campaignIds)];
  const batches: number[][] = [];
  // 더 불러오기로 목록이 늘어나도 서버의 요청당 100개 제한을 넘지 않는다.
  for (let index = 0; index < ids.length; index += maxCampaignsPerRequest)
    batches.push(ids.slice(index, index + maxCampaignsPerRequest));
  const pages = await Promise.all(
    batches.map(async (batch) => {
      const params = new URLSearchParams({ campaignIds: batch.join(',') });
      const data = await requestData<unknown>(
        `/v1/admin/campaign-reports?${params}`,
        { signal },
        200,
      );
      // 배열 위치 대신 ID로 대조해 응답 순서와 무관하게 누락·중복·다른 캠페인을 거부한다.
      const expected = new Set(batch);
      if (
        !isRecord(data) ||
        !Array.isArray(data.items) ||
        data.items.length !== batch.length ||
        !data.items.every(
          (item): item is CampaignReport =>
            isRecord(item) &&
            isId(item.campaignId) &&
            expected.delete(item.campaignId) &&
            isCount(item.spentAmount) &&
            isCount(item.validImpressionCount) &&
            item.todayStatus === 'IN_PROGRESS',
        )
      )
        throw new ApiError('캠페인 실적 응답 형식을 확인할 수 없습니다.', 200);
      return data.items;
    }),
  );
  return pages.flat();
};
