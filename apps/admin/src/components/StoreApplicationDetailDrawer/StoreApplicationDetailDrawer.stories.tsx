import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  type StoreApplicationDetail,
  StoreApplicationDetailDrawer,
} from './StoreApplicationDetailDrawer';

const application: StoreApplicationDetail = {
  address: '서울특별시 강남구 테헤란로 152',
  addressDetail: '역삼동, 런치타워 1층 102호',
  appliedAt: '2026.09.29',
  businessDays: '월요일 ~ 일요일',
  businessLicenseRegistered: true,
  businessNumber: '123-45-67890',
  businessVerified: true,
  category: '한식',
  id: 'APP-012',
  menus: [
    { name: '명품 한우 설렁탕', price: '12,000원' },
    { name: '바삭 고소 감자전', price: '8,000원' },
  ],
  ownerName: '홍길동',
  phoneNumber: '02-1234-5678',
  status: 'ONBOARDING',
  storeName: '한상차림',
  termsAgreed: true,
  weekdayHours: '11:00 ~ 21:00',
  weekendHours: '11:00 ~ 20:00',
};

const meta = {
  component: StoreApplicationDetailDrawer,
  title: 'Admin/StoreApplicationDetailDrawer',
} satisfies Meta<typeof StoreApplicationDetailDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    application: null,
    onClose: () => undefined,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <button onClick={() => setIsOpen(true)} type="button">
          상세 열기
        </button>
        <StoreApplicationDetailDrawer
          application={isOpen ? application : null}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};
