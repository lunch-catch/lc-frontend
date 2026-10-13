import { useMemo, useState } from 'react';
import {
  DateRangePicker,
  SearchField,
  SelectField,
  StatusBadge,
  Tabs,
} from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';

import { mockOwners } from '@admin/api/mocks/owners';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableColumnSettingsState,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
  useTableColumnSettings,
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import type { MemberStatus, MemberType, Owner } from './memberTypes';
import { getMaskedValue, isIncludedInDateRange } from './memberUtils';
import { UserMemberListContent } from './UserMemberListContent';

interface OwnerSort {
  direction: TableSortDirection;
  key: keyof Owner;
}

const statusOptions = [
  { label: '전체', value: 'ALL' },
  { label: '활성', value: 'ACTIVE' },
  { label: '정지', value: 'SUSPENDED' },
  { label: '탈퇴', value: 'WITHDRAWN' },
];

const memberTabs = [
  { label: '점주 목록', value: 'owner' },
  { label: '사용자 목록', value: 'member' },
];

const statusMeta: Record<
  MemberStatus,
  { label: string; variant: 'danger' | 'success' | 'warning' }
> = {
  ACTIVE: { label: '활성', variant: 'success' },
  SUSPENDED: { label: '정지', variant: 'warning' },
  WITHDRAWN: { label: '탈퇴', variant: 'danger' },
};

const ownerTableColumns: DataTableColumn[] = [
  { key: 'id', label: '회원 ID', minWidth: 130, width: '16%' },
  { key: 'storeName', label: '상호', minWidth: 150, width: '22%' },
  { key: 'status', label: '상태', minWidth: 120, width: '14%' },
  {
    key: 'storeRegistrationCompleted',
    label: '가게 최종 등록',
    minWidth: 140,
    width: '18%',
  },
  { key: 'joinedAt', label: '가입일', minWidth: 120, width: '15%' },
  { key: 'lastAccessedAt', label: '최근 접속일', minWidth: 140, width: '15%' },
];

const getOwnerSortValue = (owner: Owner, key: keyof Owner) =>
  key === 'storeName'
    ? getMaskedValue(owner.storeName, owner.status)
    : String(owner[key]);

interface MemberManagementContentProps {
  initialMemberId?: string;
  // URL을 기준으로 제어해 뒤로 가기·앞으로 가기에서도 선택 탭이 일치하도록 한다.
  activeTab?: MemberType;
  onReviewEnd?: (tab: MemberType) => void;
}

