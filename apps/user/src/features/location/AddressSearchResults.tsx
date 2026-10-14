import type { AddressResult } from '@user/api/kakao';

import type { AddressSearchState } from './useAddressSearch';

export interface AddressSearchResultsProps {
  // null이면 첫 검색을 기다리는 중
  search: AddressSearchState | null;
  onRetry: () => void;
  onSelect: (result: AddressResult) => void;
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 검색어를 띄어쓰기로 나눠, 이름에서 각 단어와 같은 부분을 주황색으로 강조한다
const highlight = (text: string, keyword: string) => {
  const words = keyword.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  return text.split(pattern).map((part, index) =>
    // split에 괄호 묶음을 쓰면 홀수 번째 조각이 검색어와 같은 부분이다
    index % 2 === 1 ? (
      <mark className="bg-transparent text-text-brand" key={index}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

// 주소 검색 결과. 불러오는 중, 실패, 결과 없음도 이 자리에 보여준다
// 카드로 묶지 않고 구분선만 있는 목록으로 보여준다
const AddressSearchResults = ({
  onRetry,
  onSelect,
  search,
}: AddressSearchResultsProps) => {
  if (!search || search.status === 'loading') {
    return (
      <ul
        aria-hidden="true"
        className="flex flex-col divide-y divide-border-subtle"
      >
        {[0, 1, 2].map((index) => (
          <li className="flex flex-col gap-1.5 px-1 py-3" key={index}>
            <span className="h-4 w-2/5 animate-pulse rounded bg-surface-subtle motion-reduce:animate-none" />
            <span className="h-3 w-3/5 animate-pulse rounded bg-surface-subtle motion-reduce:animate-none" />
          </li>
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
    <ul aria-label="검색 결과" className="divide-y divide-border-subtle">
      {search.results.map((result) => (
        <li
          key={`${result.placeName ?? ''}-${result.latitude}-${result.longitude}`}
        >
          <button
            className="flex w-full flex-col px-1 py-3 text-left active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
            onClick={() => onSelect(result)}
            type="button"
          >
            <span className="w-full truncate text-body-mobile font-medium text-text-primary">
              {highlight(result.placeName ?? result.address, search.keyword)}
            </span>
            {result.placeName && (
              <span className="mt-0.5 w-full truncate text-body-sm-mobile text-text-secondary">
                {result.address}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default AddressSearchResults;
