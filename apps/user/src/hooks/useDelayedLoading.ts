import { useEffect, useState } from 'react';

// 응답이 이보다 빠르면 불러오는 중 화면을 보여주지 않는다
const DEFAULT_DELAY_MS = 300;

// 불러오는 중 화면(회색 틀)을 보여줄지
// 불러오기를 시작하자마자 보여주면 응답이 빠를 때 회색 틀이 잠깐 나왔다 사라져 화면이 번쩍여 보인다
// 그래서 불러오는 중인 채로 delayMs가 지난 뒤에만 true가 된다
export const useDelayedLoading = (
  isLoading: boolean,
  delayMs = DEFAULT_DELAY_MS,
) => {
  const [isDelayPassed, setIsDelayPassed] = useState(false);
  // 불러오기가 끝났다가 다시 시작하면 처음부터 기다리도록, 바뀌는 순간 렌더 중에 되돌린다
  const [previousLoading, setPreviousLoading] = useState(isLoading);
  if (previousLoading !== isLoading) {
    setPreviousLoading(isLoading);
    setIsDelayPassed(false);
  }

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => setIsDelayPassed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, isLoading]);

  return isLoading && isDelayPassed;
};
