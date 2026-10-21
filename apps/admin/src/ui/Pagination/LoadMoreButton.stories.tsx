import { SelectField } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadMoreButton } from './LoadMoreButton';

const meta = {
  title: 'Admin/LoadMoreButton',
  component: LoadMoreButton,
  args: { onClick: () => {} },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LoadMoreButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Retry: Story = { args: { retry: true } };

export const WithControls: Story = {
  args: {
    controls: (
      <>
        <span>불러온 내역 20건</span>
        <SelectField
          aria-label="한 번에 불러올 항목 수"
          fitContent
          size="compact"
          value="20"
          options={[5, 10, 20, 50].map((size) => ({
            value: String(size),
            label: `${size}개씩 불러오기`,
          }))}
        />
      </>
    ),
  },
};

export const LastPage: Story = {
  args: { ...WithControls.args, hasMore: false },
};
