import type { ButtonHTMLAttributes } from 'react';

export type ActionButtonSize = 'medium' | 'large';
export type ActionButtonVariant = 'brand' | 'ghost';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ActionButtonSize;
  variant?: ActionButtonVariant;
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
  className,
  size = 'medium',
  type = 'button',
  variant = 'brand',
  ...props
}: ActionButtonProps) => {
  const buttonClassName = [
    'flex w-full items-center justify-center rounded-lg px-5 leading-normal font-bold whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={buttonClassName} type={type} {...props} />;
};

export default ActionButton;
