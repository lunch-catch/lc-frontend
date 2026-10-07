import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface ConsentRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

// 원형 체크 표시가 있는 동의 항목 한 줄
const ConsentRow = ({ checked, children, onChange }: ConsentRowProps) => {
  return (
    <label className="flex h-12 cursor-pointer items-center gap-3">
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
          checked
            ? 'border-bg-inverse bg-bg-inverse text-text-on-inverse'
            : 'border-border-subtle text-border-subtle'
        }`}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {children}
    </label>
  );
};

export default ConsentRow;
