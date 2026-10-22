import { type ReactNode, useEffect, useState } from 'react';
import { CircleCheck, Clock, LockKeyhole, Store, X } from 'lucide-react';

import { getNow } from '@user/api/clock';
import {
  type Coupon,
  QR_TOKEN_LIFETIME_MS,
  type QrToken,
} from '@user/api/coupon';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';

import {
  formatClock,
  formatDiscount,
  formatPrice,
  formatTarget,
  formatUsableTime,
} from './couponFormat';
import { getQrState, type QrState } from './qrState';
import { useLatestCoupon } from './useLatestCoupon';
import { useQrToken } from './useQrToken';

const TICK_MS = 1000;
// 계산대에서 스캔이 잘 되도록 QR을 화면에서 가장 크게 둔다 (테두리 안쪽 크기)
const QR_SIZE = 240;
// QR 갱신 원의 반지름과 둘레
const RING_RADIUS = 15;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// 남은 시간을 00:52 모양으로 바꾼다. 마지막 1초까지 보이도록 올림한다
const formatSeconds = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 사용 시작까지 남은 시간을 01:24:32 모양으로 바꾼다
const formatHms = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return [
    Math.floor(totalSeconds / 3600),
    Math.floor((totalSeconds % 3600) / 60),
    totalSeconds % 60,
  ]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

const formatDateTime = (isoString: string) =>
  new Date(isoString).toLocaleString('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'long',
  });

// 새 QR까지 남은 시간을 원이 줄어드는 모양으로 보여준다. 글자 옆에 두어 얼마나 남았는지 한눈에 보인다
// 원 안에 숫자를 넣으면 글자가 너무 작아져서, 숫자는 원 밖 글자로 둔다
// 10초 안쪽(urgent)이면 주황으로 바꿔 곧 바뀐다는 걸 알린다
const RefreshRing = ({
  isUrgent,
  remainingMs,
}: {
  isUrgent: boolean;
  remainingMs: number;
}) => {
  const ratio = Math.min(1, Math.max(0, remainingMs / QR_TOKEN_LIFETIME_MS));

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0 -rotate-90"
      viewBox="0 0 36 36"
    >
      <circle
        className="stroke-border-subtle"
        cx="18"
        cy="18"
        fill="none"
        r={RING_RADIUS}
        strokeWidth="5"
      />
      <circle
        className={`transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none ${
          isUrgent ? 'stroke-action-primary' : 'stroke-status-success-fg'
        }`}
        cx="18"
        cy="18"
        fill="none"
        r={RING_RADIUS}
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - ratio)}
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
};

interface QrPanelProps {
  coupon: Coupon;
  state: QrState;
  token: QrToken | null;
  now: number;
  onRetry: () => void;
}

