import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  onPageChange?: (page: number) => void;
  totalPages: number;
}

type PageItem = number | 'ellipsis';

const createPageItems = (
  currentPage: number,
  totalPages: number,
): PageItem[] => {
  // 페이지 번호가 많으면 양 끝과 현재 위치만 남겨 필터 바의 폭을 제한한다.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
};

export const Pagination = ({
  currentPage,
  onPageChange,
  totalPages,
}: PaginationProps) => {
  // 이동할 다른 페이지가 없으면 숨기며, 하단 건수·개수 선택은 독립적으로 유지한다.
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = createPageItems(currentPage, totalPages);
  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  const buttonClassName =
    'inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-border-subtle bg-bg-surface px-1 text-caption-web text-text-secondary transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50';
  const pageButtonStyle: CSSProperties = {
    boxSizing: 'border-box',
    minHeight: 'var(--space-8)',
    minWidth: 'var(--space-8)',
  };

  return (
    <nav
      aria-label="페이지 이동"
      className="flex max-w-full flex-wrap items-center gap-1"
    >
      <button
        aria-label="이전 페이지"
        className={buttonClassName}
        disabled={isPreviousDisabled}
        onClick={() => onPageChange?.(currentPage - 1)}
        style={pageButtonStyle}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      {pageItems.map((item, index) => {
        if (item === 'ellipsis') {
          return (
            <span
              aria-hidden="true"
              className="inline-flex min-h-8 min-w-8 items-center justify-center text-caption-web text-text-secondary"
              key={`ellipsis-${index}`}
              style={pageButtonStyle}
            >
              …
            </span>
          );
        }

        const isCurrentPage = item === currentPage;

        return (
          <button
            aria-current={isCurrentPage ? 'page' : undefined}
            className={
              isCurrentPage
                ? 'inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-action-primary bg-action-primary px-1 text-caption-web text-text-inverse'
                : buttonClassName
            }
            key={item}
            onClick={() => onPageChange?.(item)}
            style={pageButtonStyle}
            type="button"
          >
            {item}
          </button>
        );
      })}
      <button
        aria-label="다음 페이지"
        className={buttonClassName}
        disabled={isNextDisabled}
        onClick={() => onPageChange?.(currentPage + 1)}
        style={pageButtonStyle}
        type="button"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  );
};
