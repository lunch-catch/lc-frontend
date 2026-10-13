import { useContext } from 'react';

import type {
  DataTableColumn,
  TableColumnSettingsState,
} from './dataTableTypes';
import { TableSettingsAccountContext } from './tableSettingsAccountContext';
import { useTableColumnPreferences } from './useTableColumnPreferences';

// 필터바의 설정 버튼과 테이블이 같은 상태를 사용해야 적용 즉시 열 순서와 표시가 함께 바뀐다.
// tableKey는 저장 영역을, 각 열의 key는 저장된 열을 식별하므로 화면 문구가 바뀌어도 유지해야 한다.
export const useTableColumnSettings = (
  tableKey: string,
  columns: DataTableColumn[],
): TableColumnSettingsState => {
  const adminId = useContext(TableSettingsAccountContext);
  // 계정·테이블별로 구분한다. 소유자를 알 수 없는 기존 공용 설정은 가져오지 않는다.
  // localStorage이므로 다른 기기나 브라우저와는 동기화되지 않는다.
  const storageKey =
    adminId === null ? null : `admin.table.columns.${adminId}.${tableKey}`;
  const fields = columns.map((column) => ({
    key: column.key ?? column.label ?? '',
    label: column.label ?? '',
  }));
  return {
    fields,
    ...useTableColumnPreferences(
      storageKey,
      fields.map((field) => field.key),
    ),
  };
};
