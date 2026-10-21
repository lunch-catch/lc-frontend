import { Button } from '@repo/ui';

export interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  retry?: boolean;
}

// 건수·개수 선택과 분리된 전체 너비 영역에서 버튼을 중앙에 배치한다.
export const LoadMoreButton = ({
  onClick,
  loading = false,
  retry = false,
}: LoadMoreButtonProps) => (
  <div className="my-3 flex w-full justify-center">
    <Button
      variant="neutral"
      disabled={loading}
      aria-busy={loading}
      onClick={onClick}
    >
      {loading ? '불러오는 중…' : retry ? '다시 불러오기' : '더 불러오기'}
    </Button>
  </div>
);
