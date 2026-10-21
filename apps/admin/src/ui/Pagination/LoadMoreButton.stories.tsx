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
