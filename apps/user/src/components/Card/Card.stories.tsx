import type { Meta, StoryObj } from '@storybook/react-vite';

import Card from './Card';

const meta = {
  title: 'User/Card',
  component: Card,
  args: {
    children: '카드 안의 내용',
    className: 'p-4 text-body-sm-mobile text-text-primary',
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-page p-4" style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 목록을 담을 때는 구분선을 안에 두고 모서리에서 잘리게 한다
export const List: Story = {
  args: {
    as: 'ul',
    className: 'divide-y divide-border-subtle overflow-hidden',
    children: ['찜 목록', '쿠폰 사용 내역', '위치 설정'].map((label) => (
      <li
        className="px-4 py-4 text-body-sm-mobile text-text-primary"
        key={label}
      >
        {label}
      </li>
    )),
  },
};
