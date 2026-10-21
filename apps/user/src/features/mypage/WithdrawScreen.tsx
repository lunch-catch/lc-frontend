import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Checkbox, ChoiceChip } from '@repo/ui';

import { startKakaoWithdrawAuth } from '@user/auth/kakaoLogin';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import Card from '@user/ui/Card/Card';
import FixedBottom from '@user/ui/FixedBottom/FixedBottom';
import TopBar from '@user/ui/TopBar/TopBar';

// 탈퇴하면 달라지는 것 (회원 API 명세의 탈퇴 시 데이터 처리)
const notices = [
  '받은 쿠폰은 모두 사라지고 다시 받을 수 없어요',
  '닉네임, 프로필 사진, 저장한 위치가 삭제돼요',
  '같은 카카오 계정으로 다시 가입할 수 있지만, 처음부터 다시 설정해야 해요',
];

// 탈퇴 사유. 서버는 저장하지 않고 처리 뒤 버린다
const reasons = [
  '자주 쓰지 않아요',
  '주변에 쓸 만한 가게가 없어요',
  '쿠폰 혜택이 아쉬워요',
  '알림이 너무 많아요',
  '기타',
];

// 회원 탈퇴 안내. 안내를 확인하면 카카오 계정을 다시 확인하고, 돌아오면 바로 탈퇴한다 (KakaoCallbackStep)
// 카카오 재로그인이 마지막 확인이라 돌아온 뒤 다시 묻지 않는다
const WithdrawScreen = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleWithdraw = async () => {
    if (!hasConfirmed || isStarting) return;

    setIsStarting(true);
    setHasError(false);
    try {
      // 성공하면 카카오 화면으로 떠나서 이 화면으로 돌아오지 않는다
      await startKakaoWithdrawAuth(reason ?? undefined);
    } catch {
      setHasError(true);
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar onBack={() => navigate(-1)} title="회원 탈퇴" />
      <div className="flex flex-col gap-6 px-page pt-4">
        <section aria-labelledby="withdraw-notice-title">
          <h2
            className="text-h2-mobile leading-snug font-bold text-text-primary"
            id="withdraw-notice-title"
          >
            탈퇴하기 전에 확인해 주세요
          </h2>
          <Card as="ul" className="mt-4 flex flex-col gap-3 p-4">
            {notices.map((notice) => (
              <li
                className="flex gap-2 text-body-sm-mobile break-keep text-text-primary"
                key={notice}
              >
                <span aria-hidden="true" className="text-text-tertiary">
                  ·
                </span>
                {notice}
              </li>
            ))}
          </Card>
        </section>

        <fieldset>
          <legend className="mb-3 text-body-sm-mobile font-bold text-text-primary">
            떠나는 이유를 알려 주세요 · 선택
          </legend>
          <div className="flex flex-wrap gap-2">
            {reasons.map((option) => (
              // 다시 누르면 고른 것을 풀 수 있게 checkbox로 두고 하나만 고르게 한다
              <ChoiceChip
                checked={reason === option}
                key={option}
                name="withdraw-reason"
                onChange={() =>
                  setReason((current) => (current === option ? null : option))
                }
                type="checkbox"
                value={option}
              >
                {option}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>

        {/* 공통 Checkbox는 글자가 16px라 안내 문구(14px)보다 커서, 상자만 쓰고 문구는 따로 둔다 */}
        <div className="flex items-center gap-2">
          <Checkbox
            aria-labelledby="withdraw-confirm-label"
            checked={hasConfirmed}
            className="cursor-pointer"
            id="withdraw-confirm"
            label=""
            onChange={(event) => setHasConfirmed(event.target.checked)}
            size="md"
          />
          <label
            className="cursor-pointer text-body-sm-mobile font-medium text-text-primary"
            htmlFor="withdraw-confirm"
            id="withdraw-confirm-label"
          >
            안내를 모두 확인했어요
          </label>
        </div>
      </div>

      <FixedBottom>
        {hasError && (
          <p
            className="mb-2 text-center text-body-sm-mobile text-status-danger-fg"
            role="alert"
          >
            카카오 계정 확인을 시작하지 못했어요 · 다시 눌러 주세요
          </p>
        )}
        <ActionButton
          disabled={!hasConfirmed}
          loading={isStarting}
          onClick={handleWithdraw}
          size="large"
        >
          카카오 계정 확인 후 탈퇴
        </ActionButton>
      </FixedBottom>
    </div>
  );
};

export default WithdrawScreen;
