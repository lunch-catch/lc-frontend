import type { ButtonHTMLAttributes } from 'react';

export interface ChoiceChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

// 여러 항목 중 하나를 고르는 칩 (디자인 시스템 Form/Chip, 터치 영역 44px)
const ChoiceChip = ({
  className,
  selected,
  type = 'button',
  ...props
}: ChoiceChipProps) => {
  const chipClassName = [
    'flex h-11 items-center justify-center rounded-full border border-border-subtle px-3.5 text-caption-mobile font-medium whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
    selected
      ? 'bg-surface-brand text-action-primary'
      : 'bg-bg-surface text-text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={chipClassName} type={type} {...props} />;
};

export default ChoiceChip;
