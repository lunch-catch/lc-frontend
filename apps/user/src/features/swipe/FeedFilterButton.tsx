import { useEffect, useState } from 'react';
import { ListFilter } from 'lucide-react';

import { type FeedFilter, fetchFeedFilter } from '@user/api/feedFilter';
import { BUSINESS_CATEGORY_LABELS } from '@user/api/store';

import FeedFilterSheet from './FeedFilterSheet';

interface FeedFilterButtonProps {
  // 저장하면 부른다. 필터는 다음 피드 요청부터 적용된다
  onSaved: () => void;
  // 눌렀을 때 다시 불러와도 필터를 받지 못하면 부른다
  onLoadError: () => void;
}

// 피드 카드 위 필터 버튼. 흰 칩에 "필터"라고 적어 처음 보는 사람도 알 수 있게 한다
// 기본값(전체 업종, 거리순)과 다르게 골랐으면 "필터" 대신 걸린 필터를 보여준다 (예: 한식·일식 · 할인율순)
const FeedFilterButton = ({ onLoadError, onSaved }: FeedFilterButtonProps) => {
  const [filter, setFilter] = useState<FeedFilter | null>(null);
  // 처음 불러오기에 실패했는지. 기본값으로 시트를 열면 저장할 때 서버에 저장된 필터를 덮어써서, 다시 불러온다
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchFeedFilter()
      .then((result) => {
        if (!ignore) setFilter(result);
      })
      .catch(() => {
        if (!ignore) setHasLoadError(true);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const handleClick = async () => {
    if (filter) {
      setIsOpen(true);
      return;
    }

    // 처음 불러오기에 실패했으면 다시 불러와, 받은 필터로만 시트를 연다
    setIsReloading(true);
    try {
      setFilter(await fetchFeedFilter());
      setHasLoadError(false);
      setIsOpen(true);
    } catch {
      onLoadError();
    } finally {
      setIsReloading(false);
    }
  };

  // 지금 걸린 필터를 짧게 (예: 한식·일식 · 할인율순, 한식 외 2). 기본값이면 빈 문자열
  const getSummary = ({ categories, sort }: FeedFilter) => {
    const parts: string[] = [];
    if (categories.length > 0) {
      const [first, second] = categories.map(
        (category) => BUSINESS_CATEGORY_LABELS[category],
      );
      parts.push(
        categories.length <= 2
          ? [first, second].filter(Boolean).join('·')
          : `${first} 외 ${categories.length - 1}`,
      );
    }
    if (sort === 'DISCOUNT_RATE') parts.push('할인율순');
    return parts.join(' · ');
  };
  const summary = filter ? getSummary(filter) : '';

  return (
    <>
      <button
        aria-label={summary ? `피드 필터, ${summary} 적용 중` : '피드 필터'}
        // 회색 글자만 있으면 버튼으로 안 보여서, 쿠폰함 QR 보기처럼 흰 바탕에 테두리를 둔다
        className="flex h-8 max-w-full items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-3 text-body-sm-mobile font-medium text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary disabled:opacity-50"
        // 처음 불러오는 중이거나 다시 불러오는 중에는 누를 수 없다. 실패했으면 눌러서 다시 불러온다
        disabled={(!filter && !hasLoadError) || isReloading}
        onClick={handleClick}
        type="button"
      >
        <ListFilter aria-hidden="true" className="size-4 shrink-0" />
        {summary ? (
          <span className="min-w-0 truncate font-bold text-text-brand">
            {summary}
          </span>
        ) : (
          '필터'
        )}
      </button>
      {isOpen && filter && (
        <FeedFilterSheet
          filter={filter}
          onClose={() => setIsOpen(false)}
          onSaved={(saved) => {
            setFilter(saved);
            setIsOpen(false);
            onSaved();
          }}
        />
      )}
    </>
  );
};

export default FeedFilterButton;
