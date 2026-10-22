import { useEffect, useState } from 'react';

import { type FeedFilter, fetchFeedFilter } from '@user/api/feedFilter';

// 내 피드 필터를 불러와 들고 있는다
// 필터 버튼과 카드가 없을 때의 안내가 같은 값을 봐야 해서 피드 화면에 둔다
// (빈 화면에서 업종 필터를 풀면 버튼의 "한식·일식" 표시도 같이 "필터"로 돌아가야 한다)
export const useFeedFilter = () => {
  // null이면 아직 받지 못함
  const [filter, setFilter] = useState<FeedFilter | null>(null);
  // 처음 불러오기에 실패했는지. 기본값으로 시트를 열면 저장할 때 서버에 저장된 필터를 덮어써서, 다시 불러온다
  const [hasLoadError, setHasLoadError] = useState(false);

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

  // 다시 불러온다. 받지 못하면 null
  const reload = async () => {
    try {
      const result = await fetchFeedFilter();
      setFilter(result);
      setHasLoadError(false);
      return result;
    } catch {
      return null;
    }
  };

  return { filter, hasLoadError, reload, setFilter };
};
