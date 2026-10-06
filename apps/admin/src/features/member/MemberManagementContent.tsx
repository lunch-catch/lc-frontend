import { useMemo, useState } from 'react';
import {
  DateRangePicker,
  SearchField,
  SelectField,
  StatusBadge,
  Tabs,
} from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';

import { mockMembers, mockOwners } from '@admin/api/mocks/members';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import type { Member, MemberStatus, MemberType, Owner } from './memberTypes';
import { getMaskedValue, isIncludedInDateRange } from './memberUtils';

interface OwnerSort {
  direction: TableSortDirection;
  key: keyof Owner;
}

interface MemberSort {
  direction: TableSortDirection;
  key: keyof Member;
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
  { minWidth: 130, width: '16%' },
  { minWidth: 150, width: '22%' },
  { minWidth: 120, width: '14%' },
  { minWidth: 140, width: '18%' },
  { minWidth: 120, width: '15%' },
  { minWidth: 140, width: '15%' },
];

const memberTableColumns: DataTableColumn[] = [
  { minWidth: 120, width: '16%' },
  { minWidth: 150, width: '20%' },
  { minWidth: 100, width: '12%' },
  { minWidth: 90, width: '10%' },
  { minWidth: 100, width: '12%' },
  { minWidth: 120, width: '15%' },
  { minWidth: 140, width: '15%' },
];

const getOwnerSortValue = (owner: Owner, key: keyof Owner) =>
  key === 'storeName'
    ? getMaskedValue(owner.storeName, owner.status)
    : String(owner[key]);

const getMemberSortValue = (member: Member, key: keyof Member) =>
  key === 'nickname'
    ? getMaskedValue(member.nickname, member.status)
    : String(member[key]);

