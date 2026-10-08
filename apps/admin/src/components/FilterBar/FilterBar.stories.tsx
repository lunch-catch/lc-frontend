import { useState } from 'react';
import { SearchField, SelectField } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { TableDensity } from '@admin/components/DataTable';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';

import { FilterBar } from './FilterBar';

const meta = {
  title: 'Admin/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '사용 가능', value: 'available' },
  { label: '사용 완료', value: 'used' },
];

const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '오래된 순', value: 'oldest' },
];

const FilterBarExample = ({ totalCount = 128, showDensity = true }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<TableDensity>('normal');

  // 상단 페이지 이동과 하단 개수 선택이 같은 목록 상태를 공유하는 예제다.
  const pagination = {
    currentPage,
    onPageChange: setCurrentPage,
    onPageSizeChange: (value: number) => {
      setPageSize(value);
      setCurrentPage(1);
    },
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };

  return (
    <div className="w-full">
      <FilterBar
        density={
          showDensity
            ? { value: density, onValueChange: setDensity }
            : undefined
        }
        pagination={pagination}
      >
        <div className="w-56">
          <SearchField />
        </div>
        <div className="w-36">
          <SelectField defaultValue="all" options={statusOptions} />
        </div>
        <div className="w-32">
          <SelectField defaultValue="latest" options={sortOptions} />
        </div>
      </FilterBar>
      <PaginationSummary {...pagination} />
    </div>
  );
};

export const Default: Story = {
  render: () => <FilterBarExample />,
};

export const Empty: Story = {
  render: () => <FilterBarExample totalCount={0} />,
};

// 카드 목록은 행 높이 설정을 전달하지 않아도 같은 필터 바를 사용할 수 있다.
export const CardList: Story = {
  render: () => <FilterBarExample showDensity={false} />,
};

export const Narrow: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <FilterBarExample />
    </div>
  ),
};
