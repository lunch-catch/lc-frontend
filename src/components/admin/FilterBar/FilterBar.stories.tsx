import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchField } from '../../shared/SearchField/SearchField';
import { SelectField } from '../../shared/SelectField/SelectField';
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

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="w-full max-w-4xl">
      <FilterBar onReset={() => undefined}>
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
    </div>
  ),
};