export const MemberManagementContent = () => {
  const [activeTab, setActiveTab] = useState<MemberType>('owner');
  const [currentPage, setCurrentPage] = useState(1);
  const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
    useDebouncedSearch({ onCommit: () => setCurrentPage(1) });
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tableDensity, setTableDensity] = useState<TableDensity>('normal');
  const [pageSize, setPageSize] = useState(20);
  const [ownerSort, setOwnerSort] = useState<OwnerSort | null>(null);
  const [memberSort, setMemberSort] = useState<MemberSort | null>(null);

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

  const filteredMembers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const matchedMembers = mockMembers.filter((member) => {
      const isMatchedStatus = status === 'ALL' || member.status === status;
      // 탈퇴 회원의 원본 닉네임은 목록뿐 아니라 검색 대상에서도 제외한다.
      const searchableValues =
        member.status === 'WITHDRAWN'
          ? [member.id]
          : [member.id, member.nickname];
      const isMatchedKeyword =
        !normalizedKeyword ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedKeyword),
        );

      return (
        isMatchedStatus &&
        isMatchedKeyword &&
        isIncludedInDateRange(member.joinedAt, startDate, endDate)
      );
    });

    if (!memberSort) {
      return matchedMembers;
    }

    return [...matchedMembers].sort((firstMember, secondMember) => {
      const comparison = getMemberSortValue(
        firstMember,
        memberSort.key,
      ).localeCompare(getMemberSortValue(secondMember, memberSort.key), 'ko');

      return memberSort.direction === 'asc' ? comparison : -comparison;
    });
  }, [endDate, keyword, memberSort, startDate, status]);

  const activeList = activeTab === 'owner' ? filteredOwners : filteredMembers;
  const totalPages = Math.ceil(activeList.length / pageSize);
  const visibleList = activeList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleTabChange = (nextTab: string) => {
    // 점주와 사용자의 검색 대상이 달라 탭 전환 시 이전 조회 조건을 넘기지 않는다.
    setActiveTab(nextTab as MemberType);
    setCurrentPage(1);
    resetSearch();
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setOwnerSort(null);
    setMemberSort(null);
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

  const handleMemberSortChange = (nextKey: keyof Member) => {
    setCurrentPage(1);
    setMemberSort((currentSort) => {
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

      <FilterBar
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
        <div className="w-[216px]">
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
        </div>
      </FilterBar>

      {activeTab === 'owner' ? (
        <MemberTable
          members={visibleList as Owner[]}
          density={tableDensity}
          onSortChange={(nextKey) =>
            handleOwnerSortChange(nextKey as keyof Owner)
          }
          sortDirection={ownerSort?.direction}
          sortKey={ownerSort?.key}
          type="owner"
        />
      ) : (
        <MemberTable
          members={visibleList as Member[]}
          density={tableDensity}
          onSortChange={(nextKey) =>
            handleMemberSortChange(nextKey as keyof Member)
          }
          sortDirection={memberSort?.direction}
          sortKey={memberSort?.key}
          type="member"
        />
      )}
      <PaginationSummary {...pagination} />
    </section>
  );
};

interface MemberTableProps {
  density: TableDensity;
  members: Member[] | Owner[];
  onSortChange: (key: string) => void;
  sortDirection?: TableSortDirection;
  sortKey?: string;
  type: MemberType;
}

const MemberTable = ({
  density,
  members,
  onSortChange,
  sortDirection,
  sortKey,
  type,
}: MemberTableProps) => {
  const isOwner = type === 'owner';

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        className="table-fixed"
        columns={isOwner ? ownerTableColumns : memberTableColumns}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            <TableHeaderCell
              columnIndex={0}
              onSortChange={() => onSortChange('id')}
              sortDirection={sortKey === 'id' ? sortDirection : undefined}
            >
              회원 ID
            </TableHeaderCell>
            <TableHeaderCell
              columnIndex={1}
              onSortChange={() =>
                onSortChange(isOwner ? 'storeName' : 'nickname')
              }
              sortDirection={
                sortKey === (isOwner ? 'storeName' : 'nickname')
                  ? sortDirection
                  : undefined
              }
            >
              {isOwner ? '상호' : '닉네임'}
            </TableHeaderCell>
            <TableHeaderCell
              columnIndex={2}
              onSortChange={() => onSortChange('status')}
              sortDirection={sortKey === 'status' ? sortDirection : undefined}
            >
              상태
            </TableHeaderCell>
            {!isOwner && (
              <>
                <TableHeaderCell
                  columnIndex={3}
                  onSortChange={() => onSortChange('gender')}
                  sortDirection={
                    sortKey === 'gender' ? sortDirection : undefined
                  }
                >
                  성별
                </TableHeaderCell>
                <TableHeaderCell
                  columnIndex={4}
                  onSortChange={() => onSortChange('ageGroup')}
                  sortDirection={
                    sortKey === 'ageGroup' ? sortDirection : undefined
                  }
                >
                  연령대
                </TableHeaderCell>
              </>
            )}
            {isOwner && (
              <TableHeaderCell
                columnIndex={3}
                onSortChange={() => onSortChange('storeRegistrationCompleted')}
                sortDirection={
                  sortKey === 'storeRegistrationCompleted'
                    ? sortDirection
                    : undefined
                }
              >
                가게 최종 등록
              </TableHeaderCell>
            )}
            <TableHeaderCell
              columnIndex={isOwner ? 4 : 5}
              onSortChange={() => onSortChange('joinedAt')}
              sortDirection={sortKey === 'joinedAt' ? sortDirection : undefined}
            >
              가입일
            </TableHeaderCell>
            <TableHeaderCell
              columnIndex={isOwner ? 5 : 6}
              onSortChange={() => onSortChange('lastAccessedAt')}
              sortDirection={
                sortKey === 'lastAccessedAt' ? sortDirection : undefined
              }
            >
              최근 접속일
            </TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 && (
            <TableEmpty colSpan={isOwner ? 6 : 7}>
              조회된 회원이 없습니다
            </TableEmpty>
          )}
          {isOwner
            ? (members as Owner[]).map((owner) => {
                const status = statusMeta[owner.status];

                return (
                  <TableRow key={owner.id}>
                    <TableCell>{owner.id}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {getMaskedValue(owner.storeName, owner.status)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={status.variant}>
                        {status.label}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          owner.storeRegistrationCompleted
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {owner.storeRegistrationCompleted
                          ? '등록 완료'
                          : '등록 진행 중'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{formatDate(owner.joinedAt)}</TableCell>
                    <TableCell>
                      {formatDateTime(owner.lastAccessedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            : (members as Member[]).map((member) => {
                const status = statusMeta[member.status];

                return (
                  <TableRow key={member.id}>
                    <TableCell>{member.id}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {getMaskedValue(member.nickname, member.status)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={status.variant}>
                        {status.label}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{member.gender}</TableCell>
                    <TableCell>{member.ageGroup}</TableCell>
                    <TableCell>{formatDate(member.joinedAt)}</TableCell>
                    <TableCell>
                      {formatDateTime(member.lastAccessedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
        </tbody>
      </DataTable>
    </div>
  );
};
