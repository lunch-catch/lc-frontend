import {
  type FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useNavigationType, useSearchParams } from 'react-router';
import { ChevronDown, Search, X } from 'lucide-react';

import {
  BUSINESS_CATEGORY_LABELS,
  CATEGORY_FILTER_OPTIONS,
  type CategoryFilter,
  fetchStores,
  type StoreListItem,
} from '@user/api/store';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import {
  getHeaderLocationName,
  refreshMyLocation,
  useMyLocation,
} from '@user/hooks/useMyLocation';
import { useWishCount } from '@user/hooks/useWishCount';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import AppHeader from '@user/ui/AppHeader/AppHeader';
import EmptyState from '@user/ui/EmptyState/EmptyState';

import CategoryIconRow from './CategoryIconRow';
import { readExploreSnapshot, saveExploreSnapshot } from './exploreSnapshot';
import NearbyCouponSlider from './NearbyCouponSlider';
import NearbyCouponSliderSkeleton from './NearbyCouponSliderSkeleton';
import StatusBanner from './StatusBanner';
import StoreCard from './StoreCard';
import StoreListSkeleton from './StoreListSkeleton';
import StoreMap from './StoreMap';

type ExploreView = 'list' | 'map';

// 주소의 업종 값을 고를 수 있는 업종으로 바꾼다. 모르는 값이면 전체로 본다
const toCategoryFilter = (value: string | null): CategoryFilter =>
  CATEGORY_FILTER_OPTIONS.find((option) => option.value === value)?.value ??
  'ALL';

// 처음 둘러볼 때 한 번에 보여주는 가게 수. 더 보기를 누를 때마다 이만큼씩 늘어난다
const PAGE_STEP = 10;

// 목록 카드와 무게가 겹치지 않도록 상자 대신 가운데 놓인 작은 알약으로 둔다
const moreButtonClassName =
  'mx-auto flex h-10 items-center justify-center gap-1 rounded-full bg-surface-subtle px-5 text-body-sm-mobile font-medium text-text-secondary active:bg-border-subtle focus-visible:outline-2 focus-visible:outline-action-primary';

// 줄 세 개 아이콘은 메뉴·정렬로도 읽혀서, 뜻이 바로 보이는 두 글자로 쓴다
const viewOptions = [
  { value: 'list', label: '목록' },
  { value: 'map', label: '지도' },
] as const;

