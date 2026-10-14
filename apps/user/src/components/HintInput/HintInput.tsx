import type { InputHTMLAttributes } from 'react';

export interface HintInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'placeholder' | 'value'
> {
  // 비어 있을 때 보여줄 안내 문구
  hint: string;
  value: string;
}

// 입력 글자는 16px, 안내 문구는 14px인 입력칸
// iOS는 입력 글자가 16px보다 작으면 입력할 때 화면을 확대해서 입력 글자는 줄일 수 없다
// placeholder로 글자만 줄이면 16px 글자의 기준선에 맞춰져 아래로 쏠려 보여서, 안내 문구를 따로 겹쳐 세로 가운데에 둔다
const HintInput = ({ className, hint, value, ...props }: HintInputProps) => (
  <span className={`relative flex h-full min-w-0 flex-1 ${className ?? ''}`}>
    <input
      className="h-full w-full min-w-0 bg-transparent text-body-mobile text-text-primary focus:outline-none"
      value={value}
      {...props}
    />
    {!value && (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center truncate text-body-sm-mobile text-text-tertiary"
      >
        {hint}
      </span>
    )}
  </span>
);

export default HintInput;
