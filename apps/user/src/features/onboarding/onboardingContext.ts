import { createContext } from 'react';

import type { ConsentKey } from '@user/api/terms';

export type { ConsentKey };
export type Gender = 'male' | 'female' | 'other';
export type AgeGroup = '20s' | '30s' | '40s' | '50s+';

export type Consents = Record<ConsentKey, boolean>;

export interface OnboardingContextValue {
  consents: Consents;
  setConsents: (consents: Consents) => void;
  gender: Gender | null;
  setGender: (gender: Gender) => void;
  ageGroup: AgeGroup | null;
  setAgeGroup: (ageGroup: AgeGroup) => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);