export const MemberManagementContent = ({
  initialMemberId,
  activeTab = 'owner',
  onReviewEnd,
}: MemberManagementContentProps) => {
  const columnSettings = useTableColumnSettings(
    'members.owners',
    ownerTableColumns,
  );
  const [targetMemberId, setTargetMemberId] = useState(initialMemberId);
  const [currentPage, setCurrentPage] = useState(1);
  const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
    useDebouncedSearch({ onCommit: () => setCurrentPage(1) });
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tableDensity, setTableDensity] = useState<TableDensity>('normal');
  const [pageSize, setPageSize] = useState(20);
  const [ownerSort, setOwnerSort] = useState<OwnerSort | null>(null);

  const filteredOwners = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const matchedOwners = mockOwners.filter((owner) => {
      const isMatchedStatus = status === 'ALL' || owner.status === status;
      // 탈퇴 회원의 원본 가게 정보는 목록뿐 아니라 검색 대상에서도 제외한다.
      const searchableValues =
        owner.status === 'WITHDRAWN'
          ? [owner.id]
          : [owner.id, owner.storeName, owner.businessNumber];
      const isMatchedKeyword =
        !normalizedKeyword ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedKeyword),
        );

      return (
        isMatchedStatus &&
        isMatchedKeyword &&
        isIncludedInDateRange(owner.joinedAt, startDate, endDate)
      );
    });

    if (!ownerSort) {
      return matchedOwners;
    }

    return [...matchedOwners].sort((firstOwner, secondOwner) => {
      const comparison = getOwnerSortValue(
        firstOwner,
        ownerSort.key,
      ).localeCompare(getOwnerSortValue(secondOwner, ownerSort.key), 'ko');

      return ownerSort.direction === 'asc' ? comparison : -comparison;
    });
  }, [endDate, keyword, ownerSort, startDate, status]);

  const activeList = filteredOwners;
  const totalPages = Math.ceil(activeList.length / pageSize);
  const visibleList = activeList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleTabChange = (nextTab: string) => {
    if (nextTab === activeTab) return;
    onReviewEnd?.(nextTab as MemberType);
    setTargetMemberId(undefined);
    // 점주와 사용자의 검색 대상이 달라 탭 전환 시 이전 조회 조건을 넘기지 않는다.
    setCurrentPage(1);
    resetSearch();
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setOwnerSort(null);
  };

  const handleOwnerSortChange = (nextKey: keyof Owner) => {
    setCurrentPage(1);
    setOwnerSort((currentSort) => {
      if (!currentSort || currentSort.key !== nextKey) {
        return { direction: 'desc', key: nextKey };
      }

      return currentSort.direction === 'desc'
        ? { direction: 'asc', key: nextKey }
        : null;
    });
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
    totalCount: activeList.length,
    totalPages,
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4 shrink-0">
        <h2 className="text-display-web font-semibold text-text-primary">
          회원 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          점주와 사용자의 계정 상태 및 가입 정보를 조회할 수 있습니다.
        </p>
      </header>

      <Tabs
        items={memberTabs}
        onValueChange={handleTabChange}
        value={activeTab}
      />

      {activeTab === 'owner' ? (
        <>
          <FilterBar
            columnSettings={columnSettings}
            className="mb-2 mt-3 shrink-0"
            density={{ value: tableDensity, onValueChange: setTableDensity }}
            pagination={pagination}
          >
            <SearchField
              onChange={(event) => setDraftKeyword(event.target.value)}
              value={draftKeyword}
            />
            <SelectField
              fitContent
              onValueChange={(nextStatus) => {
                setCurrentPage(1);
                setStatus(nextStatus);
              }}
              options={statusOptions}
              value={status}
            />
            <DateRangePicker
              aria-label="가입일 범위"
              onValueChange={({
                endDate: nextEndDate,
                startDate: nextStartDate,
              }) => {
                setCurrentPage(1);
                setStartDate(nextStartDate);
                setEndDate(nextEndDate);
              }}
              value={{ endDate, startDate }}
            />
          </FilterBar>

          <OwnerTable
            columnSettings={columnSettings}
            members={visibleList}
            density={tableDensity}
            onSortChange={(key) => handleOwnerSortChange(key as keyof Owner)}
            sortDirection={ownerSort?.direction}
            sortKey={ownerSort?.key}
          />
          <PaginationSummary {...pagination} />
        </>
      ) : (
        <UserMemberListContent
          initialMemberId={targetMemberId}
          onReviewEnd={() => {
            setTargetMemberId(undefined);
            onReviewEnd?.('member');
          }}
        />
      )}
    </section>
  );
};

interface OwnerTableProps {
  columnSettings: TableColumnSettingsState;
  density: TableDensity;
  members: Owner[];
  onSortChange: (key: string) => void;
  sortDirection?: TableSortDirection;
  sortKey?: string;
}
const OwnerTable = ({
  columnSettings,
  density,
  members,
  onSortChange,
  sortDirection,
  sortKey,
}: OwnerTableProps) => (
  <DataTable
    className="table-fixed"
    columnSettings={columnSettings}
    columns={ownerTableColumns}
    density={density}
    resizableColumns
  >
    <thead>
      <tr>
        {ownerTableColumns.map((column, index) => (
          <TableHeaderCell
            key={column.key}
            columnIndex={index}
            onSortChange={() => column.key && onSortChange(column.key)}
            sortDirection={sortKey === column.key ? sortDirection : undefined}
          >
            {column.label}
          </TableHeaderCell>
        ))}
      </tr>
    </thead>
    <tbody>
      {!members.length && (
        <tr>
          <TableEmpty colSpan={6}>??? ??? ????</TableEmpty>
        </tr>
      )}
      {members.map((owner) => (
        <TableRow key={owner.id}>
          <TableCell>{owner.id}</TableCell>
          <TableCell className="font-medium text-text-primary">
            {getMaskedValue(owner.storeName, owner.status)}
          </TableCell>
          <TableCell>
            <StatusBadge variant={statusMeta[owner.status].variant}>
              {statusMeta[owner.status].label}
            </StatusBadge>
          </TableCell>
          <TableCell>
            <StatusBadge
              variant={owner.storeRegistrationCompleted ? 'success' : 'warning'}
            >
              {owner.storeRegistrationCompleted ? '?? ??' : '?? ?? ?'}
            </StatusBadge>
          </TableCell>
          <TableCell>{formatDate(owner.joinedAt)}</TableCell>
          <TableCell>{formatDateTime(owner.lastAccessedAt)}</TableCell>
        </TableRow>
      ))}
    </tbody>
  </DataTable>
);
