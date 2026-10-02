import type { ButtonHTMLAttributes } from 'react';

export interface QuickPromptButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label: string;
}

export const QuickPromptButton = ({
  className,
  label,
  type = 'button',
  ...props
}: QuickPromptButtonProps) => (
  <button
    className={[
      'rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-left text-caption-web text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    type={type}
    {...props}
  >
    {label}
  </button>
);
