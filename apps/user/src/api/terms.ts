import type { ConsentKey } from '@user/features/onboarding/onboardingContext';

import { mockUserTerms } from './mocks/terms';

export interface TermsSection {
  heading: string;
  items: string[];
}

export interface TermsItem {
  key: ConsentKey;
  title: string;
  // 동의 시점과 함께 저장하는 약관 버전
  version: string;
  // 약관 주요 내용. API 연동 시 서버에서 받은 전문으로 바꾼다
  sections: TermsSection[];
}

// API 연동 전까지 mock 약관을 쓴다
export const userTerms: TermsItem[] = mockUserTerms;
