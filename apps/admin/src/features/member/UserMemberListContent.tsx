import { useEffect, useState } from 'react';
import {
  Button,
  DateRangePicker,
  SearchField,
  SelectField,
  StatusBadge,
} from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';

import { ApiError } from '@admin/api/client';
import {
  getMembers,
  type MemberPage,
  type MemberSortKey,
} from '@admin/api/members';
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
  type TableSortDirection,
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

const columns: DataTableColumn[] = [
  { key: 'memberId', label: '회원 ID', minWidth: 120 },
  { key: 'nickname', label: '닉네임', minWidth: 150 },
  { key: 'status', label: '상태', minWidth: 100 },
  { key: 'joinedAt', label: '가입일', minWidth: 120 },
  { key: 'lastLoginAt', label: '최근 로그인일', minWidth: 160 },
];
const statusMeta = {
  ACTIVE: { label: '활성', variant: 'success' },
  SUSPENDED: { label: '정지', variant: 'warning' },
  WITHDRAWN: { label: '탈퇴', variant: 'danger' },
} as const;

interface UserMemberListContentProps {
  initialMemberId?: string;
  onReviewEnd?: () => void;
}

export const UserMemberListContent = ({
  initialMemberId,
  onReviewEnd,
}: UserMemberListContentProps) => {
  const [targetId, setTargetId] = useState(initialMemberId);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
    useDebouncedSearch({ onCommit: () => setPage(1) });
  const [status, setStatus] = useState('ALL');
  const [dates, setDates] = useState({ startDate: '', endDate: '' });
  const [density, setDensity] = useState<TableDensity>('normal');
  const [sort, setSort] = useState<{
    key: MemberSortKey;
    direction: TableSortDirection;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: MemberPage;
    error?: string;
  } | null>(null);

  // 화면 페이지는 1부터 표시하고 API는 0부터 받으므로 요청할 때만 1을 뺀다.
  const query = new URLSearchParams({
    page: String(page - 1),
    size: String(size),
  });
  // 닉네임 전용 검색 계약에 따라 keyword만 보내고 전달받은 검토 대상 ID는 검색어로 사용하지 않는다.
  if (keyword.trim()) query.set('keyword', keyword.trim());
  if (status !== 'ALL') query.set('status', status);
  if (dates.startDate) query.set('joinedFrom', dates.startDate);
  if (dates.endDate) query.set('joinedTo', dates.endDate);
  if (sort) {
    query.set('sortBy', sort.key);
    query.set('sortDir', sort.direction);
  }
  const queryString = query.toString();
  // 같은 조건으로 재시도해도 별도 요청으로 구분해 이전 오류 대신 로딩 상태를 표시한다.
  const requestKey = `${queryString}:${retry}`;
  const validationError =
    dates.startDate && dates.endDate && dates.startDate > dates.endDate
      ? '가입일 시작 날짜는 종료 날짜보다 늦을 수 없습니다.'
      : undefined;

  useEffect(() => {
    if (validationError) return;
    const controller = new AbortController();
    // 조건이 바뀌거나 화면을 떠나면 이전 요청을 취소해 늦은 응답이 새 목록을 덮지 않게 한다.
    void getMembers(queryString, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            error:
              error instanceof ApiError
                ? error.message
                : '서버에 연결하지 못했습니다. 다시 시도해 주세요.',
          });
      },
    );
    return () => controller.abort();
  }, [queryString, requestKey, validationError]);

  // 현재 조건에 해당하는 응답만 표시해 새 검색을 기다리는 동안 이전 목록을 새 결과처럼 보여 주지 않는다.
  const currentResult = result?.key === requestKey ? result : null;
  const error = validationError ?? currentResult?.error;
  const loading = !validationError && !currentResult;
  const data = currentResult?.data;
  const pagination = {
    currentPage: page,
    pageSize: size,
    // 현재 페이지 항목 수가 아닌 서버 전체 건수로 페이지 수를 계산한다.
    totalCount: data?.totalElements ?? 0,
    totalPages: Math.ceil((data?.totalElements ?? 0) / size),
    onPageChange: setPage,
    onPageSizeChange: (value: number) => {
      setPage(1);
      setSize(value);
    },
  };
  const changeSort = (key: MemberSortKey) => {
    setPage(1);
    // 세 번째 클릭은 정렬 옵션을 제거해 서버 기본 정렬인 가입일 내림차순으로 돌아간다.
    setSort((current) =>
      current?.key !== key
        ? { key, direction: 'desc' }
        : current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null,
    );
  };

  return (
    <>
      {targetId && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-surface p-4">
          <div>
            <p className="text-body-sm-web text-text-primary">
              사용자 확인 대상 · {targetId}
            </p>
            <p className="mt-1 text-caption-web text-text-secondary">
              닉네임으로 검색한 뒤 회원 ID를 확인해 주세요.
            </p>
          </div>
          <Button
            variant="neutral"
            onClick={() => {
              setTargetId(undefined);
              setPage(1);
              resetSearch();
              setStatus('ALL');
              setDates({ startDate: '', endDate: '' });
              setSort(null);
              onReviewEnd?.();
            }}
          >
            확인 대상 지우기
          </Button>
        </div>
      )}
      <FilterBar
        tableKey="members.users"
        className="mb-2 mt-3"
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        <SearchField
          aria-label="닉네임 검색"
          placeholder="닉네임을 입력하세요"
          value={draftKeyword}
          onChange={(event) => setDraftKeyword(event.target.value)}
        />
        <SelectField
          fitContent
          aria-label="회원 상태"
          options={[
            { label: '전체', value: 'ALL' },
            { label: '활성', value: 'ACTIVE' },
            { label: '정지', value: 'SUSPENDED' },
            { label: '탈퇴', value: 'WITHDRAWN' },
          ]}
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
        />
        <div className="w-[216px]">
          <DateRangePicker
            aria-label="가입일 범위"
            value={dates}
            onValueChange={(value) => {
              setPage(1);
              setDates(value);
            }}
          />
        </div>
      </FilterBar>
      <DataTable
        className="table-fixed"
        personalizationKey="members.users"
        columns={columns}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <TableHeaderCell
                key={column.key}
                columnIndex={index}
                onSortChange={
                  column.key === 'status'
                    ? undefined
                    : () => changeSort(column.key as MemberSortKey)
                }
                sortDirection={
                  sort?.key === column.key ? sort?.direction : undefined
                }
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <TableLoading colSpan={5} />
            </tr>
          ) : error ? (
            <tr>
              <TableError colSpan={5} description={error} />
            </tr>
          ) : !data?.items.length ? (
            <tr>
              <TableEmpty colSpan={5}>조회된 회원이 없습니다</TableEmpty>
            </tr>
          ) : (
            data.items.map((member) => (
              <TableRow key={member.memberId}>
                <TableCell>{member.memberId}</TableCell>
                <TableCell>
                  {member.status === 'WITHDRAWN'
                    ? '탈퇴한회원'
                    : member.nickname || '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge variant={statusMeta[member.status].variant}>
                    {statusMeta[member.status].label}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {member.joinedAt ? formatDate(member.joinedAt) : '-'}
                </TableCell>
                <TableCell>
                  {member.lastLoginAt
                    ? formatDateTime(member.lastLoginAt)
                    : '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
      {error && !validationError && (
        <Button
          className="mt-3 self-start"
          variant="neutral"
          onClick={() => setRetry((value) => value + 1)}
        >
          다시 시도
        </Button>
      )}
      <PaginationSummary {...pagination} />
    </>
  );
};
