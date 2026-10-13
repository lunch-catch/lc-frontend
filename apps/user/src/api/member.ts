import { request } from './client';

// 내 정보 (GET /v1/members/me). 카카오에서 가입할 때 받은 닉네임과 프로필 이미지를 쓴다
// 이메일과 전화번호는 받지 않는다
export interface MyProfile {
  memberId: number;
  nickname: string;
  profileImageUrl: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export const fetchMyProfile = () => request<MyProfile>('/v1/members/me');

export interface OnboardingInput {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  ageGroup: 'AGE_20S' | 'AGE_30S' | 'AGE_40S' | 'AGE_50_PLUS';
  locationOptIn: boolean;
  notificationOptIn: boolean;
}

// 온보딩 완료 (PUT /v1/members/me/onboarding). 서버가 완료로 저장해야 피드를 쓸 수 있다
// 성별과 연령대는 이후 수정하는 API가 없다
export const completeOnboarding = (input: OnboardingInput) =>
  request<MyProfile>('/v1/members/me/onboarding', {
    method: 'PUT',
    body: input,
  });
