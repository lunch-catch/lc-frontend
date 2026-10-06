import type { FraudReport } from '@admin/features/fraud/fraudTypes';

// 요청 제한은 피드 요청 단위이므로 캠페인에 중복 귀속하지 않고 사용자별로 제공한다.
export const mockFraudReport: FraudReport = {
  impressions: Array.from({ length: 72 }, (_, index) => {
    const campaignNumber = (index % 8) + 1;
    const day = Math.floor(index / 24) + 1;
    const userNumber =
      campaignNumber === 1 ? (Math.floor(index / 8) % 2) + 1 : (index % 24) + 1;
    // 집중 노출, 정확히 20%, 20% 초과 사례를 각각 1·2·3번 캠페인으로 제공한다.
    const validCount =
      campaignNumber === 2
        ? 80
        : campaignNumber === 3
          ? 15
          : 30 + (index % 5) * 10;
    return {
      date: `2026-10-${String(day).padStart(2, '0')}`,
      campaignId: `CMP-${String(campaignNumber).padStart(4, '0')}`,
      userId: `MEM-${String(userNumber).padStart(4, '0')}`,
      validCount,
      expiredOrUnknownCount: campaignNumber === 2 ? 15 : index % 11,
      notOwnerCount: campaignNumber === 2 ? 5 : index % 7,
      // 집중 노출 판정 기준은 서버 합의 전까지 수치로 추정하지 않고 응답 신호를 사용한다.
      concentrated: campaignNumber === 1,
    };
  }),
  feedRejections: Array.from({ length: 48 }, (_, index) => ({
    date: `2026-10-${String(Math.floor(index / 24) + 1).padStart(2, '0')}`,
    userId: `MEM-${String((index % 24) + 1).padStart(4, '0')}`,
    count: (index % 9) * 3,
  })),
};

// 서버를 호출하지 않으며 화면에서 값을 바꿔도 원본 목업이 변하지 않도록 복사한다.
export const getMockFraudReport = async (): Promise<FraudReport> => ({
  impressions: mockFraudReport.impressions.map((row) => ({ ...row })),
  feedRejections: mockFraudReport.feedRejections.map((row) => ({ ...row })),
});
