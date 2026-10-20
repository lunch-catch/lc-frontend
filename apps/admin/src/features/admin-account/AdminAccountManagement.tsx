import { useMemo, useRef, useState } from 'react';
import { Button, Input, Radio, SearchField, SelectField } from '@repo/ui';
import { Plus } from 'lucide-react';

import {
  type AdminAccountRole,
  issueAdminAccount,
  type IssuedAdminAccount,
} from '@admin/api/adminAccounts';
import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';
import {
  queryChoice,
  queryPage,
  queryPageSize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
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

import type {
  AdminAccountForm,
  AdminAccountFormErrors,
} from './adminAccountTypes';
import { validateAdminAccount } from './adminAccountValidation';

const accountColumns: DataTableColumn[] = [
  { key: 'loginId', label: '관리자 ID', minWidth: 140, width: '40%' },
  { key: 'name', label: '이름', minWidth: 120, width: '30%' },
  { key: 'role', label: '권한', minWidth: 130, width: '30%' },
];

const issueRoleOptions: { label: string; value: AdminAccountRole }[] = [
  { label: '관리자', value: 'ADMIN' },
  { label: '최고 관리자', value: 'SUPER_ADMIN' },
];

const roleOptions = [{ label: '전체 권한', value: 'ALL' }, ...issueRoleOptions];

const roleMeta: Record<AdminAccountRole, string> = {
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
};

const emptyForm: AdminAccountForm = {
  id: '',
  name: '',
  password: '',
  passwordConfirmation: '',
  role: 'ADMIN',
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
  const [form, setForm] = useState<AdminAccountForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<AdminAccountFormErrors>({});
  const [isIssuing, setIsIssuing] = useState(false);
  const issuingRef = useRef(false);
  const [notice, setNotice] = useState('');
  const {
    errorMessage,
    isWaiting,
    retryAfterSeconds,
    reportError,
    clearError,
  } = useRequestFeedback();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
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

  const closeIssueModal = () => {
    if (issuingRef.current) return;
    setForm(emptyForm);
    setFormErrors({});
    clearError();
    setIsIssueModalOpen(false);
  };

  const handleIssue = async () => {
    // 버튼 표시 외에도 처리 시점의 권한을 확인한다. 서버에서도 검증이 필요하다.
    if (!canIssueAccount || issuingRef.current || isWaiting) return;
    const nextErrors = validateAdminAccount(form);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    issuingRef.current = true;
    setIsIssuing(true);
    clearError();
    setNotice('');
    try {
      // 비밀번호 확인은 화면에서만 검증하고 API 계약의 필드만 전달한다.
      const issued = await issueAdminAccount({
        loginId: form.id,
        initialPassword: form.password,
        name: form.name.trim(),
        role: form.role,
      });
      setAccounts((current) => [issued, ...current]);
      updateFilters({ page: 1 }, true);
      setForm(emptyForm);
      setFormErrors({});
      setIsIssueModalOpen(false);
      setNotice('관리자 계정이 발급되었습니다.');
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.code === 'ADMIN-001'
      )
        setFormErrors({ id: error.message });
      reportError(error);
    } finally {
      issuingRef.current = false;
      setIsIssuing(false);
    }
  };

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
            onClick={() => setIsIssueModalOpen(true)}
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
              <TableEmpty colSpan={3}>검색 결과가 없습니다</TableEmpty>
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

      <AdminModal
        onClose={closeIssueModal}
        open={isIssueModalOpen && canIssueAccount}
        title="관리자 계정 발급"
      >
        <fieldset disabled={isIssuing} className="flex flex-col gap-5">
          <Input
            errorMessage={formErrors.id}
            label="관리자 ID"
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                id: event.target.value,
              }));
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                id: undefined,
              }));
            }}
            placeholder="예: ADM-005"
            value={form.id}
          />
          <Input
            errorMessage={formErrors.name}
            label="이름"
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }));
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                name: undefined,
              }));
            }}
            value={form.name}
          />
          <Input
            autoComplete="new-password"
            errorMessage={formErrors.password}
            label="비밀번호"
            onBlur={() => {
              // 확인란을 아직 입력하지 않았다면 원본 비밀번호에서 이동할 때 불일치 오류를 표시하지 않는다.
              if (!form.passwordConfirmation) return;
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                passwordConfirmation:
                  validateAdminAccount(form).passwordConfirmation,
              }));
            }}
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                password: event.target.value,
              }));
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                password: undefined,
                // 원본 비밀번호가 바뀌면 기존 불일치 결과도 숨기고 blur 또는 제출에서 다시 검사한다.
                passwordConfirmation: undefined,
              }));
            }}
            type="password"
            value={form.password}
          />
          <Input
            autoComplete="new-password"
            errorMessage={formErrors.passwordConfirmation}
            label="비밀번호 확인"
            onBlur={() => {
              // 입력 중에는 숨긴 확인 오류를 입력란에서 벗어날 때 현재 두 비밀번호로 다시 판단한다.
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                passwordConfirmation:
                  validateAdminAccount(form).passwordConfirmation,
              }));
            }}
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                passwordConfirmation: event.target.value,
              }));
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                passwordConfirmation: undefined,
              }));
            }}
            type="password"
            value={form.passwordConfirmation}
          />
          <div className="flex flex-col">
            <span className="mb-3 text-caption-web font-medium text-text-primary">
              권한
            </span>
            <div
              aria-label="권한"
              className="flex items-center gap-4"
              role="radiogroup"
            >
              {issueRoleOptions.map((option) => (
                <Radio
                  checked={form.role === option.value}
                  key={option.value}
                  label={option.label}
                  name="admin-account-role"
                  onChange={() =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      role: option.value,
                    }))
                  }
                  value={option.value}
                />
              ))}
            </div>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button onClick={closeIssueModal} variant="neutral">
              취소
            </Button>
            <Button
              onClick={handleIssue}
              isLoading={isIssuing}
              disabled={isWaiting}
            >
              {isWaiting ? `${retryAfterSeconds}초 후 발급` : '발급'}
            </Button>
          </div>
          {errorMessage && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {errorMessage}
            </p>
          )}
        </fieldset>
      </AdminModal>
    </section>
  );
};