// 상태에 따라 QR이나 큰 안내를 바꿔 보여주는 영역
// 상자와 바탕색을 겹겹이 두면 정신없어서, 흰 바탕에 QR(또는 안내)만 두어 QR이 화면의 주인공이 되게 한다
const QrPanel = ({ coupon, now, onRetry, state, token }: QrPanelProps) => {
  // 토큰을 받은 순간과 화면 시계가 1초 안쪽으로 어긋날 수 있어 60초를 넘지 않게 한다
  const remainingMs = token
    ? Math.min(token.expiresAt - now, QR_TOKEN_LIFETIME_MS)
    : 0;
  const isUrgent = state === 'urgent';
  const isQrLoading = !token || state === 'refreshing';
  // QR이 빨리 오면 회색 틀이 잠깐 깜빡였다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다
  const showQrSkeleton = useDelayedLoading(isQrLoading);
  const showsQr =
    state === 'active' ||
    state === 'urgent' ||
    state === 'refreshing' ||
    state === 'offline';

  // 사용 시작 전. 언제부터 쓸 수 있는지와 남은 시간을 보여주고, 시간이 되면 QR이 저절로 열린다
  if (state === 'beforeUse') {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface-brand text-text-brand">
          <LockKeyhole aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-1 text-h3-mobile font-bold text-text-primary">
          {formatClock(coupon.usableStartTime)}부터 사용할 수 있어요
        </p>
        <p className="text-display-mobile font-bold text-text-brand tabular-nums">
          {formatHms(Date.parse(coupon.usableStartTime) - now)}
        </p>
        <p className="text-caption-mobile text-text-secondary">
          시간이 되면 QR이 자동으로 열려요
        </p>
      </div>
    );
  }

  const messageByState: Partial<
    Record<QrState, { title: string; description?: ReactNode }>
  > = {
    failed: {
      title: 'QR을 불러오지 못했어요',
      description: (
        <button
          className="h-9 rounded-lg border border-border-subtle bg-bg-surface px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onRetry}
          type="button"
        >
          다시 시도
        </button>
      ),
    },
    used: {
      title: '사용 완료!',
      description: coupon.useTime
        ? `${formatDateTime(coupon.useTime)} 사용 · 다시 사용할 수 없어요`
        : '사용한 쿠폰은 다시 사용할 수 없어요',
    },
    expired: {
      title: '사용 시간이 끝났어요',
      description: '쿠폰함에서 다른 쿠폰을 확인해 주세요',
    },
  };

  // 쓸 수 없는 상태(실패, 사용 완료, 만료)는 QR 대신 안내만 보여준다
  if (!showsQr) {
    const message = messageByState[state];
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
        {state === 'used' && (
          <CircleCheck
            aria-hidden="true"
            className="size-12 text-status-success-fg"
          />
        )}
        <p className="text-h3-mobile font-bold text-text-primary">
          {message?.title}
        </p>
        {message?.description && (
          <div className="text-caption-mobile text-text-secondary">
            {message.description}
          </div>
        )}
      </div>
    );
  }

  const getRefreshText = () => {
    if (state === 'refreshing') return '새 QR을 불러오고 있어요';
    if (state === 'offline')
      return '인터넷 연결 없음 · 연결되면 새 QR을 받아요';
    // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
    const seconds = (
      <span className="tabular-nums">{formatSeconds(remainingMs)}</span>
    );
    return isUrgent ? (
      <>{seconds} 뒤 새 QR로 바뀌어요</>
    ) : (
      <>{seconds} 뒤 새 QR</>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {/* QR이 보이면 쓸 수 있다는 뜻이라 "사용 가능" 표시는 따로 두지 않고 할 일만 말한다 */}
      {/* 가게는 직원이 눈으로 확인하지 않고 스캐너로 읽으므로, 손님이 할 일(스캐너에 화면을 대기)을 말한다 */}
      <p className="text-h3-mobile font-bold text-text-primary">
        스캐너에 QR을 비춰 주세요
      </p>
      <div className="flex size-64 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-white">
        {!isQrLoading ? (
          // 서버가 그려 준 QR 이미지. 스캐너가 경계를 찾는 여백은 이미지에 들어 있다
          <img
            alt="쿠폰 QR 코드"
            // 연결이 끊긴 동안에는 아직 쓸 수 있는 QR인지 알 수 없어 흐리게 보여준다
            // 작은 QR 칸이 번지지 않게 확대할 때 픽셀을 그대로 키운다
            className={`[image-rendering:pixelated] ${state === 'offline' ? 'opacity-30 blur-[2px]' : ''}`}
            height={QR_SIZE}
            src={token.imageSrc}
            width={QR_SIZE}
          />
        ) : (
          showQrSkeleton && (
            <div
              aria-hidden="true"
              className="size-52 animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none"
            />
          )
        )}
      </div>
      <div
        className={`flex items-center gap-2 text-caption-mobile ${isUrgent ? 'font-bold text-text-brand' : 'text-text-secondary'}`}
      >
        {!isQrLoading && (
          <RefreshRing isUrgent={isUrgent} remainingMs={remainingMs} />
        )}
        {/* 숫자와 글자를 한 덩어리로 묶어, 원과의 간격(gap)이 숫자와 글자 사이에도 끼어들지 않게 한다 */}
        <span>{getRefreshText()}</span>
      </div>
    </div>
  );
};

