import type {
  DataTableColumn,
  TableColumnSettingsState,
} from './dataTableTypes';
import { useTableColumnPreferences } from './useTableColumnPreferences';

// 필터바의 설정 버튼과 테이블이 같은 상태를 사용해야 적용 즉시 열 순서와 표시가 함께 바뀐다.
// tableKey는 저장 영역을, 각 열의 key는 저장된 열을 식별하므로 화면 문구가 바뀌어도 유지해야 한다.
export const useTableColumnSettings = (
  tableKey: string,
  columns: DataTableColumn[],
): TableColumnSettingsState => {
  const fields = columns.map((column) => ({
    key: column.key ?? column.label ?? '',
    label: column.label ?? '',
  }));
  return {
    fields,
    ...useTableColumnPreferences(
      'admin.table.columns.' + tableKey,
      fields.map((field) => field.key),
    ),
  };
};
