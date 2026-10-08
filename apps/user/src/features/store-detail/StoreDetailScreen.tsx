import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  Heart,
  Navigation,
  Phone,
  Share2,
  Store,
} from 'lucide-react';

import {
  type CampaignIssueStatus,
  fetchIssueStatus,
  issueCoupon,
  type IssueResult,
} from '@user/api/coupon';
import {
  BUSINESS_CATEGORY_LABELS,
  fetchCampaignPoster,
  fetchStoreDetail,
  fetchWalkingRoute,
  type StoreDetail,
  type WalkingRoute,
} from '@user/api/store';
import {
  addWish,
  fetchIsWished,
  removeWish,
  restoreWish,
} from '@user/api/wishlist';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';
import FeedbackToast, {
  type FeedbackToastProps,
} from '@user/components/FeedbackToast/FeedbackToast';
import { useOpenCountdown } from '@user/features/wishlist/useOpenCountdown';

import BusinessHoursSection from './BusinessHoursSection';
import CouponCta from './CouponCta';
import CouponSection from './CouponSection';
import { getCouponState } from './couponState';
import { getKakaoDirectionsUrl } from './kakaoMap';
import LocationSection from './LocationSection';
import StoreDetailSkeleton from './StoreDetailSkeleton';

interface StoreDetailScreenProps {
  storeId: number;
}

// 활성 캠페인이 있을 때만 받는 찜 여부와 발급 상태
interface CouponInfo {
  isWished: boolean;
  status: CampaignIssueStatus;
  dailyLimit: number;
  dailyRemaining: number;
}

const TOAST_DURATION_MS = 2500;
// 되돌리기 버튼을 누를 시간을 조금 더 준다
const ACTION_TOAST_DURATION_MS = 4000;

const ISSUE_FAIL_MESSAGES: Record<Exclude<IssueResult, 'issued'>, string> = {
  soldOut: '아쉽게도 그사이 수량이 모두 소진됐어요',
  limitReached: '오늘 받을 수 있는 쿠폰을 모두 받았어요',
};

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const loadCouponInfo = async (campaignId: string): Promise<CouponInfo> => {
  const [isWished, issueStatus] = await Promise.all([
    fetchIsWished(campaignId),
    fetchIssueStatus([campaignId]),
  ]);
  const status = issueStatus.campaigns[0];
  if (!status) throw new Error('발급 상태가 없는 캠페인');

  return {
    isWished,
    status,
    dailyLimit: issueStatus.dailyLimit,
    dailyRemaining: issueStatus.dailyRemaining,
  };
};

