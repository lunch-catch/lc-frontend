import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from './ScrollArea';

const meta = {
  component: ScrollArea,
  title: 'Admin/ScrollArea',
  args: {
    children: null,
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = Array.from(
  { length: 12 },
  (_, index) => `목록 항목 ${index + 1}`,
);

export const Vertical: Story = {
  render: () => (
    <div className="flex h-52 w-80 rounded-md border border-border-subtle">
      <ScrollArea className="flex flex-col gap-2 p-3">
        {items.map((item) => (
          <div className="rounded-md bg-surface-subtle p-3" key={item}>
            {item}
          </div>
        ))}
      </ScrollArea>
    </div>
  ),
};
