import { useState } from 'react';

import type { TableColumnPreference } from './dataTableTypes';
import { normalizeColumnPreferences } from './tableColumnPreferences';

export const useTableColumnPreferences = (
  storageKey: string,
  keys: string[],
) => {
  const signature = JSON.stringify([storageKey, keys]);
  const readPreferences = () => {
    try {
      return normalizeColumnPreferences(
        keys,
        JSON.parse(localStorage.getItem(storageKey) ?? 'null'),
      );
    } catch {
      return normalizeColumnPreferences(keys, null);
    }
  };
  const [state, setState] = useState(() => ({
    signature,
    preferences: readPreferences(),
    storageError: '',
  }));
  // 같은 컴포넌트에서 탭이나 열 정의가 바뀌면 해당 테이블의 저장 설정을 다시 읽는다.
  // 렌더링 중 조건부로 초기화해 이전 테이블의 설정이 화면에 잠깐 표시되는 것을 막는다.
  if (state.signature !== signature) {
    setState({ signature, preferences: readPreferences(), storageError: '' });
  }
  const applyPreferences = (next: TableColumnPreference[]) => {
    const normalized = normalizeColumnPreferences(keys, next);
    let storageError = '';
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    } catch {
      storageError = '설정은 적용했지만 브라우저에 저장하지 못했습니다.';
    }
    // 저장소 접근이 제한되어도 현재 화면의 열 설정은 적용한다.
    setState({ signature, preferences: normalized, storageError });
  };
  return {
    preferences: state.preferences,
    applyPreferences,
    storageError: state.storageError,
  };
};
