import { useState } from 'react';

import type { TableColumnPreference } from './dataTableTypes';
import { normalizeColumnPreferences } from './tableColumnPreferences';

export const useTableColumnPreferences = (
  storageKey: string,
  keys: string[],
) => {
  const [preferences, setPreferences] = useState(() => {
    try {
      return normalizeColumnPreferences(
        keys,
        JSON.parse(localStorage.getItem(storageKey) ?? 'null'),
      );
    } catch {
      return normalizeColumnPreferences(keys, null);
    }
  });
  const [storageError, setStorageError] = useState('');
  const applyPreferences = (next: TableColumnPreference[]) => {
    const normalized = normalizeColumnPreferences(keys, next);
    setPreferences(normalized);
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
      setStorageError('');
    } catch {
      setStorageError('설정은 적용했지만 브라우저에 저장하지 못했습니다.');
    }
  };
  return { preferences, applyPreferences, storageError };
};
