import { useState } from 'react';
import { SearchField } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import { FilterResetButton } from './FilterResetButton';

const meta = {
  component: FilterResetButton,
  title: 'Admin/FilterResetButton',
} satisfies Meta<typeof FilterResetButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };

export const WithSearch: Story = {
  render: (args) => {
    const [commitCount, setCommitCount] = useState(0);
    const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
      useDebouncedSearch({
        onCommit: () => setCommitCount((count) => count + 1),
      });

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SearchField
            value={draftKeyword}
            onChange={(event) => setDraftKeyword(event.target.value)}
          />
          <FilterResetButton {...args} onClick={resetSearch} />
        </div>
        <p className="text-body-sm-web">반영된 검색어: {keyword || '없음'}</p>
        <p className="text-caption-web">검색 반영 횟수: {commitCount}</p>
      </div>
    );
  },
};
