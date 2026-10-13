import { useMemo, useRef, useState } from 'react';
import {
  Button,
  Input,
  Radio,
  SearchField,
  SelectField,
  StatusBadge,
} from '@repo/ui';
import { formatDateTime } from '@repo/utils';
import { Plus } from 'lucide-react';

import { issueAdminAccount } from '@admin/api/adminAccounts';
import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

import type {
  AdminAccount,
  AdminAccountForm,
  AdminAccountFormErrors,
  AdminAccountRole,
  AdminAccountStatus,
} from './adminAccountTypes';
import { validateAdminAccount } from './adminAccountValidation';

const accountColumns: DataTableColumn[] = [
  { minWidth: 140, width: '22%' },
  { minWidth: 120, width: '18%' },
  { minWidth: 130, width: '20%' },
  { minWidth: 120, width: '18%' },
  { minWidth: 180, width: '22%' },
];

const issueRoleOptions: { label: string; value: AdminAccountRole }[] = [
  { label: '관리자', value: 'ADMIN' },
  { label: '최고 관리자', value: 'SUPER_ADMIN' },
];

const roleOptions = [{ label: '전체 권한', value: 'ALL' }, ...issueRoleOptions];

const statusOptions = [
  { label: '전체 상태', value: 'ALL' },
  { label: '활성', value: 'ACTIVE' },
  { label: '삭제', value: 'DELETED' },
];

const roleMeta: Record<AdminAccountRole, string> = {
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
};

const statusMeta: Record<
  AdminAccountStatus,
  { label: string; variant: 'success' | 'neutral' }
> = {
  ACTIVE: { label: '활성', variant: 'success' },
  DELETED: { label: '삭제', variant: 'neutral' },
};

const emptyForm: AdminAccountForm = {
  id: '',
  name: '',
  password: '',
  passwordConfirmation: '',
  role: 'ADMIN',
};

export const AdminAccountManagement = () => {
  const { role: currentRole } = useAdminAuth();
  const canIssueAccount = currentRole === 'SUPER_ADMIN';
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<AdminAccountForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<AdminAccountFormErrors>({});
  const [isIssuing, setIsIssuing] = useState(false);
  const issuingRef = useRef(false);
  const [notice, setNotice] = useState('');
  const { errorMessage, isWaiting, reportError, clearError } =
    useRequestFeedback();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const { draftKeyword, keyword, setDraftKeyword } = useDebouncedSearch({
    onCommit: () => setCurrentPage(1),
  });
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<TableDensity>('normal');

  const filteredAccounts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [account.id, account.name].some((value) =>
          value.toLowerCase().includes(normalizedKeyword),
        );
      const matchesRole = role === 'ALL' || account.role === role;
      const matchesStatus = status === 'ALL' || account.status === status;

      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [accounts, keyword, role, status]);

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
      setFormErrors(nextErrors);
      return;
    }

    issuingRef.current = true;
    setIsIssuing(true);
    clearError();
    setNotice('');
    try {
      const issued = await issueAdminAccount(form);
      // 발급 응답에는 생성 시각이 없으므로 클라이언트 시각을 발급일로 만들지 않는다.
      setAccounts((current) => [
        {
          id: issued.loginId,
          name: issued.name,
          role: issued.role,
          status: 'ACTIVE',
          createdAt: '',
        },
        ...current,
      ]);
      setCurrentPage(1);
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
    onPageChange: setCurrentPage,
    onPageSizeChange: (value: number) => {
      // 개수를 바꾸면 기존 페이지가 범위를 벗어날 수 있어 첫 페이지로 돌아간다.
      setCurrentPage(1);
      setPageSize(value);
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
            관리자 권한과 상태를 조회합니다. 계정 발급은 최고 관리자만
            가능합니다.
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
        관리자 목록 조회 API는 아직 연결되지 않았습니다. 이 화면에서 발급한
        계정만 표시합니다.
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
        tableKey="admin-accounts"
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
            setCurrentPage(1);
            setRole(value);
          }}
          options={roleOptions}
          value={role}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            setCurrentPage(1);
            setStatus(value);
          }}
          options={statusOptions}
          value={status}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <DataTable
          personalizationKey="admin-accounts"
          columns={accountColumns.map((column, index) => ({
            ...column,
            key: ['id', 'name', 'role', 'status', 'createdAt'][index],
            label: ['관리자 ID', '이름', '권한', '상태', '발급일'][index],
          }))}
          density={density}
        >
          <thead>
            <tr>
              <TableHeaderCell columnIndex={0}>관리자 ID</TableHeaderCell>
              <TableHeaderCell columnIndex={1}>이름</TableHeaderCell>
              <TableHeaderCell columnIndex={2}>권한</TableHeaderCell>
              <TableHeaderCell columnIndex={3}>상태</TableHeaderCell>
              <TableHeaderCell columnIndex={4}>발급일</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {visibleAccounts.length === 0 ? (
              <TableEmpty colSpan={5}>검색 결과가 없습니다</TableEmpty>
            ) : (
              visibleAccounts.map((account) => {
                const accountStatus = statusMeta[account.status];

                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium text-text-primary">
                      {account.id}
                    </TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{roleMeta[account.role]}</TableCell>
                    <TableCell>
                      <StatusBadge variant={accountStatus.variant}>
                        {accountStatus.label}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{formatDateTime(account.createdAt)}</TableCell>
                  </TableRow>
                );
              })
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
          <p className="text-body-sm-web text-text-secondary">
            발급한 계정은 기본적으로 활성 상태로 등록됩니다.
          </p>
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
              {isWaiting ? '재시도 대기 중' : '발급'}
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
