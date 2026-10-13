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
