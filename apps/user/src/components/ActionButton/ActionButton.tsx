import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export type ActionButtonSize = 'medium' | 'large';
export type ActionButtonVariant =
  'brand' | 'soft' | 'secondary' | 'outline' | 'ghost' | 'danger';

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
// soft: 목록처럼 같은 버튼이 여러 번 나올 때 쓰는 연한 주요 행동. 주황이 화면을 덮지 않게 한다
const variantClassNames: Record<ActionButtonVariant, string> = {
  brand:
    'bg-action-primary text-text-inverse active:bg-action-primary-hover disabled:bg-action-primary-disabled disabled:text-text-tertiary',
  soft: 'bg-surface-brand text-text-brand active:bg-brand-200 disabled:bg-action-primary-disabled disabled:text-text-tertiary',
  // secondary: 확인 창의 취소처럼 옆 버튼보다 한 단계 낮은 행동. 회색 바탕이라 버튼으로 읽힌다
  secondary:
    'bg-surface-subtle text-text-primary active:opacity-80 disabled:text-text-disabled',
  // outline: 카드 안의 버튼처럼 색 없이 두되, 회색으로 채운 비활성 버튼과 모양이 달라 누를 수 있는 버튼으로 읽힌다
  outline:
    'border border-border-subtle bg-bg-surface text-text-primary active:bg-surface-subtle disabled:text-text-disabled',
  ghost:
    'bg-transparent text-text-secondary active:bg-surface-subtle disabled:text-text-disabled',
  // danger: 삭제처럼 되돌릴 수 없는 행동. 확인 창의 주 버튼이라 가장 진하게 채운다
  // 빨강은 따뜻한 화면 톤과 만나면 탁해 보여 반전 색을 쓴다 (라이트는 검정, 다크는 흰색)
  // 무엇이 바뀌는지는 확인 창 문구로 알린다
  danger:
    'bg-bg-inverse text-text-on-inverse active:opacity-80 disabled:opacity-50',
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
