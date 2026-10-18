import type { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  children: ReactNode;
  compact?: boolean;
}

export const DetailItem = ({
  label,
  children,
  compact = false,
}: DetailItemProps) => (
  <div
    className={`grid grid-cols-[112px_minmax(0,1fr)] text-body-sm-web ${compact ? 'gap-3 py-1' : 'gap-4 py-2'}`}
  >
    <dt className="text-text-secondary">{label}</dt>
    {/* 복사 버튼이 있는 행과 일반 텍스트 행의 최소 높이를 맞춘다. */}
    <dd
      className={`min-w-0 break-words font-medium ${compact ? 'min-h-7' : ''}`}
    >
      {children}
    </dd>
  </div>
);
