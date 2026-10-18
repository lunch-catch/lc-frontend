import type { HTMLAttributes, ReactNode } from 'react';

export interface TemplateChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant: 'assistant' | 'loading' | 'user';
}

export const TemplateChatBubble = ({
  children,
  className,
  variant,
  ...props
}: TemplateChatBubbleProps) => (
  <div
    aria-label={
      variant === 'loading' ? 'AI가 답변을 준비하고 있습니다' : undefined
    }
    aria-live={variant === 'loading' ? 'polite' : undefined}
    className={[
      'max-w-[92%] rounded-md px-3 py-2.5 text-body-sm-web leading-6',
      variant === 'assistant'
        ? 'self-start bg-surface-subtle text-text-primary'
        : variant === 'user'
          ? 'self-end bg-brand-200 text-text-primary'
          : 'flex self-start items-center gap-1 bg-surface-subtle py-3',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {variant === 'loading'
      ? [0, 1, 2].map((index) => (
          <span
            aria-hidden="true"
            className="size-1.5 animate-bounce rounded-full bg-text-secondary"
            key={index}
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))
      : children}
  </div>
);
