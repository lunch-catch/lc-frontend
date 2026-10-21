import { useState } from 'react';
import { Button, SearchField } from '@repo/ui';
import { Plus } from 'lucide-react';

import type { AdminAccountRole } from '@admin/api/adminAccounts';
import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { queryText } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';

import { AdminAccountIssueModal } from './AdminAccountIssueModal';
import { useAdminAccounts } from './useAdminAccounts';
import { useIssueAdminAccount } from './useIssueAdminAccount';

const accountColumns: DataTableColumn[] = [
  { key: 'loginId', label: '관리자 ID', minWidth: 140, width: '40%' },
  { key: 'name', label: '이름', minWidth: 120, width: '30%' },
  { key: 'role', label: '권한', minWidth: 130, width: '30%' },
];

const roleMeta: Record<AdminAccountRole, string> = {
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
};

const accountQuery = { keyword: queryText() };

export const AdminAccountManagement = () => {
  const columnSettings = useTableColumnSettings(
    'admin-accounts',
    accountColumns,
  );
  const { role: currentRole } = useAdminAuth();
  const canIssueAccount = currentRole === 'SUPER_ADMIN';
  const { filters, updateFilters } = useUrlFilters('accounts.', accountQuery);
  const { draftKeyword, keyword, setDraftKeyword } = useUrlSearch(
    filters.keyword,
    (keyword) => updateFilters({ keyword }),
  );
  const [density, setDensity] = useState<TableDensity>('normal');

  const list = useAdminAccounts(keyword, canIssueAccount);
  // 발급한 계정도 현재 검색 조건에 맞을 때만 서버 목록에 표시한다.
  const issue = useIssueAdminAccount(
    canIssueAccount && !list.forbidden,
    list.refresh,
  );
  const { notice } = issue;

  if (list.forbidden)
    return (
      <p role="alert" className="text-body-sm-web text-status-danger-fg">
        관리자 계정 목록에 접근할 권한이 없습니다.
      </p>
    );

  return (
    <section className="flex flex-col">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-display-web font-semibold text-text-primary">
            계정 관리
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            활성 관리자 계정을 최근 발급순으로 조회하고 새 계정을 발급합니다.
          </p>
        </div>
        {canIssueAccount && (
          <Button
            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
            onClick={issue.openIssueModal}
          >
            관리자 계정 발급
          </Button>
        )}
      </header>

      {notice && (
        <p
          role="status"
          className="mb-4 text-body-sm-web text-status-success-fg"
        >
          {notice}
        </p>
      )}

      <FilterBar
        columnSettings={columnSettings}
        className="mb-4 shrink-0"
        density={{ value: density, onValueChange: setDensity }}
      >
        <SearchField
          onChange={(event) => setDraftKeyword(event.target.value)}
          placeholder="관리자 ID 또는 이름 검색"
          value={draftKeyword}
        />
      </FilterBar>

      <div
        aria-busy={list.loading}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <DataTable
          columnSettings={columnSettings}
          columns={accountColumns}
          density={density}
        >
          <thead>
            <tr>
              <TableHeaderCell columnIndex={0}>관리자 ID</TableHeaderCell>
              <TableHeaderCell columnIndex={1}>이름</TableHeaderCell>
              <TableHeaderCell columnIndex={2}>권한</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {list.loading ? (
              <tr>
                <TableLoading colSpan={3} />
              </tr>
            ) : list.error ? (
              <tr>
                <TableError
                  colSpan={3}
                  description={list.error}
                  onRetry={list.refresh}
                  retryDisabled={list.isWaiting}
                />
              </tr>
            ) : list.accounts.length === 0 ? (
              <tr>
                <TableEmpty colSpan={3}>
                  {keyword.trim()
                    ? '검색 결과가 없습니다.'
                    : '조회된 관리자 계정이 없습니다.'}
                </TableEmpty>
              </tr>
            ) : (
              list.accounts.map((account) => (
                <TableRow key={account.loginId}>
                  <TableCell className="font-medium text-text-primary">
                    {account.loginId}
                  </TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{roleMeta[account.role]}</TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </DataTable>
        {!list.loading && !list.error && (
          <p className="text-caption-web text-text-secondary">
            총 {list.accounts.length}개
          </p>
        )}
      </div>

      <AdminAccountIssueModal canIssueAccount={canIssueAccount} issue={issue} />
    </section>
  );
};
