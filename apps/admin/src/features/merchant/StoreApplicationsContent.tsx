import { useMemo, useState } from 'react';
import { SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';
import { ChevronRight } from 'lucide-react';

import {
  mockStoreApplicationDetail,
  mockStoreApplications,
} from '@admin/api/mocks/storeApplications';
import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
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
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { FilterResetButton } from '@admin/components/FilterResetButton/FilterResetButton';
import { Pagination } from '@admin/components/Pagination/Pagination';
import { TableDensityControl } from '@admin/components/TableDensityControl/TableDensityControl';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import type { ApplicationStatus, StoreApplication } from './merchantTypes';
import { StoreApplicationDetailContent } from './StoreApplicationDetailContent';

type ApplicationListState = 'error' | 'loading' | 'success';
type ApplicationSortKey = keyof StoreApplication;

export interface StoreApplicationsContentProps {
  listState?: ApplicationListState;
}

interface ApplicationSort {
  direction: TableSortDirection;
  key: ApplicationSortKey;
}

const applications: StoreApplication[] = mockStoreApplications;
/*
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

const storeApplicationDetail: Omit<
  StoreApplicationDetail,
  'appliedAt' | 'businessNumber' | 'id' | 'status' | 'storeName'
> = {
  address: '서울특별시 강남구 테헤란로 152',
  addressDetail: '역삼동, 런치타워 1층 102호',
  businessDays: '월요일 ~ 일요일',
  businessLicenseRegistered: true,
  businessVerified: true,
  category: '한식',
  menus: [
    { name: '명품 한우 설렁탕', price: '12,000원' },
    { name: '바삭 고소 감자전', price: '8,000원' },
  ],
  ownerName: '홍길동',
  phoneNumber: '02-1234-5678',
  termsAgreed: true,
  weekdayHours: '11:00 ~ 21:00',
  weekendHours: '11:00 ~ 20:00',
};
*/

const storeApplicationDetail = mockStoreApplicationDetail;

const statusOptions = [
  { label: '전체', value: 'ALL' },
  { label: '입점 진행 중', value: 'ONBOARDING' },
  { label: '입점 완료', value: 'ACTIVE' },
];

const applicationTableColumns: DataTableColumn[] = [
  { minWidth: 100, width: '12.5%' },
  { minWidth: 160, width: '25%' },
  { minWidth: 180, width: '23%' },
  { minWidth: 120, width: '18%' },
  { minWidth: 140, width: '18%' },
];

const statusMeta: Record<
  ApplicationStatus,
  { label: string; variant: 'success' | 'warning' }
> = {
  ACTIVE: { label: '입점 완료', variant: 'success' },
  ONBOARDING: { label: '입점 진행 중', variant: 'warning' },
};

export const StoreApplicationsContent = ({
  listState = 'success',
}: StoreApplicationsContentProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
    useDebouncedSearch({ onCommit: () => setCurrentPage(1) });
  const [sort, setSort] = useState<ApplicationSort | null>(null);
  const [status, setStatus] = useState('ALL');
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [tableDensity, setTableDensity] = useState<TableDensity>('normal');
  const [pageSize, setPageSize] = useState(10);
  // 패널을 닫아도 선택 데이터는 남겨 퇴장 애니메이션 중 내용이 사라지지 않게 한다.
  const [detailOpen, setDetailOpen] = useState(false);

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

    if (!sort) {
      return matchedApplications;
    }

    return [...matchedApplications].sort(
      (firstApplication, secondApplication) => {
        const comparison = firstApplication[sort.key].localeCompare(
          secondApplication[sort.key],
          'ko',
        );

        return sort.direction === 'asc' ? comparison : -comparison;
      },
    );
  }, [keyword, sort, status]);

  const totalPages = Math.ceil(filteredApplications.length / pageSize);
  const visibleApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedApplication = applications.find(
    (application) => application.id === selectedApplicationId,
  );
  const selectedApplicationDetail = selectedApplication
    ? { ...storeApplicationDetail, ...selectedApplication }
    : null;

  const handleReset = () => {
    setCurrentPage(1);
    resetSearch();
    setSort(null);
    setStatus('ALL');
  };

  const handleSortChange = (nextKey: ApplicationSortKey) => {
    setCurrentPage(1);
    setSort((currentSort) => {
      if (!currentSort || currentSort.key !== nextKey) {
        return { direction: 'desc', key: nextKey };
      }

      return currentSort.direction === 'desc'
        ? { direction: 'asc', key: nextKey }
        : null;
    });
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
          <TableDensityControl
            onValueChange={setTableDensity}
            value={tableDensity}
          />
          <div className="flex items-center gap-3">
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
            <FilterResetButton onClick={handleReset} />
          </div>
        </div>
      </FilterBar>

      <div className="flex flex-col gap-3">
        <DataTable
          className="table-fixed"
          columns={applicationTableColumns}
          density={tableDensity}
          resizableColumns
        >
          <thead>
            <tr>
              <TableHeaderCell
                columnIndex={0}
                onSortChange={() => handleSortChange('id')}
                sortDirection={sort?.key === 'id' ? sort.direction : undefined}
              >
                신청 ID
              </TableHeaderCell>
              <TableHeaderCell
                columnIndex={1}
                onSortChange={() => handleSortChange('storeName')}
                sortDirection={
                  sort?.key === 'storeName' ? sort.direction : undefined
                }
              >
                상호
              </TableHeaderCell>
              <TableHeaderCell
                columnIndex={2}
                onSortChange={() => handleSortChange('businessNumber')}
                sortDirection={
                  sort?.key === 'businessNumber' ? sort.direction : undefined
                }
              >
                사업자등록번호
              </TableHeaderCell>
              <TableHeaderCell
                columnIndex={3}
                onSortChange={() => handleSortChange('appliedAt')}
                sortDirection={
                  sort?.key === 'appliedAt' ? sort.direction : undefined
                }
              >
                신청일
              </TableHeaderCell>
              <TableHeaderCell
                columnIndex={4}
                onSortChange={() => handleSortChange('status')}
                sortDirection={
                  sort?.key === 'status' ? sort.direction : undefined
                }
              >
                상태
              </TableHeaderCell>
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
                  <TableRow
                    aria-label={`${application.storeName} 입점 신청 상세 보기`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
                    key={application.id}
                    onClick={() => {
                      setSelectedApplicationId(application.id);
                      setDetailOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedApplicationId(application.id);
                        setDetailOpen(true);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TableCell>{application.id}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {application.storeName}
                    </TableCell>
                    <TableCell>{application.businessNumber}</TableCell>
                    <TableCell>{formatDate(application.appliedAt)}</TableCell>
                    <TableCell className="relative">
                      <StatusBadge variant={applicationStatus.variant}>
                        {applicationStatus.label}
                      </StatusBadge>
                      <ChevronRight
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[var(--space-6)] top-1/2 size-4 -translate-y-1/2 text-text-secondary opacity-0 transition-opacity duration-150 ease-out group-focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
                      />
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
            onPageSizeChange={(nextPageSize) => {
              setCurrentPage(1);
              setPageSize(nextPageSize);
            }}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            totalCount={filteredApplications.length}
            totalPages={totalPages}
          />
        )}
      </div>

      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedApplicationDetail?.storeName ?? '입점 신청 상세'}
        resizable
      >
        {selectedApplicationDetail && (
          <StoreApplicationDetailContent
            application={selectedApplicationDetail}
          />
        )}
      </AdminDrawer>
    </section>
  );
};