// 가게 상세. 탐색 목록이나 지도에서 가게를 눌러 들어온다
// 찜 목록까지 가지 않아도 여기서 바로 찜하고, 11:00 오픈 뒤에는 바로 쿠폰을 받을 수 있다
const StoreDetailScreen = ({ storeId }: StoreDetailScreenProps) => {
  const navigate = useNavigate();
  // undefined: 불러오는 중, null: 없는 가게
  const [store, setStore] = useState<StoreDetail | null | undefined>();
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [posterHtml, setPosterHtml] = useState<string | null | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<FeedbackToastProps | null>(null);
  // 11:00이 되면 새로고침하지 않아도 버튼이 받기로 바뀐다
  const { isOpen, remainingMs } = useOpenCountdown();

  useEffect(() => {
    let ignore = false;

    // 가게 정보와 쿠폰 상태를 모두 받은 뒤에 그려, 버튼이 중간에 바뀌지 않게 한다
    // 포스터는 크고 화면 아래쪽에 있어 따로 받는다
    const load = async () => {
      const [detail, walkingRoute] = await Promise.all([
        fetchStoreDetail(storeId),
        fetchWalkingRoute(storeId),
      ]);
      const campaignId = detail?.activeCampaign?.campaignId;
      const info = campaignId ? await loadCouponInfo(campaignId) : null;
      if (ignore) return;

      setStore(detail);
      setRoute(walkingRoute);
      setCouponInfo(info);

      if (campaignId) {
        const html = await fetchCampaignPoster(campaignId);
        if (!ignore) setPosterHtml(html);
      }
    };
    load();

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [storeId]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(
      () => setToast(null),
      toast.action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  // 앱 안에서 들어왔으면 이전 화면으로, 링크로 바로 열었으면 탐색으로 간다
  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1);
    } else {
      navigate('/explore', { replace: true });
    }
  };

  if (store === undefined) {
    return (
      <>
        <StoreDetailSkeleton onBack={goBack} />
        <p className="sr-only" role="status">
          가게 정보를 불러오는 중이에요
        </p>
      </>
    );
  }

  if (store === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
        <EmptyState
          description="문을 닫았거나 주소가 바뀐 가게예요"
          image={mascotEmpty}
          title="가게를 찾을 수 없어요"
        >
          <ActionButton onClick={() => navigate('/explore', { replace: true })}>
            다른 가게 둘러보기
          </ActionButton>
        </EmptyState>
      </div>
    );
  }

  const campaign = store.activeCampaign;
  const couponState =
    couponInfo &&
    getCouponState({
      dailyRemaining: couponInfo.dailyRemaining,
      isIssued: couponInfo.status.isIssued,
      isOpen,
      isWished: couponInfo.isWished,
      remainingCount: couponInfo.status.remainingCount,
    });

  const setWished = (isWished: boolean) =>
    setCouponInfo((current) => current && { ...current, isWished });

  const handleWish = async () => {
    if (!campaign || isPending) return;

    setIsPending(true);
    try {
      await addWish(campaign.campaignId);
      setWished(true);
      setToast({ message: '찜했어요. 10:50에 오픈 알림을 보내드려요' });
    } catch {
      setToast({ message: '찜하지 못했어요', tone: 'error' });
    } finally {
      setIsPending(false);
    }
  };

  const handleUndoRemove = (campaignId: string) => {
    setWished(true);
    setToast(null);
    restoreWish(campaignId);
  };

  // 응답을 기다리지 않고 바로 하트를 비워, 실수로 눌렀을 때 곧바로 되돌릴 수 있게 한다
  const handleRemoveWish = (campaignId: string) => {
    setWished(false);
    setToast({
      message: '찜을 취소했어요',
      action: {
        label: '되돌리기',
        onClick: () => handleUndoRemove(campaignId),
      },
    });

    removeWish(campaignId).catch(() => {
      setWished(true);
      setToast({ message: '찜을 취소하지 못했어요', tone: 'error' });
    });
  };

  const handleIssue = async () => {
    if (!campaign || !couponInfo || isPending) return;

    setIsPending(true);
    try {
      // 쿠폰은 찜한 캠페인만 받을 수 있어, 찜하지 않았으면 먼저 찜한다
      if (!couponInfo.isWished) {
        await addWish(campaign.campaignId);
        setWished(true);
      }
      const result = await issueCoupon(campaign.campaignId);
      // 성공이든 실패든 잔여 수량과 남은 횟수가 바뀌었을 수 있어 발급 상태를 다시 받는다
      setCouponInfo(await loadCouponInfo(campaign.campaignId));

      setToast(
        result === 'issued'
          ? { message: '쿠폰을 받았어요. 쿠폰함에서 확인하세요' }
          : { message: ISSUE_FAIL_MESSAGES[result], tone: 'error' },
      );
    } catch {
      setToast({ message: '쿠폰 발급에 실패했어요', tone: 'error' });
    } finally {
      setIsPending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      // 공유 창을 닫아도 오류가 나므로 따로 알리지 않는다
      await navigator.share({ title: store.name, url }).catch(() => {});
      return;
    }
    copyText(url, '링크를 복사했어요');
  };

  const copyText = (text: string, message: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setToast({ message }))
      .catch(() => setToast({ message: '복사하지 못했어요', tone: 'error' }));
  };

  const meta = [
    route &&
      `도보 ${Math.max(1, Math.round(route.totalDurationSeconds / 60))}분`,
    route && `${route.totalDistanceMeters.toLocaleString('ko-KR')}m`,
  ]
    .filter(Boolean)
    .join(' · ');

  // 받은 쿠폰은 쿠폰함에서 관리하므로 받은 뒤에는 찜을 취소할 수 없다
  const canToggleWish = couponInfo && couponState !== 'issued' && !isPending;

  return (
    // 하단 고정 버튼에 내용이 가려지지 않도록 비워둔다
    <div
      className={`mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page ${
        couponState ? 'pb-[calc(124px+env(safe-area-inset-bottom))]' : 'pb-10'
      }`}
    >
      {toast && (
        // 사진 위 버튼을 가리지 않도록 하단 버튼 바로 위에 띄운다
        <div
          className={`fixed inset-x-0 z-30 mx-auto max-w-mobile px-page ${
            couponState
              ? 'bottom-[calc(132px+env(safe-area-inset-bottom))]'
              : 'bottom-[max(16px,env(safe-area-inset-bottom))]'
          }`}
        >
          <FeedbackToast {...toast} />
        </div>
      )}
      <div className="relative h-60 bg-surface-subtle">
        {store.imageUrl ? (
          <img
            alt=""
            className="size-full object-cover"
            height={240}
            src={store.imageUrl}
            width={390}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center text-text-tertiary"
          >
            <Store className="size-12" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex justify-between px-3 pt-[max(12px,env(safe-area-inset-top))]">
          <HeroButton label="뒤로 가기" onClick={goBack}>
            <ChevronLeft aria-hidden="true" className="size-6" />
          </HeroButton>
          {campaign && couponInfo && (
            <HeroButton
              disabled={!canToggleWish}
              label={couponInfo.isWished ? '찜 취소' : '찜하기'}
              onClick={() =>
                couponInfo.isWished
                  ? handleRemoveWish(campaign.campaignId)
                  : handleWish()
              }
              pressed={couponInfo.isWished}
            >
              <Heart
                aria-hidden="true"
                className={`size-5 ${
                  couponInfo.isWished
                    ? 'fill-action-primary text-action-primary'
                    : ''
                }`}
              />
            </HeroButton>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 px-page pt-5">
        <section>
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-h2-mobile font-bold text-text-primary">
              {store.name}
            </h1>
            <span className="shrink-0 rounded-sm bg-surface-subtle px-1.5 py-0.5 text-caption-mobile text-text-secondary">
              {BUSINESS_CATEGORY_LABELS[store.businessCategory]}
            </span>
          </div>
          {meta && (
            <p className="mt-1 text-body-sm-mobile text-text-secondary">
              {meta}
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 rounded-xl border border-border-subtle bg-bg-surface py-2">
            <QuickAction href={`tel:${store.phone}`} label="전화">
              <Phone aria-hidden="true" className="size-5" />
            </QuickAction>
            <QuickAction
              href={getKakaoDirectionsUrl(store)}
              label="길찾기"
              newTab
            >
              <Navigation aria-hidden="true" className="size-5" />
            </QuickAction>
            <QuickAction label="공유" onClick={handleShare}>
              <Share2 aria-hidden="true" className="size-5" />
            </QuickAction>
          </div>
        </section>

        {campaign && couponInfo && couponState ? (
          <CouponSection
            campaign={campaign}
            dailyLimit={couponInfo.dailyLimit}
            posterHtml={posterHtml}
            remainingCount={couponInfo.status.remainingCount}
            state={couponState}
            storeName={store.name}
          />
        ) : (
          <p className="rounded-xl bg-surface-subtle px-4 py-3 text-body-sm-mobile text-text-secondary">
            지금 진행 중인 쿠폰이 없어요
          </p>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-h3-mobile font-bold text-text-primary">
            대표 메뉴
          </h2>
          <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-surface px-4">
            {store.menus.map((menu) => (
              <li
                className="flex items-center justify-between gap-3 py-3 text-body-mobile"
                key={menu.menuId}
              >
                <span className="min-w-0 truncate text-text-primary">
                  {menu.name}
                </span>
                <span className="shrink-0 font-bold text-text-primary">
                  {formatPrice(menu.price)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <BusinessHoursSection hours={store.businessHours} />

        <LocationSection
          onCopyAddress={() => copyText(store.roadAddress, '주소를 복사했어요')}
          store={store}
        />
      </div>

      {couponInfo && couponState && (
        <CouponCta
          dailyLimit={couponInfo.dailyLimit}
          isPending={isPending}
          isWished={couponInfo.isWished}
          onIssue={handleIssue}
          onWish={handleWish}
          remainingMs={remainingMs}
          state={couponState}
        />
      )}
    </div>
  );
};

interface HeroButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
  disabled?: boolean;
}

// 사진 위에 올리는 버튼. 사진 색과 상관없이 보이도록 어두운 반투명 원에 둔다
const HeroButton = ({
  children,
  disabled,
  label,
  onClick,
  pressed,
}: HeroButtonProps) => (
  <button
    aria-label={label}
    aria-pressed={pressed}
    className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:opacity-60"
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

interface QuickActionProps {
  label: string;
  children: ReactNode;
  href?: string;
  // 지도처럼 다른 사이트로 가는 링크는 새 탭으로 연다
  newTab?: boolean;
  onClick?: () => void;
}

const quickActionClassName =
  'flex flex-col items-center gap-1 rounded-lg py-1.5 text-caption-mobile font-medium text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary';

const QuickAction = ({
  children,
  href,
  label,
  newTab,
  onClick,
}: QuickActionProps) =>
  href ? (
    <a
      className={quickActionClassName}
      href={href}
      rel={newTab ? 'noreferrer' : undefined}
      target={newTab ? '_blank' : undefined}
    >
      {children}
      {label}
    </a>
  ) : (
    <button className={quickActionClassName} onClick={onClick} type="button">
      {children}
      {label}
    </button>
  );

export default StoreDetailScreen;
