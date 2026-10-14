import { getNow, getTodayAt } from './clock';

// 받은 알림 하나. 지금은 찜한 캠페인의 10:50 선착순 오픈 알림 한 종류다
// 알림 API(notification-api-spec.md)가 아직 없어 모양은 요구사항을 기준으로 정했다
export interface UserNotification {
  notificationId: number;
  campaignId: string;
  // 누르면 이 가게 상세로 간다. 알림 API가 나오면 응답에 함께 받아야 한다
  storeId: number;
  storeName: string;
  // 보낸 시각 (ISO)
  sentAt: string;
  // 읽은 시각. 안 읽었으면 null
  readAt: string | null;
}

const MOCK_DELAY_MS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// mock에서 읽음 처리한 알림. 화면을 옮겨도 유지되도록 모듈에 둔다
const mockReadAt = new Map<number, string>();

// 오늘 기준 며칠 전(dayOffset) 10:50에 보낸 알림
const sentAt = (dayOffset: number) =>
  new Date(getTodayAt('10:50') - dayOffset * DAY_MS).toISOString();

// 오늘 알림은 10:50이 지난 뒤에만 보인다. 어제와 그 전 알림은 읽은 것으로 둔다
const createMockNotifications = (): UserNotification[] => {
  const isTodaySent = getNow() >= getTodayAt('10:50');
  const today: UserNotification[] = isTodaySent
    ? [
        {
          notificationId: 105,
          campaignId: 'campaign-5',
          storeId: 3,
          storeName: '스시 하루',
          sentAt: sentAt(0),
          readAt: null,
        },
        {
          notificationId: 104,
          campaignId: 'campaign-katsu',
          storeId: 1,
          storeName: '카츠쿠라 역삼점',
          sentAt: sentAt(0),
          readAt: null,
        },
      ]
    : [];

  return [
    ...today,
    {
      notificationId: 103,
      campaignId: 'campaign-6',
      storeId: 6,
      storeName: '멘야 텐',
      sentAt: sentAt(1),
      readAt: sentAt(1),
    },
    {
      notificationId: 102,
      campaignId: 'campaign-8',
      storeId: 4,
      storeName: '홍루 반점',
      sentAt: sentAt(3),
      readAt: sentAt(3),
    },
  ];
};

// 받은 알림을 최근에 받은 순서로 받는다
// 주소에 ?mockNotificationsEmpty를 붙이면 받은 알림이 없는 상태를 확인할 수 있다
export const fetchNotifications = async (): Promise<UserNotification[]> => {
  await wait(MOCK_DELAY_MS);

  if (
    new URLSearchParams(window.location.search).has('mockNotificationsEmpty')
  ) {
    return [];
  }

  return createMockNotifications().map((notification) => ({
    ...notification,
    readAt:
      notification.readAt ??
      mockReadAt.get(notification.notificationId) ??
      null,
  }));
};

// 알림 하나를 읽음으로 바꾼다. 이미 읽었으면 그대로 둔다
export const markNotificationRead = async (notificationId: number) => {
  await wait(MOCK_DELAY_MS);
  if (!mockReadAt.has(notificationId)) {
    mockReadAt.set(notificationId, new Date(getNow()).toISOString());
  }
};

// 안 읽은 알림을 모두 읽음으로 바꾼다
export const markAllNotificationsRead = async () => {
  await wait(MOCK_DELAY_MS);
  const now = new Date(getNow()).toISOString();
  for (const notification of createMockNotifications()) {
    if (
      notification.readAt === null &&
      !mockReadAt.has(notification.notificationId)
    ) {
      mockReadAt.set(notification.notificationId, now);
    }
  }
};
