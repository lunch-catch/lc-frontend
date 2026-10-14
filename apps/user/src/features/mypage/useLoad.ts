import { useEffect, useState } from 'react';

// 요청 하나를 불러오고, 실패하면 다시 시도할 수 있게 한다
// data가 undefined면 불러오는 중, null이면 실패
export const useLoad = <T>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null | undefined>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetcher()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch(() => {
        if (!ignore) setData(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
    // fetcher는 바뀌지 않는 API 함수라 다시 시도할 때만 새로 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    setData(undefined);
    setAttempt((current) => current + 1);
  };

  return { data, retry, setData };
};

export type Loaded<T> = ReturnType<typeof useLoad<T>>;
