import { useNavigate } from 'react-router';

import ActionButton from '@user/components/ActionButton/ActionButton';
import FixedBottom from '@user/components/FixedBottom/FixedBottom';
import TopBar from '@user/components/TopBar/TopBar';

import ConsentRow from './ConsentRow';
import { type ConsentKey } from './onboardingContext';
import { useOnboarding } from './useOnboarding';

const consentItems: { key: ConsentKey; label: string; required: boolean }[] = [
  { key: 'terms', label: '서비스 이용약관', required: true },
  { key: 'privacy', label: '개인정보 수집 및 이용', required: true },
  { key: 'location', label: '위치정보 수집·이용 동의', required: false },
  { key: 'marketing', label: '광고성 알림 수신 동의', required: false },
];

const ConsentStep = () => {
  const navigate = useNavigate();
  const { consents, setConsents } = useOnboarding();

  const isAllChecked = consentItems.every((item) => consents[item.key]);
  const isRequiredChecked = consentItems
    .filter((item) => item.required)
    .every((item) => consents[item.key]);

  const handleAllChange = (checked: boolean) => {
    setConsents({
      location: checked,
      marketing: checked,
      privacy: checked,
      terms: checked,
    });
  };

  return (
    <>
      <TopBar onBack={() => navigate(-1)} title="약관 동의" />
      <section className="flex flex-col gap-5 px-page py-5">
        <h2 className="text-body-mobile font-bold text-text-primary">
          아래 항목에 동의해주세요
        </h2>
        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
          <ConsentRow checked={isAllChecked} onChange={handleAllChange}>
            <span className="text-body-mobile font-bold text-text-primary">
              전체 동의
            </span>
          </ConsentRow>
          <hr className="my-2 border-border-subtle" />
          {consentItems.map((item) => (
            <ConsentRow
              checked={consents[item.key]}
              key={item.key}
              onChange={(checked) =>
                setConsents({ ...consents, [item.key]: checked })
              }
            >
              <span className="shrink-0 rounded-full bg-surface-brand px-2 py-0.5 text-caption-mobile font-bold text-text-secondary">
                {item.required ? '필수' : '선택'}
              </span>
              <span className="min-w-0 flex-1 text-body-mobile font-medium text-text-secondary">
                {item.label}
              </span>
            </ConsentRow>
          ))}
        </div>
        <p className="text-center text-caption-mobile text-text-secondary">
          위치정보 미동의 시 피드와 지도는 이용할 수 없어요.
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
    </>
  );
};

export default ConsentStep;
