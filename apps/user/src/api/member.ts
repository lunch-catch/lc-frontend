import { ApiError, request } from './client';

// 내 정보 (GET /v1/members/me). 카카오에서 가입할 때 받은 닉네임과 프로필 이미지를 쓴다
// 이메일과 전화번호는 받지 않는다
export interface MyProfile {
  memberId: number;
  nickname: string;
  profileImageUrl: string | null;
  onboardingCompleted: boolean;
  // 알림과 위치 정보 이용 동의. 위치에 동의하지 않았으면 GPS로 현재 위치를 찾지 않는다
  consents: {
    notificationOptIn: boolean;
    locationOptIn: boolean;
  };
  createdAt: string;
}

export const fetchMyProfile = () => request<MyProfile>('/v1/members/me');

// 내 정보 수정 (PATCH /v1/members/me). 바꿀 값만 보낸다
// 닉네임은 1~20자이고 공백만은 안 된다. 프로필 이미지는 바꿀 수 없다
export interface MyProfileUpdate {
  nickname?: string;
  notificationOptIn?: boolean;
  locationOptIn?: boolean;
}

export const updateMyProfile = (update: MyProfileUpdate) =>
  request<MyProfile>('/v1/members/me', { method: 'PATCH', body: update });

export interface OnboardingInput {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  ageGroup: 'AGE_20S' | 'AGE_30S' | 'AGE_40S' | 'AGE_50_PLUS';
  locationOptIn: boolean;
  notificationOptIn: boolean;
}

// 온보딩 완료 (PUT /v1/members/me/onboarding). 서버가 완료로 저장해야 피드를 쓸 수 있다
// 성별과 연령대는 이후 수정하는 API가 없다
// 이미 완료한 회원(MEMBER-002)은 실패가 아니라 이미 끝난 것으로 본다
// 저장은 됐는데 응답만 못 받은 뒤 다시 누르면 이 응답이 와서, 실패로 보면 다음 화면으로 못 넘어간다
export const completeOnboarding = async (input: OnboardingInput) => {
  try {
    await request<MyProfile>('/v1/members/me/onboarding', {
      method: 'PUT',
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'MEMBER-002') return;
    throw error;
  }
};
