import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { type CouponSummary, fetchCouponSummary } from '@user/api/coupon';
import type { MyProfile } from '@user/api/member';
import mascotDefault from '@user/assets/illustrations/mascot-default.webp';
import moneyImage from '@user/assets/illustrations/money.webp';
import { useAuth } from '@user/auth/useAuth';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import { cardClassName } from '@user/ui/Card/Card';

import NicknameSheet from './NicknameSheet';
import { type Loaded, useLoad } from './useLoad';

const formatJoinedDate = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} 가입`;
};

// 불러오지 못한 자리에 두는 안내와 다시 시도 버튼
const LoadError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex items-center justify-between gap-3">
    <p className="text-body-sm-mobile text-text-secondary">{message}</p>
    <button
      className="h-9 shrink-0 rounded-lg border border-border-subtle bg-bg-surface px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onRetry}
      type="button"
    >
      다시 시도
    </button>
  </div>
);

const ProfileRow = ({
  onEdit,
  profile,
}: {
  onEdit: () => void;
  profile: MyProfile;
}) => (
  <div className="flex items-center gap-3">
    {profile.profileImageUrl ? (
      <img
        alt=""
        className="size-11 shrink-0 rounded-full bg-bg-surface object-cover"
        height={44}
        src={profile.profileImageUrl}
        width={44}
      />
    ) : (
      // 카카오 사진이 없으면 회색 사람 아이콘 대신 마스코트를 둔다
      <div
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle"
      >
        <img
          alt=""
          className="size-8 object-contain"
          height={32}
          src={mascotDefault}
          width={32}
        />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-body-mobile font-bold text-text-primary">
        {profile.nickname}
      </p>
      <p className="text-caption-mobile text-text-secondary">
        카카오 계정 · {formatJoinedDate(profile.createdAt)}
      </p>
    </div>
    {/* 프로필 사진은 카카오에서 가져와서 바꿀 수 없고, 닉네임만 바꾼다 */}
    <button
      aria-label="닉네임 바꾸기"
      className="-mr-1 flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-caption-mobile font-medium text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onEdit}
      type="button"
    >
      <Pencil aria-hidden="true" className="size-3.5" />
      수정
    </button>
  </div>
);

// 쿠폰을 써서 아낀 금액. 서비스를 쓰는 이유(점심값을 아낌)가 바로 보이게 금액을 가장 크게 둔다
// 서버는 누적 값만 주어 "이번 달"이 아니라 "지금까지"로 쓴다
// 그림을 글 왼쪽에 붙여 위 프로필 줄(사진 + 이름)과 같은 모양으로 맞춘다. 오른쪽 끝에 두면 가운데가 크게 빈다
const CouponStats = ({ coupons }: { coupons: CouponSummary }) => (
  <div className="flex items-center gap-3">
    {/* 위 프로필 사진과 같은 44px로 두어 두 줄의 글이 같은 자리에서 시작하게 한다 */}
    <img
      alt=""
      className="size-11 shrink-0 object-contain"
      height={44}
      src={moneyImage}
      width={44}
    />
    <div className="min-w-0 flex-1">
      <h2 className="text-caption-mobile text-text-secondary">
        지금까지 아낀 금액
      </h2>
      <p className="mt-0.5 text-h2-mobile font-bold text-text-brand tabular-nums">
        {coupons.totalDiscountAmount > 0
          ? `${coupons.totalDiscountAmount.toLocaleString('ko-KR')}원`
          : '아직 0원'}
      </p>
    </div>
    {/* 받은·사용한 쿠폰 수는 오른쪽에 두어, 왼쪽 금액과 나란히 카드 폭을 고르게 채운다 */}
    <dl className="flex shrink-0 flex-col items-end gap-1 text-caption-mobile">
      {[
        { label: '받은 쿠폰', value: `${coupons.receivedCouponCount}장` },
        { label: '사용한 쿠폰', value: `${coupons.usedCouponCount}장` },
      ].map(({ label, value }) => (
        <div className="flex gap-1.5" key={label}>
          <dt className="text-text-secondary">{label}</dt>
          <dd className="font-bold text-text-primary tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

// 마이 탭 위쪽의 프로필과 아낀 금액
// 프로필(나는 누구인지)과 아낀 금액(내 기록)은 성격이 달라 나눈다. 프로필은 상자 없이 맨 위에 두고,
// 이 화면의 주인공인 아낀 금액만 카드에 담아 눈에 들어오게 한다 (상자는 금액 카드와 아래 메뉴 두 개뿐)
// 바탕까지 주황이면 쿠폰함 배너들과 겹쳐 주황이 많아 보여서, 흰 카드에 두고 주황은 금액 숫자에만 남긴다
// 두 API를 따로 받아서, 하나가 실패해도 받은 쪽은 보여주고 실패한 쪽만 다시 시도하게 한다
// 내 정보는 아래 설정에서도 쓰여서 마이 탭이 한 번 불러와 넘겨준다
const ProfileSummary = ({ profile }: { profile: Loaded<MyProfile> }) => {
  const coupons = useLoad(fetchCouponSummary);
  const showProfileSkeleton = useDelayedLoading(profile.data === undefined);
  const showCouponsSkeleton = useDelayedLoading(coupons.data === undefined);
  const auth = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // 바꾼 닉네임은 화면의 내 정보와 저장해 둔 로그인 정보에 함께 반영한다
  const handleNicknameSaved = (updated: MyProfile) => {
    profile.setData(updated);
    if (auth.user) auth.login({ ...auth.user, nickname: updated.nickname });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 프로필 줄 높이(사진 44px)를 처음부터 잡아 두어, 응답이 와서 채워져도 아래 카드와 메뉴가 들썩이지 않게 한다 */}
      <div className="min-h-13 px-1 py-1">
        {/* 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다 */}
        {showProfileSkeleton && (
          <div
            aria-hidden="true"
            className="h-11 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
          />
        )}
        {profile.data === null && (
          <LoadError
            message="내 정보를 불러오지 못했어요"
            onRetry={profile.retry}
          />
        )}
        {profile.data && (
          <ProfileRow
            onEdit={() => setIsEditing(true)}
            profile={profile.data}
          />
        )}
      </div>
      {profile.data && isEditing && (
        <NicknameSheet
          nickname={profile.data.nickname}
          onClose={() => setIsEditing(false)}
          onSaved={handleNicknameSaved}
        />
      )}

      {/* 금액 줄 높이(카드 78px)를 처음부터 잡아 두어, 응답이 와서 내용이 채워져도 아래 메뉴가 밀리지 않게 한다 */}
      <section className={`min-h-19.5 p-4 ${cardClassName}`}>
        {showCouponsSkeleton && (
          <div
            aria-hidden="true"
            className="h-11 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
          />
        )}
        {coupons.data === null && (
          <LoadError
            message="쿠폰 요약을 불러오지 못했어요"
            onRetry={coupons.retry}
          />
        )}
        {coupons.data && <CouponStats coupons={coupons.data} />}
      </section>
    </div>
  );
};

export default ProfileSummary;
