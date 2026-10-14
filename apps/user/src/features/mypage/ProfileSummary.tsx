import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

import { type CouponSummary, fetchCouponSummary } from '@user/api/coupon';
import { fetchMyProfile, type MyProfile } from '@user/api/member';

const formatJoinedDate = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} 가입`;
};

// 요청 하나를 불러오고, 실패하면 다시 시도할 수 있게 한다
// data가 undefined면 불러오는 중, null이면 실패
const useLoad = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null | undefined>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetcher()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch(() => {
        if (!ignore) setData(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
    // fetcher는 바뀌지 않는 API 함수라 다시 시도할 때만 새로 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    setData(undefined);
    setAttempt((current) => current + 1);
  };

  return { data, retry };
};

const cardClassName = 'rounded-xl border border-border-subtle bg-bg-surface';

// 불러오지 못한 카드 자리에 두는 안내와 다시 시도 버튼
const LoadError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div
    className={`flex items-center justify-between gap-3 px-4 py-4 ${cardClassName}`}
  >
    <p className="text-body-sm-mobile text-text-secondary">{message}</p>
    <button
      className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onRetry}
      type="button"
    >
      다시 시도
    </button>
  </div>
);

const ProfileCard = ({ profile }: { profile: MyProfile }) => (
  <section className={`flex items-center gap-4 p-4 ${cardClassName}`}>
    {profile.profileImageUrl ? (
      <img
        alt=""
        className="size-14 shrink-0 rounded-full bg-surface-subtle object-cover"
        height={56}
        src={profile.profileImageUrl}
        width={56}
      />
    ) : (
      <div
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-tertiary"
      >
        <User className="size-6" />
      </div>
    )}
    <div className="min-w-0">
      <p className="truncate text-h3-mobile font-bold text-text-primary">
        {profile.nickname}
      </p>
      <p className="mt-0.5 text-caption-mobile text-text-secondary">
        카카오 계정 · {formatJoinedDate(profile.createdAt)}
      </p>
    </div>
  </section>
);

const CouponStats = ({ coupons }: { coupons: CouponSummary }) => {
  const stats = [
    { label: '받은 쿠폰', value: `${coupons.receivedCouponCount}장` },
    { label: '사용한 쿠폰', value: `${coupons.usedCouponCount}장` },
    {
      label: '절약한 금액',
      value: `${coupons.totalDiscountAmount.toLocaleString('ko-KR')}원`,
    },
  ];

  return (
    <dl
      className={`grid grid-cols-3 divide-x divide-border-subtle py-4 ${cardClassName}`}
    >
      {stats.map(({ label, value }) => (
        <div className="flex flex-col-reverse items-center gap-1" key={label}>
          <dt className="text-caption-mobile text-text-secondary">{label}</dt>
          <dd className="text-body-mobile font-bold text-text-primary tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

// 마이 탭 위쪽의 프로필과 쿠폰 요약
// 두 API를 따로 받아서, 하나가 실패해도 받은 쪽은 보여주고 실패한 쪽만 다시 시도하게 한다
const ProfileSummary = () => {
  const profile = useLoad(fetchMyProfile);
  const coupons = useLoad(fetchCouponSummary);

  return (
    <div className="flex flex-col gap-3">
      {profile.data === undefined && (
        <div
          aria-hidden="true"
          className="h-22 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
        />
      )}
      {profile.data === null && (
        <LoadError
          message="내 정보를 불러오지 못했어요"
          onRetry={profile.retry}
        />
      )}
      {profile.data && <ProfileCard profile={profile.data} />}

      {coupons.data === undefined && (
        <div
          aria-hidden="true"
          className="h-20 animate-pulse rounded-xl bg-surface-subtle/60 motion-reduce:animate-none"
        />
      )}
      {coupons.data === null && (
        <LoadError
          message="쿠폰 요약을 불러오지 못했어요"
          onRetry={coupons.retry}
        />
      )}
      {coupons.data && <CouponStats coupons={coupons.data} />}
    </div>
  );
};

export default ProfileSummary;
