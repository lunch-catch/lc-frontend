import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export type ActionButtonSize = 'medium' | 'large';
export type ActionButtonVariant = 'brand' | 'ghost';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ActionButtonSize;
  variant?: ActionButtonVariant;
  // 요청을 보내고 기다리는 중. 색은 그대로 두고 글자 대신 도는 아이콘을 보여주며, 다시 누를 수 없다
  loading?: boolean;
}

// 디자인 시스템 Core UI Button의 모바일 크기
const sizeClassNames: Record<ActionButtonSize, string> = {
  medium: 'h-12 text-body-sm-mobile',
  large: 'h-13 text-body-mobile',
};

// brand: 주요 행동, ghost: 배경 없이 글자만 있는 보조 행동
const variantClassNames: Record<ActionButtonVariant, string> = {
  brand:
    'bg-action-primary text-text-inverse active:bg-action-primary-hover disabled:bg-action-primary-disabled disabled:text-text-tertiary',
  ghost:
    'bg-transparent text-text-secondary active:bg-surface-subtle disabled:text-text-disabled',
};

const ActionButton = ({
  children,
  className,
  loading = false,
  onClick,
  size = 'medium',
  type = 'button',
  variant = 'brand',
  ...props
}: ActionButtonProps) => {
  const buttonClassName = [
    'flex w-full items-center justify-center rounded-lg px-5 leading-normal font-bold whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed aria-busy:cursor-progress',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      // disabled를 쓰면 회색으로 바뀌어 실패처럼 보이므로, 색은 두고 누르는 것만 막는다
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={buttonClassName}
      onClick={loading ? undefined : onClick}
      type={type}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="size-5 animate-spin motion-reduce:animate-none"
          />
          {/* 화면 낭독기는 원래 버튼 이름을 그대로 읽는다 */}
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default ActionButton;
