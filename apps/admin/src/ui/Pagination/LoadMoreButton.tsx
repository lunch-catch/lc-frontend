import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

export interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  retry?: boolean;
  hasMore?: boolean;
  controls?: ReactNode;
}

// 좌우 너비를 같게 잡아 오른쪽 컨트롤의 길이와 무관하게 버튼을 중앙에 둔다.
export const LoadMoreButton = ({
  onClick,
  loading = false,
  retry = false,
  hasMore = true,
  controls,
}: LoadMoreButtonProps) => (
  <div className="relative mt-3 grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&:has([aria-expanded=true])]:z-30">
    {hasMore && (
      <div className="justify-self-center sm:col-start-2 sm:row-start-1">
        <Button
          variant="neutral"
          disabled={loading}
          aria-busy={loading}
          onClick={onClick}
        >
          {loading ? '불러오는 중…' : retry ? '다시 불러오기' : '더 불러오기'}
        </Button>
      </div>
    )}
    {controls && (
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3 sm:col-start-3 sm:row-start-1">
        {controls}
      </div>
    )}
  </div>
);
