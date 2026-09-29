import type { ReactNode } from 'react';

export interface FixedBottomProps {
  children: ReactNode;
}

// 화면 하단에 고정되는 CTA 영역 (디자인 시스템 Pattern/Fixed CTA)
const FixedBottom = ({ children }: FixedBottomProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-mobile bg-bg-surface px-page pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
};

export default FixedBottom;
