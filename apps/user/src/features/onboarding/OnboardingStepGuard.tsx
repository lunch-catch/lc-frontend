import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useOnboarding } from './useOnboarding';

type OnboardingStep = 'personalization' | 'location' | 'tutorial';

// 주소를 직접 열거나 새로고침해도 끝내지 않은 앞 단계부터 이어간다
const OnboardingStepGuard = ({
  children,
  step,
}: {
  children: ReactNode;
  step: OnboardingStep;
}) => {
  const { ageGroup, consents, gender, locationCompleted } = useOnboarding();
  const hasRequiredConsents = consents.terms && consents.privacy;
  const hasPersonalization = gender !== null && ageGroup !== null;

  if (!hasRequiredConsents) {
    return <Navigate replace to="/onboarding/consent" />;
  }
  if (step !== 'personalization' && !hasPersonalization) {
    return <Navigate replace to="/onboarding/personalization" />;
  }
  if (step === 'tutorial' && !locationCompleted) {
    return <Navigate replace to="/onboarding/location" />;
  }

  return children;
};

export default OnboardingStepGuard;
