import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@repo/ui';
import { ChevronRight } from 'lucide-react';

import { type TermsItem, userTerms } from '@user/api/terms';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import { cardClassName } from '@user/ui/Card/Card';
import FixedBottom from '@user/ui/FixedBottom/FixedBottom';
import TopBar from '@user/ui/TopBar/TopBar';

import ConsentRow from './ConsentRow';
import { type ConsentKey } from './onboardingContext';
import { useOnboarding } from './useOnboarding';

const consentItems: { key: ConsentKey; label: string; required: boolean }[] = [
  { key: 'terms', label: '서비스 이용약관', required: true },
  { key: 'privacy', label: '개인정보 수집 및 이용', required: true },
  { key: 'location', label: '위치정보 수집·이용 동의', required: false },
];

const ConsentStep = () => {
  const navigate = useNavigate();
  const { consents, setConsents } = useOnboarding();
  // 내용을 펼쳐 보고 있는 약관
  const [openedTerms, setOpenedTerms] = useState<TermsItem | null>(null);

  const isAllChecked = consentItems.every((item) => consents[item.key]);
  const isRequiredChecked = consentItems
    .filter((item) => item.required)
    .every((item) => consents[item.key]);

  const handleAllChange = (checked: boolean) => {
    setConsents({
      location: checked,
      privacy: checked,
      terms: checked,
    });
  };

  return (
    <>
      <TopBar onBack={() => navigate(-1)} title="약관 동의" />
      <section className="flex flex-col gap-6 px-page py-5">
        {/* 다음 단계(맞춤 쿠폰 설정)와 같은 제목 모양으로 맞춘다 */}
        <div className="flex flex-col gap-2">
          <h2 className="text-h2-mobile leading-snug font-bold text-text-primary">
            약관에 동의해 주세요
          </h2>
          <p className="text-body-sm-mobile leading-normal text-text-secondary">
            필수 항목에 동의하면 시작할 수 있어요
          </p>
        </div>
        <div className={`flex flex-col px-4 py-2 ${cardClassName}`}>
          <ConsentRow checked={isAllChecked} onChange={handleAllChange}>
            <span className="text-body-mobile font-bold text-text-primary">
              전체 동의
            </span>
          </ConsentRow>
          <hr className="my-1 border-border-subtle" />
          {consentItems.map((item) => {
            const terms = userTerms.find((entry) => entry.key === item.key);
            return (
              <div className="flex items-center" key={item.key}>
                <div className="min-w-0 flex-1">
                  <ConsentRow
                    checked={consents[item.key]}
                    onChange={(checked) =>
                      setConsents({ ...consents, [item.key]: checked })
                    }
                  >
                    <span className="shrink-0 rounded-full bg-surface-brand px-2 py-0.5 text-caption-mobile font-bold text-text-secondary">
                      {item.required ? '필수' : '선택'}
                    </span>
                    <span className="min-w-0 flex-1 text-body-sm-mobile font-medium text-text-secondary">
                      {item.label}
                    </span>
                  </ConsentRow>
                </div>
                {terms && (
                  <button
                    aria-label={`${terms.title} 자세히 보기`}
                    className="-mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
                    onClick={() => setOpenedTerms(terms)}
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-caption-mobile text-text-secondary">
          위치정보 미동의 시 피드와 지도는 이용할 수 없어요
        </p>
      </section>
      <FixedBottom>
        <ActionButton
          disabled={!isRequiredChecked}
          onClick={() => navigate('/onboarding/personalization')}
          size="large"
        >
          동의하고 계속하기
        </ActionButton>
      </FixedBottom>
      <BottomSheet
        isOpen={openedTerms !== null}
        onClose={() => setOpenedTerms(null)}
        title={openedTerms?.title}
      >
        {/* 내용이 길어도 시트가 화면을 넘지 않도록 내용 영역만 스크롤한다 */}
        <div
          aria-label={`${openedTerms?.title ?? '약관'} 내용`}
          className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto"
          role="region"
          tabIndex={0}
        >
          <p className="text-caption-mobile text-text-secondary">
            버전 {openedTerms?.version}
          </p>
          {openedTerms?.sections.map((section) => (
            <section className="flex flex-col gap-1" key={section.heading}>
              <h3 className="text-body-sm-mobile font-bold text-text-primary">
                {section.heading}
              </h3>
              <ul className="list-disc pl-5 text-body-sm-mobile leading-relaxed text-text-secondary">
                {section.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </BottomSheet>
    </>
  );
};

export default ConsentStep;
