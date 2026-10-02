import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import {
  fetchIssueStatus,
  issueCoupon,
  type IssueResult,
  type IssueStatusResponse,
} from '@user/api/coupon';
import { fetchWishlist, type WishItem } from '@user/api/wishlist';
import FeedbackToast from '@user/components/FeedbackToast/FeedbackToast';

import WishCard from './WishCard';
import WishlistEmpty from './WishlistEmpty';
import WishlistSkeleton from './WishlistSkeleton';
import WishlistSummary from './WishlistSummary';
import { getWishState } from './wishState';

const TOAST_DURATION_MS = 2500;

const ISSUE_FAIL_MESSAGES: Record<Exclude<IssueResult, 'issued'>, string> = {
  soldOut: '아쉽게도 그사이 수량이 모두 소진됐어요',
  limitReached: '오늘 받을 수 있는 쿠폰을 모두 받았어요',
};

const WishlistScreen = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [issueStatus, setIssueStatus] = useState<IssueStatusResponse | null>(
    null,
  );
  // 쿠폰을 받는 중인 캠페인. 한 번에 하나씩만 받는다
  const [issuingCampaignId, setIssuingCampaignId] = useState<string | null>(
    null,
  );
  // 이 화면에서 쿠폰을 받았는지. 받았으면 맨 위 제목으로 알려준다
  const [hasIssued, setHasIssued] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleIssue = async (campaignId: string) => {
    if (issuingCampaignId) return;

    setIssuingCampaignId(campaignId);

    try {
      const result = await issueCoupon(campaignId);
      // 성공이든 실패든 잔여 수량과 남은 횟수가 바뀌었을 수 있어 발급 상태를 다시 받는다
      const status = await fetchIssueStatus(
        wishes.map((wish) => wish.campaignId),
      );
      setIssueStatus(status);

      if (result === 'issued') {
        setHasIssued(true);
      } else {
        setToastMessage(ISSUE_FAIL_MESSAGES[result]);
      }
    } catch {
      setToastMessage('쿠폰 발급에 실패했어요');
    } finally {
      setIssuingCampaignId(null);
    }
  };

  // 11:00 오픈 전후는 다음 단계에서 시간으로 판단한다
  // 그전까지 주소에 ?mockBeforeOpen을 붙이면 오픈 전 화면을 확인할 수 있다
  const isOpen = !new URLSearchParams(window.location.search).has(
    'mockBeforeOpen',
  );

  if (issueStatus && wishes.length === 0) {
    return <WishlistEmpty />;
  }

  const getSummaryTitle = (dailyRemaining: number) => {
    if (hasIssued) {
      return (
        <>
          <Check
            aria-hidden="true"
            className="size-5 shrink-0 text-status-success-fg"
            strokeWidth={3}
          />
          쿠폰을 받았어요
        </>
      );
    }
    if (dailyRemaining === 0) return '오늘의 발급을 모두 마쳤어요';
    return '선착순 발급이 열렸어요';
  };

  return (
    // 토스트를 탭 바로 아래에 띄우기 위한 기준 영역
    <div className="relative flex flex-col gap-4 px-page pt-4 pb-6">
      {toastMessage && (
        <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
          <FeedbackToast message={toastMessage} tone="error" />
        </div>
      )}
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
            title={getSummaryTitle(issueStatus.dailyRemaining)}
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
                  isIssueBlocked={issuingCampaignId !== null}
                  isIssuing={issuingCampaignId === wish.campaignId}
                  issueStatus={status}
                  key={wish.campaignId}
                  onIssue={() => handleIssue(wish.campaignId)}
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
