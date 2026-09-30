import type { ButtonHTMLAttributes } from 'react';

const KakaoLoginButton = ({
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-kakao text-body-sm-mobile font-bold text-on-kakao focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-60"
      type={type}
      {...props}
    />
  );
};

export default KakaoLoginButton;