// 탐색 탭. 주변 가게를 업종별로 보고 가게명이나 메뉴로 검색한다 (Figma 4. 홈의 목록·지도 보기)
// 목록과 지도는 같은 가게 목록을 보여주는 방식만 다르다
const ExploreScreen = () => {
  // 가게 상세에 들어갔다 돌아와도 보던 조건이 그대로 남도록 보기 방식(?view=map), 업종(?category=), 검색어(?q=)를 주소에 둔다
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ExploreView = searchParams.get('view') === 'map' ? 'map' : 'list';
  // 검색 버튼을 눌러 확정한 검색어. 입력 중에는 목록을 다시 받지 않는다
  const query = searchParams.get('q') ?? '';
  const category = toCategoryFilter(searchParams.get('category'));
  const [inputValue, setInputValue] = useState(query);
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const { wishCount } = useWishCount();
  // 가게까지 거리는 저장 위치를 기준으로 잰다. 지도 가운데도 이 위치다
  const myLocation = useMyLocation();
  const locationName = getHeaderLocationName(myLocation);
  const latitude = myLocation?.latitude ?? null;
  const longitude = myLocation?.longitude ?? null;
  const locationKey = `${latitude},${longitude}`;
  // 이 조건으로 받은 목록인지 알아보는 값. 떠날 때 저장한 목록은 조건이 같을 때만 다시 쓴다
  const listKey = `${query}|${category}|${locationKey}`;
  // 방금 이 조건으로 보던 목록이 있으면 다시 받지 않고 바로 그린다
  const [snapshot] = useState(() => readExploreSnapshot(listKey));
  // undefined면 불러오는 중, null이면 첫 페이지를 받지 못함
  const [stores, setStores] = useState<StoreListItem[] | null | undefined>(
    snapshot?.stores,
  );
  const showSkeleton = useDelayedLoading(stores === undefined);
  // 업종·검색어를 바꿔 새 목록을 받는 중인지. 그동안 이전 목록을 흐리게 남겨 둔다 (refreshStores)
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 처음 둘러볼 때 보여주는 가게 수. 조건(업종, 검색어, 위치)이 바뀌면 처음 값으로 돌아간다
  const [visible, setVisible] = useState({ count: PAGE_STEP, key: listKey });
  const visibleCount = visible.key === listKey ? visible.count : PAGE_STEP;
  // 다음 페이지 커서. 마지막 페이지면 null
  const [nextPageToken, setNextPageToken] = useState<string | null>(
    snapshot?.nextPageToken ?? null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreError, setHasMoreError] = useState(false);
  // 다시 시도할 때마다 올려서 첫 페이지를 새로 받는다
  const [attempt, setAttempt] = useState(0);
  // 조건이 바뀌면 올린다. 그 전에 보낸 다음 페이지 요청의 응답은 버린다
  const generation = useRef(0);
  // 목록 끝에 두어, 화면에 가까워지면 다음 페이지를 받는다
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 저장해 둔 목록으로 그렸으면 같은 조건의 첫 요청을 건너뛴다. 조건이 바뀌면 비운다
  const skipFetchKey = useRef(snapshot ? `${listKey}#0` : null);
  // 떠날 때 저장할 지금 목록과 스크롤 위치. 화면을 벗어나는 순간에는 상태를 읽을 수 없어 늘 최신으로 담아 둔다
  const latest = useRef({ isRefreshing, listKey, nextPageToken, stores });
  useEffect(() => {
    latest.current = { isRefreshing, listKey, nextPageToken, stores };
  });
  const scrollYRef = useRef(0);
  // 저장 위치를 받았는데 좌표가 없으면 위치부터 설정하게 한다
  const needsLocation =
    myLocation !== undefined &&
    myLocation !== null &&
    (latitude === null || longitude === null);
  const storeCategory = category === 'ALL' ? undefined : category;

  // 위치가 바뀌거나 다시 시도하면 이전 결과 대신 회색 틀을 보여준다
  const resetStores = () => {
    setStores(undefined);
    setIsRefreshing(false);
    setNextPageToken(null);
    setIsLoadingMore(false);
    setHasMoreError(false);
  };

  // 업종이나 검색어를 바꾸면 새 목록이 올 때까지 이전 목록을 흐리게 남겨 둔다
  // 목록을 비우면 응답이 빠를 때 화면이 비었다 채워지며 번쩍인다. 다음 페이지는 이전 조건 것이라 받지 않는다
  const refreshStores = () => {
    if (!stores) {
      resetStores();
      return;
    }
    setIsRefreshing(true);
    setNextPageToken(null);
    setIsLoadingMore(false);
    setHasMoreError(false);
  };

  // 저장 위치를 다시 받아 좌표가 바뀌면 이전 위치의 목록과 다음 페이지 상태를 비운다
  // effect에서 비우면 이전 목록이 한 번 더 그려져서, 렌더 중에 바로 비운다
  const [listedLocationKey, setListedLocationKey] = useState(locationKey);
  if (listedLocationKey !== locationKey) {
    setListedLocationKey(locationKey);
    resetStores();
  }

  useEffect(() => {
    // 좌표가 없어져도 세대를 올려, 이전 위치로 보낸 요청의 응답을 버린다
    const current = ++generation.current;
    if (latitude === null || longitude === null) return;
    // 돌아와서 저장한 목록으로 그린 조건이면 다시 받지 않는다 (개발 모드에서 두 번 돌아도 건너뛴다)
    const fetchKey = `${listKey}#${attempt}`;
    if (skipFetchKey.current === fetchKey) return;
    skipFetchKey.current = null;

    let ignore = false;

    fetchStores({
      category: storeCategory,
      latitude,
      longitude,
      query: query || undefined,
    })
      .then((response) => {
        if (ignore || current !== generation.current) return;
        setStores(response.items);
        setIsRefreshing(false);
        setNextPageToken(response.nextPageToken);
        setHasMoreError(false);
      })
      .catch(() => {
        if (!ignore && current === generation.current) {
          setStores(null);
          setIsRefreshing(false);
        }
      });

    // 응답 전에 조건이 바뀌거나 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt, latitude, listKey, longitude, query, storeCategory]);

  // 스크롤 위치를 따라 담아 두고, 화면을 떠날 때 받은 목록과 함께 저장한다
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      const {
        listKey: key,
        nextPageToken: token,
        stores: list,
        isRefreshing: wasRefreshing,
      } = latest.current;
      // 새 조건의 목록을 받기 전이면 남아 있는 건 이전 조건의 목록이라 저장하지 않는다
      if (!list || wasRefreshing) return;
      saveExploreSnapshot({
        key,
        nextPageToken: token,
        savedAt: Date.now(),
        scrollY: scrollYRef.current,
        stores: list,
      });
    };
  }, []);

  // 뒤로 가기로 돌아왔을 때만 보던 자리로 내려 준다. 탭을 눌러 들어오면 맨 위에서 시작한다
  // 저장한 목록을 이미 그린 뒤라, 화면에 보이기 전에 옮겨 위에서 내려가는 모습이 보이지 않게 한다
  useLayoutEffect(() => {
    if (snapshot && navigationType === 'POP') {
      window.scrollTo(0, snapshot.scrollY);
    }
    // 처음 그릴 때 한 번만 옮긴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 다음 페이지를 이어 받는다. 검색어, 업종, 위치는 첫 페이지와 같게 보낸다
  const loadMore = () => {
    if (
      !stores ||
      !nextPageToken ||
      isLoadingMore ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    const current = generation.current;
    setIsLoadingMore(true);
    setHasMoreError(false);
    fetchStores({
      category: storeCategory,
      latitude,
      longitude,
      pageToken: nextPageToken,
      query: query || undefined,
    })
      .then((response) => {
        if (current !== generation.current) return;
        // 같은 가게가 두 번 오면 한 번만 둔다
        setStores((prev) => {
          const seen = new Set(prev?.map((store) => store.storeId));
          return [
            ...(prev ?? []),
            ...response.items.filter((store) => !seen.has(store.storeId)),
          ];
        });
        setNextPageToken(response.nextPageToken);
      })
      .catch(() => {
        if (current === generation.current) setHasMoreError(true);
      })
      .finally(() => {
        if (current === generation.current) setIsLoadingMore(false);
      });
  };

  // 목록 끝이 화면 아래 300px 앞에 오면 다음 페이지를 받는다
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      view !== 'list' ||
      !nextPageToken ||
      isLoadingMore ||
      hasMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { rootMargin: '0px 0px 300px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  const retry = () => {
    refreshMyLocation();
    resetStores();
    setAttempt((value) => value + 1);
  };

  // 주소의 조건만 바꾼다. 보기 방식처럼 뒤로 가기 기록은 쌓지 않는다
  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([name, value]) => {
          if (value) next.set(name, value);
          else next.delete(name);
        });
        return next;
      },
      { replace: true },
    );
  };

  const changeQuery = (nextQuery: string) => {
    if (nextQuery === query) return;
    refreshStores();
    // 내려가 있던 자리에서 새 목록의 중간이 보이지 않도록 맨 위로 올린다
    window.scrollTo({ top: 0 });
    updateParams({ q: nextQuery || null });
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
    if (nextCategory === category) return;
    refreshStores();
    window.scrollTo({ top: 0 });
    updateParams({ category: nextCategory === 'ALL' ? null : nextCategory });
  };

  const renderContent = () => {
    if (needsLocation) {
      return (
        <EmptyState
          description="설정한 위치 주변 가게를 보여드려요"
          image={mascotEmpty}
          title="위치를 설정해 주세요"
        >
          <ActionButton onClick={() => navigate('/my/location')}>
            위치 설정하기
          </ActionButton>
        </EmptyState>
      );
    }

    if (stores === null || myLocation === null) {
      return (
        <EmptyState
          description="잠시 후 다시 시도해 주세요"
          image={mascotEmpty}
          title="가게를 불러오지 못했어요"
        >
          <ActionButton onClick={retry}>다시 시도</ActionButton>
        </EmptyState>
      );
    }

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
          {/* 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다 */}
          {/* 처음 둘러볼 때는 슬라이드 자리도 잡아 두어, 받은 뒤 목록이 아래로 밀려 내려가지 않게 한다 */}
          {showSkeleton && (
            <div className="flex flex-col gap-6">
              {!query && category === 'ALL' && <StatusBanner />}
              {!query && category === 'ALL' && <NearbyCouponSliderSkeleton />}
              <StoreListSkeleton />
            </div>
          )}
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

    // 글자만 두면 막다른 화면이 되어, 다른 빈 화면처럼 다음에 할 일(전체 보기)을 버튼으로 둔다
    if (stores.length === 0 && category !== 'ALL') {
      return (
        <EmptyState
          description="다른 업종이나 전체 가게를 둘러보세요"
          image={mascotEmpty}
          title={`주변에 ${BUSINESS_CATEGORY_LABELS[category]} 가게가 없어요`}
        >
          <ActionButton onClick={() => changeCategory('ALL')}>
            전체 가게 보기
          </ActionButton>
        </EmptyState>
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

    if (view === 'map' && latitude !== null && longitude !== null) {
      return <StoreMap center={{ latitude, longitude }} stores={stores} />;
    }

    // 서버는 쿠폰 가게와 아닌 가게를 거리순으로 섞어서 준다. 구역으로 나누면 더 받을 때마다 쿠폰 가게가 위로 끼어들어 숫자가 바뀌므로
    // 하나의 목록으로 두고, 쿠폰 유무는 카드 오른쪽 칸(주황 할인, 회색 쿠폰 없음)으로 구분한다. 새 가게는 항상 맨 아래에 붙는다
    // 쿠폰 가게를 먼저 보는 길은 위 슬라이드가 맡는다
    // 처음 둘러볼 때만 슬라이드와 더 보기로 나눠 보여주고, 검색하거나 업종을 고르면 빨리 찾도록 결과 전체를 이어서 보여준다
    const isBrowsing = !query && category === 'ALL';
    const shownStores = isBrowsing ? stores.slice(0, visibleCount) : stores;
    const hasMore =
      isBrowsing && (stores.length > visibleCount || Boolean(nextPageToken));

    const showMore = () => {
      const nextCount = visibleCount + PAGE_STEP;
      setVisible({ count: nextCount, key: listKey });
      // 이미 받은 가게로 모자라면 서버에서 다음 페이지를 받는다
      if (stores.length < nextCount) loadMore();
    };

    return (
      <div className="flex flex-col gap-6">
        {isBrowsing && <StatusBanner />}
        {isBrowsing && (
          <NearbyCouponSlider
            stores={stores.filter((store) => store.hasActiveCampaign)}
          />
        )}
        <section className="flex flex-col gap-3">
          {!query && (
            <h3 className="text-body-sm-mobile font-bold text-text-primary">
              주변 가게
            </h3>
          )}
          <ul aria-label="주변 가게" className="flex flex-col gap-3">
            {shownStores.map((store) => (
              <StoreCard key={store.storeId} store={store} />
            ))}
          </ul>
          {hasMore &&
            (hasMoreError ? (
              <div className="flex items-center justify-between gap-3 py-2">
                <p className="text-body-sm-mobile text-text-secondary">
                  가게를 더 불러오지 못했어요
                </p>
                <ActionButton onClick={loadMore} variant="outline">
                  다시 시도
                </ActionButton>
              </div>
            ) : (
              <button
                className={moreButtonClassName}
                disabled={isLoadingMore}
                onClick={showMore}
                type="button"
              >
                {isLoadingMore ? '불러오는 중' : '가게 더 보기'}
                <ChevronDown aria-hidden="true" className="size-4" />
              </button>
            ))}
        </section>
        {/* 더 보기를 쓰지 않는 검색, 업종 목록은 끝에 닿으면 다음 페이지를 이어서 받는다 */}
        {!isBrowsing && nextPageToken && (
          <div ref={sentinelRef}>
            {hasMoreError ? (
              <div className="flex items-center justify-between gap-3 py-2">
                <p className="text-body-sm-mobile text-text-secondary">
                  가게를 더 불러오지 못했어요
                </p>
                <ActionButton onClick={loadMore} variant="outline">
                  다시 시도
                </ActionButton>
              </div>
            ) : (
              <>
                <StoreListSkeleton />
                <p className="sr-only" role="status">
                  가게를 더 불러오는 중이에요
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AppHeader locationName={locationName} wishCount={wishCount} />
      <div className="flex flex-1 flex-col gap-3 px-page pt-2 pb-6">
        {/* 목록·지도 전환은 검색창 옆에 둔다. 떠 있는 버튼은 목록을 내리는 내내 카드 글자를 가렸고,
            켜진 쪽이 보이는 탭이라 지금 어떤 보기인지도 바로 알 수 있다. 줄을 새로 만들지 않아 목록이 밀려 내려가지 않는다 */}
        {/* 목록을 내리는 중에도 검색과 업종을 바로 바꿀 수 있도록 위에 붙여 둔다 */}
        <div className="sticky top-0 z-20 -mx-page flex flex-col gap-3 bg-bg-page px-page pt-1 pb-2">
          <div className="flex gap-2">
            <form
              className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 focus-within:border-action-primary"
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
            <div
              aria-label="보기 방식"
              className="flex h-11 shrink-0 items-center gap-0.5 rounded-xl border border-border-subtle bg-bg-surface p-1"
              role="group"
            >
              {viewOptions.map(({ label, value }) => (
                <button
                  aria-pressed={view === value}
                  className={`flex h-full items-center justify-center rounded-lg px-2.5 text-body-sm-mobile font-bold transition-colors ${
                    view === value
                      ? 'bg-surface-brand text-text-brand'
                      : 'text-text-tertiary'
                  }`}
                  key={value}
                  onClick={() =>
                    // 업종·검색어는 그대로 두고 보기 방식만 바꾼다
                    updateParams({ view: value === 'map' ? 'map' : null })
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <CategoryIconRow onChange={changeCategory} value={category} />
        </div>
        {/* 결과가 없으면 아래 안내 화면이 같은 말을 하므로 숨긴다 */}
        {query && stores?.length !== 0 && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <h2 className="min-w-0 truncate text-body-sm-mobile font-bold text-text-primary">
              ‘{query}’ 검색 결과
            </h2>
            {stores && (
              <p className="shrink-0 text-body-sm-mobile text-text-secondary">
                {/* 서버가 전체 개수를 주지 않아, 더 있으면 받은 수에 +를 붙인다 */}
                {stores.length}
                {nextPageToken ? '+' : ''}개 가게
              </p>
            )}
          </div>
        )}
        {/* 새 목록을 받는 동안 이전 목록을 흐리게 보여주고 누를 수 없게 한다 */}
        <div
          aria-busy={isRefreshing || undefined}
          className={`flex flex-1 flex-col transition-opacity motion-reduce:transition-none ${
            isRefreshing ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ExploreScreen;
