import type { ReactNode } from 'react';

export interface FixedBottomProps {
  children: ReactNode;
}

// 화면 하단에 고정되는 CTA 영역 (디자인 시스템 Pattern/Fixed CTA)
// 지나가는 내용 위에 떠 있다는 게 보이도록 위쪽에 은은한 그림자를 둔다
const FixedBottom = ({ children }: FixedBottomProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-mobile bg-bg-surface px-page pt-3 shadow-[0_-6px_16px_rgba(47,42,39,0.08)] pb-[max(12px,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
};

export default FixedBottom;
