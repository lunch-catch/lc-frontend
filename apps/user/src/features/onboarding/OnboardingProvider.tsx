import { type ReactNode, useEffect, useState } from 'react';

import { useAuth } from '@user/auth/useAuth';

import {
  type AgeGroup,
  type Consents,
  type Gender,
  OnboardingContext,
} from './onboardingContext';

interface OnboardingDraft {
  memberId: string;
  consents: Consents;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  locationCompleted: boolean;
}

const STORAGE_KEY = 'launch-catch-onboarding';

const createEmptyDraft = (memberId: string): OnboardingDraft => ({
  memberId,
  consents: { terms: false, privacy: false, location: false },
  gender: null,
  ageGroup: null,
  locationCompleted: false,
});

const readDraft = (memberId: string): OnboardingDraft => {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyDraft(memberId);
    const draft = JSON.parse(saved) as Partial<OnboardingDraft>;
    if (draft.memberId !== memberId) return createEmptyDraft(memberId);
    return {
      memberId,
      consents: {
        terms: draft.consents?.terms === true,
        privacy: draft.consents?.privacy === true,
        location: draft.consents?.location === true,
      },
      gender:
        draft.gender === 'male' ||
        draft.gender === 'female' ||
        draft.gender === 'other'
          ? draft.gender
          : null,
      ageGroup:
        draft.ageGroup === '20s' ||
        draft.ageGroup === '30s' ||
        draft.ageGroup === '40s' ||
        draft.ageGroup === '50s+'
          ? draft.ageGroup
          : null,
      locationCompleted: draft.locationCompleted === true,
    };
  } catch {
    return createEmptyDraft(memberId);
  }
};

// 약관 동의부터 튜토리얼까지 입력값을 같은 탭의 새로고침에도 유지한다
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const memberId = user?.id ?? '';
  const [draft, setDraft] = useState(() => readDraft(memberId));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // 저장소를 쓸 수 없으면 현재 화면에서만 온보딩을 이어간다
    }
  }, [draft]);

  const clearOnboarding = () => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 저장소를 쓸 수 없으면 지울 것도 없다
    }
  };

  return (
    <OnboardingContext
      value={{
        ...draft,
        clearOnboarding,
        setAgeGroup: (ageGroup) =>
          setDraft((current) => ({
            ...current,
            ageGroup,
            locationCompleted: false,
          })),
        setConsents: (consents) =>
          setDraft((current) => ({
            ...current,
            consents,
            locationCompleted: false,
          })),
        setGender: (gender) =>
          setDraft((current) => ({
            ...current,
            gender,
            locationCompleted: false,
          })),
        setLocationCompleted: (locationCompleted) =>
          setDraft((current) => ({ ...current, locationCompleted })),
      }}
    >
      {children}
    </OnboardingContext>
  );
};
