import { useMemo, useState } from 'react';
import {
  Button,
  Input,
  Radio,
  SearchField,
  SelectField,
  StatusBadge,
} from '@repo/ui';
import { Plus } from 'lucide-react';

import { initialAdminAccounts } from '@admin/api/mocks/adminAccounts';
import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import type {
  AdminAccount,
  AdminAccountRole,
  AdminAccountStatus,
} from './adminAccountTypes';

interface AccountForm {
  id: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  role: AdminAccountRole;
}

interface AccountFormErrors {
  id?: string;
  name?: string;
  password?: string;
  passwordConfirmation?: string;
}

const accountColumns: DataTableColumn[] = [
  { minWidth: 140, width: '22%' },
  { minWidth: 120, width: '18%' },
  { minWidth: 130, width: '20%' },
  { minWidth: 120, width: '18%' },
  { minWidth: 180, width: '22%' },
];

const issueRoleOptions: { label: string; value: AdminAccountRole }[] = [
  { label: '관리자', value: 'ADMIN' },
  { label: '운영자', value: 'OPERATOR' },
];

const roleOptions = [{ label: '전체 권한', value: 'ALL' }, ...issueRoleOptions];

const statusOptions = [
  { label: '전체 상태', value: 'ALL' },
  { label: '활성', value: 'ACTIVE' },
  { label: '정지', value: 'SUSPENDED' },
];

const roleMeta: Record<AdminAccountRole, string> = {
  ADMIN: '관리자',
  OPERATOR: '운영자',
};

const statusMeta: Record<
  AdminAccountStatus,
  { label: string; variant: 'success' | 'warning' }
> = {
  ACTIVE: { label: '활성', variant: 'success' },
  SUSPENDED: { label: '정지', variant: 'warning' },
};

const emptyForm: AccountForm = {
  id: '',
  name: '',
  password: '',
  passwordConfirmation: '',
  role: 'OPERATOR',
};

export const AdminAccountManagement = () => {
  const [accounts, setAccounts] = useState(initialAdminAccounts);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<AccountFormErrors>({});
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
    setForm(emptyForm);
    setFormErrors({});
    setIsIssueModalOpen(false);
  };

  const handleIssue = () => {
    const nextErrors: AccountFormErrors = {};
    const accountId = form.id.trim().toUpperCase();
    const accountName = form.name.trim();

    if (!accountId) {
      nextErrors.id = '관리자 ID를 입력해 주세요.';
    } else if (!/^[A-Z0-9-]{4,20}$/.test(accountId)) {
      nextErrors.id = '영문 대문자, 숫자, 하이픈 4~20자로 입력해 주세요.';
    } else if (accounts.some((account) => account.id === accountId)) {
      nextErrors.id = '이미 사용 중인 관리자 ID입니다.';
    }

    if (!accountName) {
      nextErrors.name = '관리자 이름을 입력해 주세요.';
    }

    if (form.password.length < 8) {
      nextErrors.password = '비밀번호는 8자 이상으로 입력해 주세요.';
    }

    if (!form.passwordConfirmation) {
      nextErrors.passwordConfirmation = '비밀번호를 다시 입력해 주세요.';
    } else if (form.password !== form.passwordConfirmation) {
      nextErrors.passwordConfirmation = '비밀번호가 일치하지 않습니다.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const createdAt = new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .replace('T', ' ');

    const issuedAccount: AdminAccount = {
      createdAt,
      id: accountId,
      name: accountName,
      role: form.role,
      status: 'ACTIVE',
    };

    setAccounts((currentAccounts) => [issuedAccount, ...currentAccounts]);
    setCurrentPage(1);
    closeIssueModal();
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
            관리자 계정을 발급하고 권한 및 상태를 조회할 수 있습니다.
          </p>
        </div>
        <Button
          leadingIcon={<Plus aria-hidden="true" className="size-4" />}
          onClick={() => setIsIssueModalOpen(true)}
        >
          관리자 계정 발급
        </Button>
      </header>

      <FilterBar
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
        <DataTable columns={accountColumns} density={density}>
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
                    <TableCell>{account.createdAt}</TableCell>
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
        open={isIssueModalOpen}
        title="관리자 계정 발급"
      >
        <div className="flex flex-col gap-5">
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
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                password: event.target.value,
              }));
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                password: undefined,
              }));
            }}
            type="password"
            value={form.password}
          />
          <Input
            autoComplete="new-password"
            errorMessage={formErrors.passwordConfirmation}
            label="비밀번호 확인"
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
            <Button onClick={handleIssue}>발급</Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
