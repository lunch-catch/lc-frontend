import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  SearchField,
  SelectField,
  StatusBadge,
  Toggle,
} from '@repo/ui';
import { RotateCcw } from 'lucide-react';

import {
  DataTable,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { Pagination } from '@admin/components/Pagination/Pagination';

type ApplicationStatus = 'ACTIVE' | 'ONBOARDING';
type ApplicationListState = 'error' | 'loading' | 'success';

interface StoreApplication {
  id: string;
  appliedAt: string;
  businessNumber: string;
  status: ApplicationStatus;
  storeName: string;
}

interface StoreApplicationsPageProps {
  listState?: ApplicationListState;
}

const applications: StoreApplication[] = [
  {
    id: 'APP-012',
    appliedAt: '2026.09.29',
    businessNumber: '123-45-67890',
    status: 'ONBOARDING',
    storeName: '한상차림',
  },
  {
    id: 'APP-011',
    appliedAt: '2026.09.28',
    businessNumber: '234-56-78901',
    status: 'ACTIVE',
    storeName: '오늘의 파스타',
  },
  {
    id: 'APP-010',
    appliedAt: '2026.09.27',
    businessNumber: '345-67-89012',
    status: 'ONBOARDING',
    storeName: '도시락 연구소',
  },
  {
    id: 'APP-009',
    appliedAt: '2026.09.26',
    businessNumber: '456-78-90123',
    status: 'ACTIVE',
    storeName: '미소 카레',
  },
  {
    id: 'APP-008',
    appliedAt: '2026.09.25',
    businessNumber: '567-89-01234',
    status: 'ONBOARDING',
    storeName: '정성 한끼',
  },
  {
    id: 'APP-007',
    appliedAt: '2026.09.24',
    businessNumber: '678-90-12345',
    status: 'ACTIVE',
    storeName: '오후 식당',
  },
  {
    id: 'APP-006',
    appliedAt: '2026.09.23',
    businessNumber: '789-01-23456',
    status: 'ONBOARDING',
    storeName: '바른 덮밥',
  },
  {
    id: 'APP-005',
    appliedAt: '2026.09.22',
    businessNumber: '890-12-34567',
    status: 'ACTIVE',
    storeName: '식탁 위의 봄',
  },
  {
    id: 'APP-004',
    appliedAt: '2026.09.21',
    businessNumber: '901-23-45678',
    status: 'ONBOARDING',
    storeName: '한입 샌드',
  },
  {
    id: 'APP-003',
    appliedAt: '2026.09.20',
    businessNumber: '012-34-56789',
    status: 'ACTIVE',
    storeName: '매일 국밥',
  },
  {
    id: 'APP-002',
    appliedAt: '2026.09.19',
    businessNumber: '135-79-24680',
    status: 'ONBOARDING',
    storeName: '모락모락 김밥',
  },
  {
    id: 'APP-001',
    appliedAt: '2026.09.18',
    businessNumber: '246-80-13579',
    status: 'ACTIVE',
    storeName: '골목 쌀국수',
  },
];

const statusOptions = [
  { label: '상태: 전체', value: 'ALL' },
  { label: '입점 진행 중', value: 'ONBOARDING' },
  { label: '입점 완료', value: 'ACTIVE' },
];

const sortOptions = [
  { label: '최신순', value: 'LATEST' },
  { label: '오래된순', value: 'OLDEST' },
];

const statusMeta: Record<
  ApplicationStatus,
  { label: string; variant: 'success' | 'warning' }
> = {
  ACTIVE: { label: '입점 완료', variant: 'success' },
  ONBOARDING: { label: '입점 진행 중', variant: 'warning' },
};

export const StoreApplicationsPage = ({
  listState = 'success',
}: StoreApplicationsPageProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState('LATEST');
  const [status, setStatus] = useState('ALL');
  const [resetAnimationKey, setResetAnimationKey] = useState(0);
  const [tableDensity, setTableDensity] =
    useState<Extract<TableDensity, 'compact' | 'comfortable'>>('compact');
  const pageSize = 10;

  useEffect(() => {
    // 입력마다 목록을 갱신하지 않도록 검색어 반영을 잠시 지연한다.
    const debounceTimer = window.setTimeout(() => {
      setCurrentPage(1);
      setKeyword(draftKeyword);
    }, 300);

    return () => window.clearTimeout(debounceTimer);
  }, [draftKeyword]);

  const filteredApplications = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const matchedApplications = applications.filter((application) => {
      const isMatchedStatus = status === 'ALL' || application.status === status;
      const isMatchedKeyword =
        !normalizedKeyword ||
        [
          application.id,
          application.storeName,
          application.businessNumber,
        ].some((value) => value.toLowerCase().includes(normalizedKeyword));

      return isMatchedStatus && isMatchedKeyword;
    });

    return sortOrder === 'LATEST'
      ? matchedApplications
      : [...matchedApplications].reverse();
  }, [keyword, sortOrder, status]);

  const totalPages = Math.ceil(filteredApplications.length / pageSize);
  const visibleApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleReset = () => {
    // 같은 아이콘 애니메이션도 매번 다시 재생할 수 있도록 key를 갱신한다.
    setResetAnimationKey((currentKey) => currentKey + 1);
    setCurrentPage(1);
    setDraftKeyword('');
    setKeyword('');
    setSortOrder('LATEST');
    setStatus('ALL');
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4 shrink-0">
        <h2 className="text-display-web font-semibold text-text-primary">
          입점 신청 목록
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          입점을 신청한 가게 정보를 확인할 수 있습니다.
        </p>
      </header>

      <FilterBar className="mb-2 shrink-0">
        <div className="flex w-full min-w-[700px] items-center justify-between gap-3">
          <Toggle
            checked={tableDensity === 'comfortable'}
            label="넓게 보기"
            onChange={(event) =>
              setTableDensity(event.target.checked ? 'comfortable' : 'compact')
            }
          />
          <div className="flex items-center gap-3">
            <SearchField
              className="w-[183px]"
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="검색어를 입력하세요"
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
            <SelectField
              fitContent
              onValueChange={(nextSortOrder) => {
                setCurrentPage(1);
                setSortOrder(nextSortOrder);
              }}
              options={sortOptions}
              value={sortOrder}
            />
            <Button
              aria-label="필터 초기화"
              leadingIcon={
                <RotateCcw
                  aria-hidden="true"
                  className={
                    resetAnimationKey > 0
                      ? 'size-4 animate-[spin_400ms_ease-in-out] motion-reduce:animate-none'
                      : 'size-4'
                  }
                  key={resetAnimationKey}
                />
              }
              onClick={handleReset}
              title="필터 초기화"
              variant="tertiary"
            />
          </div>
        </div>
      </FilterBar>

      <div className="flex flex-col gap-3">
        <DataTable className="min-w-[760px] table-fixed" density={tableDensity}>
          <colgroup>
            <col className="w-[12.5%]" />
            <col className="w-1/4" />
            <col className="w-[23%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr>
              <TableHeaderCell>신청 ID</TableHeaderCell>
              <TableHeaderCell>상호</TableHeaderCell>
              <TableHeaderCell>사업자등록번호</TableHeaderCell>
              <TableHeaderCell>신청일</TableHeaderCell>
              <TableHeaderCell>상태</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {listState === 'loading' && <TableLoading colSpan={5} />}
            {listState === 'error' && <TableError colSpan={5} />}
            {listState === 'success' && visibleApplications.length === 0 && (
              <TableEmpty colSpan={5}>검색 결과가 없습니다</TableEmpty>
            )}
            {listState === 'success' &&
              visibleApplications.map((application) => {
                const applicationStatus = statusMeta[application.status];

                return (
                  <TableRow key={application.id}>
                    <TableCell>{application.id}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {application.storeName}
                    </TableCell>
                    <TableCell>{application.businessNumber}</TableCell>
                    <TableCell>{application.appliedAt}</TableCell>
                    <TableCell>
                      <StatusBadge variant={applicationStatus.variant}>
                        {applicationStatus.label}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
          </tbody>
        </DataTable>

        {listState === 'success' && filteredApplications.length > 0 && (
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalCount={filteredApplications.length}
            totalPages={totalPages}
          />
        )}
      </div>
    </section>
  );
};