interface CouponQrProps {
  coupon: Coupon;
  // 넘기면 시트 오른쪽 위에 닫기(×) 버튼을 둔다
  onClose?: () => void;
}

// 가게 스캐너에 비추는 쿠폰 QR. 쿠폰함에서 시트로 띄운다
// 띄워 둔 동안 점주가 스캔하면 단건 조회로 알아채고 사용 완료로 바꾼다
const CouponQr = ({ coupon: listCoupon, onClose }: CouponQrProps) => {
  const coupon = useLatestCoupon(listCoupon);
  const [now, setNow] = useState(getNow);

  // 남은 시간과 사용 시작·만료 시각을 1초마다 다시 확인한다
  useEffect(() => {
    const timer = setInterval(() => setNow(getNow()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const canShowQr =
    coupon.state === 'ISSUED' &&
    now >= Date.parse(coupon.usableStartTime) &&
    now < Date.parse(coupon.usableEndTime);
  const { hasFailed, isOnline, retry, token } = useQrToken(
    coupon.memberCouponId,
    canShowQr,
    now,
  );
  const state = getQrState({ coupon, hasFailed, isOnline, now, token });

  return (
    <>
      {/* 공통 시트 제목 줄에는 버튼을 둘 수 없어, 시트 오른쪽 위(제목과 같은 높이)에 겹쳐 둔다 */}
      {/* 시트를 내리거나 바깥을 누르는 방법을 모르는 사람도 바로 닫을 수 있다 */}
      {onClose && (
        <button
          aria-label="닫기"
          className="absolute top-5 right-3 flex size-10 items-center justify-center rounded-full text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      )}
      {/* 작은 화면에서 시트가 화면을 넘지 않도록 내용만 스크롤한다 */}
      <div className="flex max-h-[75dvh] flex-col gap-3 overflow-y-auto">
        {/* 어떤 쿠폰인지 사진, 가게, 할인, 사용 시간을 한 줄로 두고 아래를 얇은 선으로만 나눈다 */}
        {/* 테두리 상자로 감싸면 아래 QR 칸과 상자가 겹쳐 정신없어 보인다 */}
        <section className="border-b border-border-subtle pb-3">
          <div className="flex items-center gap-3">
            {coupon.storeImageUrl ? (
              <img
                alt=""
                className="size-14 shrink-0 rounded-lg bg-surface-subtle object-cover"
                height={56}
                src={coupon.storeImageUrl}
                width={56}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
              >
                <Store className="size-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm-mobile font-bold text-text-primary">
                {coupon.storeName}
              </p>
              <p className="truncate text-caption-mobile text-text-secondary">
                {formatTarget(coupon)}
              </p>
              {/* 주황은 할인에만 남기고, 사용 시간은 회색 작은 글자로 둔다 */}
              <p className="mt-0.5 flex items-center gap-1 text-caption-mobile text-text-secondary">
                <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">
                  오늘 {formatUsableTime(coupon)} 사용
                </span>
              </p>
            </div>
            {/* 메뉴 할인은 할인 전·후 가격과 할인액을, 전 메뉴 할인은 할인액만 보여준다 */}
            {coupon.targetMenu ? (
              <p className="flex shrink-0 flex-col items-end">
                <del className="text-caption-mobile text-text-tertiary">
                  {formatPrice(coupon.targetMenu.price)}
                </del>
                <strong className="text-body-mobile font-bold text-text-primary">
                  {formatPrice(coupon.targetMenu.discountedPrice)}
                </strong>
                <span className="text-caption-mobile font-bold text-text-brand">
                  {formatDiscount(coupon)}
                </span>
              </p>
            ) : (
              <strong className="shrink-0 text-body-mobile font-bold text-text-brand">
                {formatDiscount(coupon)}
              </strong>
            )}
          </div>
        </section>
        <QrPanel
          coupon={coupon}
          now={now}
          onRetry={retry}
          state={state}
          token={token}
        />
      </div>
    </>
  );
};

export default CouponQr;
