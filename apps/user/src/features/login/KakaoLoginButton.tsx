import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

interface KakaoLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // 카카오로 넘어가는 중. 화면을 바꾸지 않고 버튼만 도는 아이콘과 문구로 바꿔 눌린 걸 보여준다
  loading?: boolean;
}

const KakaoLoginButton = ({
  children,
  disabled,
  loading = false,
  type = 'button',
  ...props
}: KakaoLoginButtonProps) => {
  return (
    <button
      aria-busy={loading}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-kakao text-body-sm-mobile font-bold text-on-kakao focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
          카카오로 이동 중이에요
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default KakaoLoginButton;
