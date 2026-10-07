import { useContext } from 'react';

import { OnboardingContext } from './onboardingContext';

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      'useOnboarding은 OnboardingProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
};
