import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

import { type CouponSummary, fetchCouponSummary } from '@user/api/coupon';
import { fetchMyProfile, type MyProfile } from '@user/api/member';

interface Summary {
  profile: MyProfile;
  coupons: CouponSummary;
}

const formatJoinedDate = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} 가입`;
};

// 마이 탭 위쪽의 프로필과 쿠폰 요약. 두 API를 함께 받아 한 번에 그린다
const ProfileSummary = () => {
  // undefined: 불러오는 중, null: 실패
  const [summary, setSummary] = useState<Summary | null | undefined>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([fetchMyProfile(), fetchCouponSummary()])
      .then(([profile, coupons]) => {
        if (!ignore) setSummary({ profile, coupons });
      })
      .catch(() => {
        if (!ignore) setSummary(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setSummary(undefined);
    setAttempt((current) => current + 1);
  };

  if (summary === undefined) {
    return (
      <div
        aria-hidden="true"
        className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none"
      >
        <div className="h-22 rounded-xl bg-surface-subtle" />
        <div className="h-20 rounded-xl bg-surface-subtle/60" />
      </div>
    );
  }

  if (summary === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center">
        <p className="text-body-sm-mobile text-text-secondary">
          내 정보를 불러오지 못했어요
        </p>
        <button
          className="h-10 rounded-lg border border-border-subtle px-4 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={retry}
          type="button"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { coupons, profile } = summary;
  const stats = [
    { label: '받은 쿠폰', value: `${coupons.receivedCouponCount}장` },
    { label: '사용한 쿠폰', value: `${coupons.usedCouponCount}장` },
    {
      label: '절약한 금액',
      value: `${coupons.totalDiscountAmount.toLocaleString('ko-KR')}원`,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <section className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4">
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
      <dl className="grid grid-cols-3 divide-x divide-border-subtle rounded-xl border border-border-subtle bg-bg-surface py-4">
        {stats.map(({ label, value }) => (
          <div className="flex flex-col-reverse items-center gap-1" key={label}>
            <dt className="text-caption-mobile text-text-secondary">{label}</dt>
            <dd className="text-body-mobile font-bold text-text-primary tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default ProfileSummary;
