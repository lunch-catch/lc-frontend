import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

/** 입력 중에는 로컬 상태만 바꾸고 확정된 검색어만 URL에 저장한다. */
export const useUrlSearch = (
  keyword: string,
  onCommit: (value: string) => void,
) => {
  const { key } = useLocation();
  const [draft, setDraft] = useState({ source: key, value: keyword });
  // 같은 검색어가 있는 다른 방문 기록도 구분해 과거의 미확정 입력이 되살아나지 않게 한다.
  if (draft.source !== key) setDraft({ source: key, value: keyword });
  const commitRef = useRef(onCommit);
  const draftKeyword = draft.source === key ? draft.value : keyword;
  // URL이 바뀌어 콜백이 교체돼도 입력 타이머를 다시 시작하지 않는다.
  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);
  useEffect(() => {
    if (draftKeyword === keyword) return;
    const timer = window.setTimeout(() => commitRef.current(draftKeyword), 300);
    return () => window.clearTimeout(timer);
  }, [draftKeyword, keyword, key]);
  return {
    keyword,
    draftKeyword,
    setDraftKeyword: (value: string) => setDraft({ source: key, value }),
  };
};
