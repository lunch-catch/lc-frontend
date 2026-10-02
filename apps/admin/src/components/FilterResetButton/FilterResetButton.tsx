import { useState } from 'react';
import { Button, type ButtonProps } from '@repo/ui';
import { RotateCcw } from 'lucide-react';

export interface FilterResetButtonProps extends Omit<
  ButtonProps,
  'children' | 'leadingIcon' | 'trailingIcon' | 'isLoading' | 'variant'
> {
  label?: string;
}

export const FilterResetButton = ({
  label = '필터 초기화',
  className,
  onClick,
  ...props
}: FilterResetButtonProps) => {
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <Button
      aria-label={label}
      title={label}
      {...props}
      className={[
        'size-10 cursor-pointer !p-0 hover:!bg-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      leadingIcon={
        <RotateCcw
          aria-hidden="true"
          key={animationKey}
          className={
            animationKey > 0
              ? 'size-4 animate-[spin_400ms_ease-in-out] motion-reduce:animate-none'
              : 'size-4'
          }
        />
      }
      onClick={(event) => {
        onClick?.(event);
        // key를 바꿔 연속 클릭에서도 같은 회전 애니메이션을 처음부터 재생한다.
        if (!event.defaultPrevented) setAnimationKey((key) => key + 1);
      }}
      variant="tertiary"
    />
  );
};
