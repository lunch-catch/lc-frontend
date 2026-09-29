import type { ButtonHTMLAttributes } from 'react';

export type ActionButtonSize = 'medium' | 'large';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ActionButtonSize;
}

// 디자인 시스템 Core UI Button(Type=Brand)의 모바일 크기
const sizeClassNames: Record<ActionButtonSize, string> = {
  medium: 'h-12 text-body-sm-mobile',
  large: 'h-13 text-body-mobile',
};

const ActionButton = ({
  className,
  size = 'medium',
  type = 'button',
  ...props
}: ActionButtonProps) => {
  const buttonClassName = [
    'flex w-full items-center justify-center rounded-lg px-5 leading-normal font-bold whitespace-nowrap transition-colors',
    'bg-action-primary text-text-inverse active:bg-action-primary-hover',
    'disabled:cursor-not-allowed disabled:bg-action-primary-disabled disabled:text-text-tertiary',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={buttonClassName} type={type} {...props} />;
};

export default ActionButton;
