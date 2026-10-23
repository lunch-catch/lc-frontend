import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { type ConsentKey, type TermsItem, userTerms } from '@user/api/terms';
import { startKakaoLogin } from '@user/auth/kakaoLogin';
import FeedbackToast from '@user/ui/FeedbackToast/FeedbackToast';
import TermsSheet from '@user/ui/TermsSheet/TermsSheet';
import Wordmark from '@user/ui/Wordmark/Wordmark';

import KakaoLoginButton from './KakaoLoginButton';
import {
  markLoginIntroSeen,
  shouldSkipLoginIntro,
  SUBTITLE_DELAY_MS,
} from './loginIntro';
import LoginMascot from './LoginMascot';
import LoginStatusScreen, { loginScreenClassName } from './LoginStatusScreen';
import TypedHeading from './TypedHeading';

type LoginStatus = 'idle' | 'loading' | 'error';

// 하단에 보여주는 약관 링크. 위치정보 약관은 가입할 때 따로 동의받으므로 여기에는 두지 않는다
const termsLinks: { key: ConsentKey; label: string }[] = [
  { key: 'terms', label: '이용약관' },
  { key: 'privacy', label: '개인정보처리방침' },
];

const WITHDRAWN_TOAST_DURATION_MS = 4000;

const LoginStep = () => {
  const [status, setStatus] = useState<LoginStatus>('idle');
  // 하단에서 눌러 내용을 펼쳐 보고 있는 약관
  const [openedTerms, setOpenedTerms] = useState<TermsItem | null>(null);
  // 처음 보는지. 한 번 정하면 화면을 보는 동안 바뀌지 않아 도중에 효과가 끊기지 않는다
  const [skipIntro] = useState(shouldSkipLoginIntro);
  const location = useLocation();
  const navigate = useNavigate();
  // 회원 탈퇴를 마치고 온 경우 (KakaoCallbackStep이 넘겨준다)
  const [showWithdrawn, setShowWithdrawn] = useState(
    () =>
      (location.state as { withdrawn?: boolean } | null)?.withdrawn === true,
  );

  useEffect(() => {
    if (!showWithdrawn) return;

    // 새로고침해도 안내가 다시 뜨지 않도록 넘겨받은 표시를 지운다
    navigate(location.pathname, { replace: true, state: null });
    const timer = setTimeout(
      () => setShowWithdrawn(false),
      WITHDRAWN_TOAST_DURATION_MS,
    );
    return () => clearTimeout(timer);
    // 처음 들어왔을 때 한 번만 처리한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWithdrawn]);

  // 카카오 화면에서 뒤로 가기로 돌아오면 브라우저가 떠날 때의 화면(로그인 중)을 그대로 되살린다
  // 그때는 처음 화면으로 되돌려 다시 누를 수 있게 한다
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setStatus('idle');
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // 성공하면 카카오 로그인 화면으로 떠나고, 돌아온 뒤의 처리는 콜백 화면(KakaoCallbackStep)이 한다
  const handleLogin = async () => {
    setStatus('loading');

    try {
      await startKakaoLogin();
    } catch {
      setStatus('error');
    }
  };

  // 버튼을 누른 뒤 카카오로 넘어가기까지는 화면을 바꾸지 않고 버튼만 로딩으로 바꾼다
  // 화면 전체를 로그인 중 화면으로 바꾸면 1초도 안 되는 사이 화면이 깜빡여 보인다
  if (status !== 'error') {
    return (
      <main className={loginScreenClassName}>
        <Wordmark />
        {/* 첫 등장 효과: 제목 타이핑 → 문구 → 마스코트 순서로 나온다. 본 적이 있거나 움직임 줄이기면 효과 없이 바로 보여준다 */}
        <TypedHeading
          className="mt-6 text-display-mobile leading-snug font-black text-text-primary"
          onDone={markLoginIntroSeen}
          skip={skipIntro}
          text={'점심 고민,\n오늘은 넘겨요'}
        />
        <p
          className={`mt-2 text-body-mobile leading-snug text-text-secondary ${skipIntro ? '' : 'animate-login-fade'}`}
          style={
            skipIntro ? undefined : { animationDelay: `${SUBTITLE_DELAY_MS}ms` }
          }
        >
          근처 맛집을 발견하고
          <br />
          오늘만의 점심 쿠폰을 받아보세요
        </p>
        {/* 버튼 위 남는 공간을 모두 쓰고 그 가운데에 일러스트를 둔다 */}
        <div className="flex flex-1 items-center justify-center py-6">
          {/* 마스코트와 뒤의 빛, 발밑 그림자, 둘레의 장식. 제목, 문구 다음에 이어서 나타난다 */}
          <LoginMascot skipIntro={skipIntro} />
        </div>
        <div className="relative flex flex-col items-center gap-4">
          {/* 탈퇴 안내는 다른 화면처럼 버튼 바로 위에 띄워 제목과 일러스트를 가리지 않게 한다 */}
          {showWithdrawn && (
            <div className="absolute inset-x-0 bottom-full z-20 pb-3">
              <FeedbackToast message="탈퇴했어요 · 그동안 이용해 주셔서 고마워요" />
            </div>
          )}
          <KakaoLoginButton
            loading={status === 'loading'}
            onClick={handleLogin}
          >
            카카오로 10초 만에 시작하기
          </KakaoLoginButton>
          {/* 약관을 누르면 가입할 때 동의받는 것과 같은 약관 내용을 아래 시트로 보여준다 */}
          <div className="-my-1 flex items-center text-caption-mobile text-text-tertiary">
            {termsLinks.map(({ key, label }, index) => (
              <Fragment key={key}>
                {index > 0 && <span aria-hidden="true">·</span>}
                <button
                  className="h-9 rounded-sm px-2 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-action-primary"
                  onClick={() =>
                    setOpenedTerms(
                      userTerms.find((terms) => terms.key === key) ?? null,
                    )
                  }
                  type="button"
                >
                  {label}
                </button>
              </Fragment>
            ))}
          </div>
          <TermsSheet
            onClose={() => setOpenedTerms(null)}
            terms={openedTerms}
          />
        </div>
      </main>
    );
  }

  return (
    <LoginStatusScreen failure="network" onRetry={handleLogin} status="error" />
  );
};

export default LoginStep;
