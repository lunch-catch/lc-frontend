import { mockUser } from './mocks/user';

export interface AuthUser {
  id: string;
  nickname: string;
  isOnboarded: boolean;
}

const MOCK_DELAY_MS = 800;

// 카카오 로그인 API가 준비되기 전까지 mock 사용자를 돌려준다
export const loginWithKakao = async (): Promise<AuthUser> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  // 주소에 ?mockLoginError를 붙이면 로그인 실패 화면을 확인할 수 있다
  if (new URLSearchParams(window.location.search).has('mockLoginError')) {
    throw new Error('mock 로그인 실패');
  }

  return { ...mockUser };
};
