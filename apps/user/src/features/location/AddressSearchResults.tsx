import { MapPin } from 'lucide-react';

import type { AddressResult } from '@user/api/kakao';

import type { AddressSearchState } from './useAddressSearch';

export interface AddressSearchResultsProps {
  // null이면 첫 검색을 기다리는 중
  search: AddressSearchState | null;
  onRetry: () => void;
  onSelect: (result: AddressResult) => void;
}

// 주소 검색 결과. 불러오는 중, 실패, 결과 없음도 이 자리에 보여준다
const AddressSearchResults = ({
  onRetry,
  onSelect,
  search,
}: AddressSearchResultsProps) => {
  if (!search || search.status === 'loading') {
    return (
      <ul aria-hidden="true" className="flex flex-col gap-2">
        {[0, 1, 2].map((index) => (
          <li
            className="h-15 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
            key={index}
          />
        ))}
      </ul>
    );
  }

  if (search.status === 'error') {
    return (
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-body-sm-mobile text-text-secondary">
          검색하지 못했어요
        </p>
        <button
          className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onRetry}
          type="button"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (search.results.length === 0) {
    return (
      <p className="px-1 text-body-sm-mobile text-text-secondary">
        검색 결과가 없어요
      </p>
    );
  }

  return (
    <ul
      aria-label="검색 결과"
      className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
    >
      {search.results.map((result) => (
        <li
          key={`${result.placeName ?? ''}-${result.latitude}-${result.longitude}`}
        >
          <button
            className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
            onClick={() => onSelect(result)}
            type="button"
          >
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-text-tertiary"
            />
            <span className="min-w-0">
              <span className="block truncate text-body-sm-mobile font-medium text-text-primary">
                {result.placeName ?? result.address}
              </span>
              {result.placeName && (
                <span className="block truncate text-caption-mobile text-text-secondary">
                  {result.address}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default AddressSearchResults;
