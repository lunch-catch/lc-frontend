import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';

import HintInput from './HintInput';

const meta = {
  title: 'User/HintInput',
  component: HintInput,
  args: {
    'aria-label': '닉네임',
    hint: '1~20자로 입력해 주세요',
    value: '',
  },
  // 입력한 값이 보이도록 이야기 안에서 값을 들고 있는다
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return (
      <span className="flex h-12 rounded-lg border border-border-subtle bg-bg-surface px-3 focus-within:border-action-primary">
        <HintInput
          {...args}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </span>
    );
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HintInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// 비어 있으면 14px 안내 문구를 세로 가운데에 보여준다
export const Empty: Story = {};

// 입력한 글자는 iOS 확대를 막도록 16px로 보인다
export const Filled: Story = {
  args: {
    value: '점심헌터',
  },
};

// 위치 설정 검색창처럼 아이콘과 함께 쓰는 모양
export const WithIcon: Story = {
  args: {
    'aria-label': '회사, 건물 이름이나 주소로 찾기',
    hint: '회사, 건물 이름이나 주소로 찾기',
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return (
      <div className="flex h-12 items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 focus-within:border-action-primary">
        <Search
          aria-hidden="true"
          className="size-4.5 shrink-0 text-text-secondary"
        />
        <HintInput
          {...args}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </div>
    );
  },
};
