import { useEffect, useState } from 'react';

import { type AddressResult, searchAddress } from './kakaoSearch';

// 이 글자 수부터 검색한다
const MIN_KEYWORD_LENGTH = 2;
// 입력을 멈추고 이만큼 지나면 검색한다. 글자마다 요청하지 않게 한다
const SEARCH_DELAY_MS = 300;

export interface AddressSearchState {
  keyword: string;
  status: 'loading' | 'done' | 'error';
  results: AddressResult[];
}

// 검색어를 받아 카카오로 장소와 주소를 찾는다
// isSearching이 true인 동안 화면은 검색 결과를 보여준다
export const useAddressSearch = () => {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<AddressSearchState | null>(null);
  // 다시 시도할 때마다 올려서 같은 검색어로 다시 찾는다
  const [attempt, setAttempt] = useState(0);

  const keyword = query.trim();
  const isSearching = keyword.length >= MIN_KEYWORD_LENGTH;

  useEffect(() => {
    if (!isSearching) return;

    let ignore = false;
    const timer = setTimeout(() => {
      searchAddress(keyword)
        .then((results) => {
          if (!ignore) setSearch({ keyword, status: 'done', results });
        })
        .catch(() => {
          if (!ignore) setSearch({ keyword, status: 'error', results: [] });
        });
    }, SEARCH_DELAY_MS);

    // 검색어가 바뀌면 이전 검색 결과는 버린다
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [attempt, isSearching, keyword]);

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    const nextKeyword = nextQuery.trim();
    if (nextKeyword !== keyword) {
      setSearch({ keyword: nextKeyword, status: 'loading', results: [] });
    }
  };

  const retry = () => {
    setSearch({ keyword, status: 'loading', results: [] });
    setAttempt((current) => current + 1);
  };

  return { changeQuery, isSearching, query, retry, search };
};
