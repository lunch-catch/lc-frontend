import { useNavigate } from 'react-router';
import { ChoiceChip } from '@repo/ui';

import { useAuth } from '@user/auth/useAuth';
import ActionButton from '@user/components/ActionButton/ActionButton';
import FixedBottom from '@user/components/FixedBottom/FixedBottom';
import TopBar from '@user/components/TopBar/TopBar';

import { type AgeGroup, type Gender } from './onboardingContext';
import { useOnboarding } from './useOnboarding';

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
  // 성별을 밝히고 싶지 않은 사용자를 위한 선택지. 값은 API가 정해지기 전까지 'other'로 둔다
  { value: 'other', label: '선택 안 함' },
];

const ageGroupOptions: { value: AgeGroup; label: string }[] = [
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s+', label: '50대 이상' },
];

const PersonalizationStep = () => {
  const navigate = useNavigate();
  const { ageGroup, gender, setAgeGroup, setGender } = useOnboarding();
  const { completeOnboarding } = useAuth();

  const isComplete = gender !== null && ageGroup !== null;

  return (
    <>
      <TopBar onBack={() => navigate(-1)} title="맞춤 쿠폰 설정" />
      <section className="flex flex-col gap-6 px-page py-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-h1 leading-9 font-bold text-text-primary">
            내게 맞는 점심 혜택
          </h2>
          <p className="text-body-sm-mobile leading-normal text-text-secondary">
            성별과 연령대는 맞춤 쿠폰 노출에 사용해요.
            <br />두 항목을 선택하면 계속할 수 있어요.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-body-mobile font-bold text-text-primary">
            성별 · 필수
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map((option) => (
              <ChoiceChip
                checked={gender === option.value}
                key={option.value}
                name="gender"
                onChange={() => setGender(option.value)}
                value={option.value}
              >
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-body-mobile font-bold text-text-primary">
            연령대 · 필수
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ageGroupOptions.map((option) => (
              <ChoiceChip
                checked={ageGroup === option.value}
                key={option.value}
                name="age-group"
                onChange={() => setAgeGroup(option.value)}
                value={option.value}
              >
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>

        <p className="text-caption-mobile text-text-secondary">
          선택 정보는 카카오에서 가져오지 않아요.
        </p>
      </section>
      <FixedBottom>
        <ActionButton
          disabled={!isComplete}
          // 위치 설정 화면(#14)이 생기면 그쪽으로 이동한다
          onClick={() => {
            completeOnboarding();
            navigate('/swipe', { replace: true });
          }}
          size="large"
        >
          {isComplete ? '계속하기' : '성별·연령대를 선택해 주세요'}
        </ActionButton>
      </FixedBottom>
    </>
  );
};

export default PersonalizationStep;
