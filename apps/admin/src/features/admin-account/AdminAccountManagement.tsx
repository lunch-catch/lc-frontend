import { useMemo, useState } from 'react';
import { Button, SearchField, SelectField } from '@repo/ui';
import { Plus } from 'lucide-react';

import {
  type AdminAccountRole,
  type IssuedAdminAccount,
} from '@admin/api/adminAccounts';
import { useAdminAuth } from '@admin/auth/useAdminAuth';
import {
  queryChoice,
  queryPage,
  queryPageSize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import { AdminAccountIssueModal } from './AdminAccountIssueModal';
import { adminAccountRoleOptions } from './adminAccountOptions';
import { useIssueAdminAccount } from './useIssueAdminAccount';

const accountColumns: DataTableColumn[] = [
  { key: 'loginId', label: '관리자 ID', minWidth: 140, width: '40%' },
  { key: 'name', label: '이름', minWidth: 120, width: '30%' },
  { key: 'role', label: '권한', minWidth: 130, width: '30%' },
];

const roleOptions = [
  { label: '전체 권한', value: 'ALL' },
  ...adminAccountRoleOptions,
];

const roleMeta: Record<AdminAccountRole, string> = {
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
};

const accountQuery = {
  keyword: queryText(),
  role: queryChoice(['ALL', 'ADMIN', 'SUPER_ADMIN'] as const, 'ALL'),
  page: queryPage,
  size: queryPageSize(10),
};
export const AdminAccountManagement = () => {
  const columnSettings = useTableColumnSettings(
    'admin-accounts',
    accountColumns,
  );
  const { role: currentRole } = useAdminAuth();
  const canIssueAccount = currentRole === 'SUPER_ADMIN';
  // 목록 조회 계약은 없으므로 이번 화면에서 발급한 응답만 보관한다.
  const [accounts, setAccounts] = useState<IssuedAdminAccount[]>([]);
  const { filters, updateFilters } = useUrlFilters('accounts.', accountQuery);
  const { page: currentPage, size: pageSize, role } = filters;
  const issue = useIssueAdminAccount(canIssueAccount, (issued) => {
    setAccounts((current) => [issued, ...current]);
    updateFilters({ page: 1 }, true);
  });
  const { notice } = issue;
  const { draftKeyword, keyword, setDraftKeyword } = useUrlSearch(
    filters.keyword,
    (keyword) => updateFilters({ keyword, page: 1 }),
  );
  const [density, setDensity] = useState<TableDensity>('normal');

  const filteredAccounts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [account.loginId, account.name].some((value) =>
          value.toLowerCase().includes(normalizedKeyword),
        );
      const matchesRole = role === 'ALL' || account.role === role;

      return matchesKeyword && matchesRole;
    });
  }, [accounts, keyword, role]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize);
  const visibleAccounts = filteredAccounts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const pagination = {
    currentPage,
    onPageChange: (page: number) => updateFilters({ page }),
    onPageSizeChange: (value: number) => {
      // 개수를 바꾸면 기존 페이지가 범위를 벗어날 수 있어 첫 페이지로 돌아간다.
      updateFilters({ page: 1, size: value });
    },
    pageSize,
    totalCount: filteredAccounts.length,
    totalPages,
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-display-web font-semibold text-text-primary">
            계정 관리
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            관리자 계정을 발급합니다. 계정 발급은 최고 관리자만 가능합니다.
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

      <p className="mb-4 text-caption-web text-text-secondary">
        이 화면에서 발급한 계정만 표시합니다.
      </p>
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
        pagination={pagination}
      >
        <SearchField
          onChange={(event) => setDraftKeyword(event.target.value)}
          placeholder="관리자 ID 또는 이름 검색"
          value={draftKeyword}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            updateFilters({ page: 1, role: value as typeof role });
          }}
          options={roleOptions}
          value={role}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
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
            {visibleAccounts.length === 0 ? (
              <tr>
                <TableEmpty colSpan={3}>검색 결과가 없습니다</TableEmpty>
              </tr>
            ) : (
              visibleAccounts.map((account) => (
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
        <PaginationSummary {...pagination} />
      </div>

      <AdminAccountIssueModal canIssueAccount={canIssueAccount} issue={issue} />
    </section>
  );
};
