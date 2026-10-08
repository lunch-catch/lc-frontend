import { type FormEvent, useEffect, useState } from 'react';
import { List, Map as MapIcon, Search, X } from 'lucide-react';

import { getWishCount } from '@user/api/feed';
import {
  BUSINESS_CATEGORY_LABELS,
  fetchStores,
  type StoreListItem,
} from '@user/api/store';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import AppHeader from '@user/components/AppHeader/AppHeader';
import EmptyState from '@user/components/EmptyState/EmptyState';

import CategoryIconRow, { type CategoryFilter } from './CategoryIconRow';
import FeaturedStoreCard from './FeaturedStoreCard';
import StoreCard from './StoreCard';
import StoreListSkeleton from './StoreListSkeleton';
import StoreMap, { type MapCenter } from './StoreMap';

type ExploreView = 'list' | 'map';

// 위치 설정(#14) 전까지 쓰는 현재 위치 (강남역)
const MOCK_CURRENT_LOCATION: MapCenter = {
  latitude: 37.4979,
  longitude: 127.0276,
};

// 탐색 탭. 주변 가게를 업종별로 보고 가게명이나 메뉴로 검색한다 (Figma 4. 홈의 목록·지도 보기)
// 목록과 지도는 같은 가게 목록을 보여주는 방식만 다르다
const ExploreScreen = () => {
  const [inputValue, setInputValue] = useState('');
  // 검색 버튼을 눌러 확정한 검색어. 입력 중에는 목록을 다시 받지 않는다
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [stores, setStores] = useState<StoreListItem[] | null>(null);
  const [view, setView] = useState<ExploreView>('list');
  const [wishCount] = useState(getWishCount);

  useEffect(() => {
    let ignore = false;

    fetchStores({
      category: category === 'ALL' ? undefined : category,
      query: query || undefined,
    }).then((response) => {
      if (!ignore) setStores(response.items);
    });

    // 응답 전에 조건이 바뀌거나 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [category, query]);

  // 조건이 바뀌면 이전 결과 대신 회색 틀을 보여준다
  const changeQuery = (nextQuery: string) => {
    if (nextQuery === query) return;
    setStores(null);
    setQuery(nextQuery);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    changeQuery(inputValue.trim());
  };

  const clearSearch = () => {
    setInputValue('');
    changeQuery('');
  };

  const changeCategory = (nextCategory: CategoryFilter) => {
    setStores(null);
    setCategory(nextCategory);
  };

  const renderContent = () => {
    if (!stores && view === 'map') {
      return (
        <div
          aria-hidden="true"
          className="-mx-page min-h-80 flex-1 animate-pulse bg-surface-subtle motion-reduce:animate-none"
        />
      );
    }

    if (!stores) {
      return (
        <>
          <StoreListSkeleton />
          <p className="sr-only" role="status">
            가게를 불러오는 중이에요
          </p>
        </>
      );
    }

    if (stores.length === 0 && query) {
      return (
        <EmptyState
          description="다른 검색어를 입력하거나 주변 가게를 둘러보세요"
          image={mascotEmpty}
          title="검색 결과가 없어요"
        >
          <ActionButton onClick={clearSearch}>주변 가게 보기</ActionButton>
        </EmptyState>
      );
    }

    if (stores.length === 0 && category !== 'ALL') {
      return (
        <p className="py-10 text-center text-body-sm-mobile text-text-secondary">
          주변에 {BUSINESS_CATEGORY_LABELS[category]} 가게가 없어요
        </p>
      );
    }

    if (stores.length === 0) {
      // 위치 설정 화면이 생기면 "위치 변경하기" 버튼을 둔다
      return (
        <EmptyState
          description="다른 위치를 설정하거나 내일 다시 확인해 보세요"
          image={mascotEmpty}
          title="주변에 가게가 없어요"
        />
      );
    }

    if (view === 'map') {
      return <StoreMap center={MOCK_CURRENT_LOCATION} stores={stores} />;
    }

    // 서버가 쿠폰 진행 중인 가게를 먼저 보내지만 카드만으로는 경계가 안 보여 구역을 나눈다
    const storeGroups = [
      {
        title: '쿠폰 진행 중',
        items: stores.filter((store) => store.hasActiveCampaign),
      },
      {
        title: '다른 가게',
        items: stores.filter((store) => !store.hasActiveCampaign),
      },
    ].filter((group) => group.items.length > 0);
    // 처음 둘러볼 때만 가장 가까운 쿠폰 가게(쿠폰 구역 첫 가게)를 크게 보여준다
    // 검색하거나 업종을 고르면 빨리 찾도록 모두 같은 작은 카드로 둔다
    const isBrowsing = !query && category === 'ALL';

    return (
      <div className="flex flex-col gap-6">
        {storeGroups.map((group) => (
          <section className="flex flex-col gap-3" key={group.title}>
            <h3 className="text-body-sm-mobile font-bold text-text-primary">
              {group.title}{' '}
              <span className="font-medium text-text-secondary tabular-nums">
                {group.items.length}
              </span>
            </h3>
            <ul aria-label={group.title} className="flex flex-col gap-3">
              {group.items.map((store, index) =>
                isBrowsing && store.hasActiveCampaign && index === 0 ? (
                  <FeaturedStoreCard key={store.storeId} store={store} />
                ) : (
                  <StoreCard key={store.storeId} store={store} />
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 위치 설정(#14) 전까지는 고정 위치를 보여준다 */}
      <AppHeader locationName="강남역 주변" wishCount={wishCount} />
      {/* 목록에서는 마지막 카드가 떠 있는 전환 버튼에 가리지 않도록 아래를 더 비운다 */}
      <div
        className={`flex flex-1 flex-col gap-3 px-page pt-2 ${
          view === 'list' ? 'pb-20' : 'pb-6'
        }`}
      >
        <form
          className="flex h-12 items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 focus-within:border-action-primary"
          onSubmit={handleSearch}
          role="search"
        >
          <Search
            aria-hidden="true"
            className="size-4.5 shrink-0 text-text-secondary"
          />
          <input
            aria-label="가게, 메뉴 검색"
            className="h-full min-w-0 flex-1 bg-transparent text-body-sm-mobile text-text-primary placeholder:text-text-tertiary focus:outline-none"
            // 브라우저가 search 입력칸에 붙이는 지우기 버튼과 겹치지 않도록 text로 두고, 키보드에는 검색 키를 띄운다
            enterKeyHint="search"
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="가게, 메뉴 검색"
            type="text"
            value={inputValue}
          />
          {inputValue && (
            <button
              aria-label="검색어 지우기"
              className="-mr-2 flex size-9 shrink-0 items-center justify-center text-text-tertiary"
              onClick={clearSearch}
              type="button"
            >
              <X aria-hidden="true" className="size-4.5" />
            </button>
          )}
        </form>
        <CategoryIconRow onChange={changeCategory} value={category} />
        {/* 결과가 없으면 아래 안내 화면이 같은 말을 하므로 숨긴다 */}
        {query && stores?.length !== 0 && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <h2 className="min-w-0 truncate text-body-sm-mobile font-bold text-text-primary">
              ‘{query}’ 검색 결과
            </h2>
            {stores && (
              <p className="shrink-0 text-body-sm-mobile text-text-secondary">
                {stores.length}개 가게
              </p>
            )}
          </div>
        )}
        {renderContent()}
      </div>
      {/* 무엇을 볼지(업종)와 어떻게 볼지(목록·지도)를 나누어, 전환은 탭바 위에 떠 있는 버튼으로 둔다 */}
      {/* 목록을 내리는 중에도 엄지가 닿는 아래에 있다. 보여줄 가게가 없으면 숨긴다 */}
      {stores && stores.length > 0 && (
        <button
          className="fixed inset-x-0 bottom-[calc(94px+env(safe-area-inset-bottom))] z-10 mx-auto flex h-10 w-fit items-center gap-1.5 rounded-full bg-text-primary px-4 text-body-sm-mobile font-bold text-text-inverse shadow-lg"
          onClick={() => setView(view === 'list' ? 'map' : 'list')}
          type="button"
        >
          {view === 'list' ? (
            <>
              <MapIcon aria-hidden="true" className="size-4" />
              지도로 보기
            </>
          ) : (
            <>
              <List aria-hidden="true" className="size-4" />
              목록으로 보기
            </>
          )}
        </button>
      )}
    </>
  );
};

export default ExploreScreen;
