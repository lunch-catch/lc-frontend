import { ApiError, request } from './client';

export interface AuthUser {
  id: string;
  nickname: string;
  isOnboarded: boolean;
}

interface KakaoAuthorizationResponse {
  authorizationUrl: string;
}

interface LoginResponse {
  memberId: number;
  nickname: string;
  newMember: boolean;
  onboardingCompleted: boolean;
}

// 카카오 로그인 화면 주소. state와 nonce는 서버가 만들어 주소에 넣어 준다
export const fetchKakaoAuthorizationUrl = async () => {
  const data = await request<KakaoAuthorizationResponse>(
    '/v1/auth/kakao/authorize',
  );
  return data.authorizationUrl;
};

// 서버가 Refresh Token을 폐기하고 두 인증 쿠키를 지운다. 카카오 쪽 로그아웃도 서버가 함께 요청한다
// 이미 로그아웃된 상태(AUTH-005)는 실패가 아니라 이미 끝난 것으로 본다
export const logout = async () => {
  try {
    await request<void>('/v1/auth/tokens', { method: 'DELETE' });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'AUTH-005') return;
    throw error;
  }
};

// 카카오가 돌려준 인가 코드로 로그인한다. 처음 온 사용자면 서버가 가입까지 한다
// 토큰은 서버가 HttpOnly 쿠키로 내려주므로 응답에서는 사용자 정보만 받는다
export const loginWithKakaoCode = async (
  authorizationCode: string,
  state: string,
): Promise<AuthUser> => {
  const data = await request<LoginResponse>('/v1/auth/tokens', {
    method: 'POST',
    body: { authorizationCode, state },
  });

  return {
    id: String(data.memberId),
    nickname: data.nickname,
    isOnboarded: data.onboardingCompleted,
  };
};
