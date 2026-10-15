import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/** 입력 중에는 로컬 상태만 바꾸고 확정된 검색어만 URL에 저장한다. */
export const useUrlSearch = (
  keyword: string,
  onCommit: (value: string) => void,
) => {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const [draft, setDraft] = useState({ source: key, pathname, value: keyword });
  // 같은 화면의 필터 변경은 초안을 유지하고, 방문 기록 이동·화면 전환은 URL 값으로 복원한다.
  const restoreFromUrl =
    draft.pathname !== pathname ||
    (draft.source !== key && navigationType === 'POP');
  const draftKeyword = restoreFromUrl ? keyword : draft.value;
  if (draft.source !== key || draft.pathname !== pathname) {
    setDraft({ source: key, pathname, value: draftKeyword });
  }
  const commitRef = useRef(onCommit);
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
    setDraftKeyword: (value: string) =>
      setDraft({ source: key, pathname, value }),
  };
};
