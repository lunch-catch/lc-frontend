import { useEffect, useRef, useState } from 'react';

interface DebouncedSearchOptions {
  delay?: number;
  onCommit?: (keyword: string) => void;
}

/** 입력값과 검색에 반영할 값을 분리해 입력이 멈춘 뒤에만 목록을 갱신한다. */
export const useDebouncedSearch = ({
  delay = 300,
  onCommit,
}: DebouncedSearchOptions = {}) => {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const timerRef = useRef<number | undefined>(undefined);
  const onCommitRef = useRef(onCommit);

  // 콜백이 바뀌어도 입력 타이머는 다시 시작하지 않고, 실행 시 최신 콜백을 사용한다.
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (draftKeyword === keyword) return;

    const timer = window.setTimeout(() => {
      timerRef.current = undefined;
      setKeyword(draftKeyword);
      onCommitRef.current?.(draftKeyword);
    }, delay);
    timerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [delay, draftKeyword, keyword]);

  const resetSearch = () => {
    // 초기화는 즉시 반영하고 이전 입력의 지연 검색이 나중에 실행되지 않도록 취소한다.
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setDraftKeyword('');
    setKeyword('');
  };

  return { draftKeyword, keyword, setDraftKeyword, resetSearch };
};
