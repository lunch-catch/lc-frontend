import { type ReactNode, useState } from 'react';

import {
  type AgeGroup,
  type Consents,
  type Gender,
  OnboardingContext,
} from './onboardingContext';

// 약관 동의부터 맞춤 정보 입력까지 온보딩 단계 사이에서 입력값을 유지한다
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [consents, setConsents] = useState<Consents>({
    terms: false,
    privacy: false,
    location: false,
    marketing: false,
  });
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);

  return (
    <OnboardingContext
      value={{
        ageGroup,
        consents,
        gender,
        setAgeGroup,
        setConsents,
        setGender,
      }}
    >
      {children}
    </OnboardingContext>
  );
};
