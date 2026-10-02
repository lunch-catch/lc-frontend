import { useEffect, useState } from 'react';

import { fetchIssueStatus, type IssueStatusResponse } from '@user/api/coupon';
import { fetchWishlist, type WishItem } from '@user/api/wishlist';

import WishCard from './WishCard';
import WishlistEmpty from './WishlistEmpty';
import WishlistSkeleton from './WishlistSkeleton';
import WishlistSummary from './WishlistSummary';
import { getWishState } from './wishState';

const WishlistScreen = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [issueStatus, setIssueStatus] = useState<IssueStatusResponse | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    // 찜 목록을 먼저 받고, 그 캠페인 ID로 쿠폰 발급 상태를 받아 합친다
    fetchWishlist().then(async (items) => {
      const status = await fetchIssueStatus(
        items.map((item) => item.campaignId),
      );
      if (ignore) return;

      setWishes(items);
      setIssueStatus(status);
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  // 11:00 오픈 전후는 다음 단계에서 시간으로 판단한다
  // 그전까지 주소에 ?mockBeforeOpen을 붙이면 오픈 전 화면을 확인할 수 있다
  const isOpen = !new URLSearchParams(window.location.search).has(
    'mockBeforeOpen',
  );

  if (issueStatus && wishes.length === 0) {
    return <WishlistEmpty />;
  }

  return (
    <div className="flex flex-col gap-4 px-page pt-4 pb-6">
      {/* 요청 두 번이 차례로 끝나야 그릴 수 있어, 그동안 빈 화면 대신 회색 틀을 보여준다 */}
      {!issueStatus && (
        <>
          <WishlistSkeleton />
          <p className="sr-only" role="status">
            찜 목록을 불러오는 중이에요
          </p>
        </>
      )}
      {issueStatus && (
        <>
          <WishlistSummary
            dailyLimit={issueStatus.dailyLimit}
            dailyRemaining={issueStatus.dailyRemaining}
            title={
              issueStatus.dailyRemaining > 0
                ? '선착순 발급이 열렸어요'
                : '오늘의 발급을 모두 마쳤어요'
            }
          />
          <ul className="flex flex-col gap-4">
            {wishes.map((wish) => {
              const status = issueStatus.campaigns.find(
                (campaign) => campaign.campaignId === wish.campaignId,
              );
              if (!status) return null;

              return (
                <WishCard
                  dailyLimit={issueStatus.dailyLimit}
                  issueStatus={status}
                  key={wish.campaignId}
                  state={getWishState({
                    dailyRemaining: issueStatus.dailyRemaining,
                    isIssued: status.isIssued,
                    isOpen,
                    remainingCount: status.remainingCount,
                  })}
                  wish={wish}
                />
              );
            })}
          </ul>
          <p className="text-caption-mobile text-text-secondary">
            찜 취소는 가게 상세에서 할 수 있어요
          </p>
        </>
      )}
    </div>
  );
};

export default WishlistScreen;
