import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';

import { getNow } from '@user/api/clock';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from '@user/api/notification';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import EmptyState from '@user/components/EmptyState/EmptyState';
import TopBar from '@user/components/TopBar/TopBar';

// 오늘이면 시각(10:50), 어제면 어제, 그 전이면 날짜(10월 12일)
const formatSentAt = (isoString: string) => {
  const sent = new Date(isoString);
  const today = new Date(getNow());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (sent.toDateString() === today.toDateString()) {
    return sent.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    });
  }
  if (sent.toDateString() === yesterday.toDateString()) return '어제';
  return `${sent.getMonth() + 1}월 ${sent.getDate()}일`;
};

// 알림. 찜한 캠페인의 10:50 선착순 오픈 알림을 최근 순서로 보여준다
const NotificationScreen = () => {
  const navigate = useNavigate();
  // undefined면 불러오는 중, null이면 실패
  const [notifications, setNotifications] = useState<
    UserNotification[] | null
  >();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetchNotifications()
      .then((items) => {
        if (!ignore) setNotifications(items);
      })
      .catch(() => {
        if (!ignore) setNotifications(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setNotifications(undefined);
    setAttempt((current) => current + 1);
  };

  const hasUnread = notifications?.some(
    (notification) => notification.readAt === null,
  );

  // 읽음 표시는 화면에 먼저 반영한다. 서버에 알리지 못해도 다음에 다시 안 읽음으로 보일 뿐이라 막지 않는다
  const markReadOnScreen = (isTarget: (item: UserNotification) => boolean) => {
    const now = new Date(getNow()).toISOString();
    setNotifications((current) =>
      current?.map((item) =>
        item.readAt === null && isTarget(item)
          ? { ...item, readAt: now }
          : item,
      ),
    );
  };

  // 알림 하나가 가게 하나의 이야기라 그 가게 상세로 보낸다. 거기서 오픈을 기다리거나 바로 쿠폰을 받는다
  const handleOpen = (notification: UserNotification) => {
    if (notification.readAt === null) {
      markReadOnScreen(
        (item) => item.notificationId === notification.notificationId,
      );
      markNotificationRead(notification.notificationId).catch(() => {});
    }
    navigate(`/stores/${notification.storeId}`);
  };

  const handleReadAll = () => {
    markReadOnScreen(() => true);
    markAllNotificationsRead().catch(() => {});
  };

  const renderContent = () => {
    if (notifications === undefined) {
      return (
        <ul aria-hidden="true" className="flex flex-col">
          {[0, 1, 2].map((index) => (
            <li className="flex gap-3 px-page py-4" key={index}>
              <span className="size-9 shrink-0 animate-pulse rounded-full bg-surface-subtle motion-reduce:animate-none" />
              <span className="flex flex-1 flex-col gap-2 pt-1">
                <span className="h-4 w-1/2 animate-pulse rounded bg-surface-subtle motion-reduce:animate-none" />
                <span className="h-3 w-3/4 animate-pulse rounded bg-surface-subtle motion-reduce:animate-none" />
              </span>
            </li>
          ))}
        </ul>
      );
    }

    if (notifications === null) {
      return (
        <div className="flex items-center justify-between gap-3 px-page pt-4">
          <p className="text-body-sm-mobile text-text-secondary">
            알림을 불러오지 못했어요
          </p>
          <button
            className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
            onClick={retry}
            type="button"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <EmptyState
          description="찜한 쿠폰이 열리기 전 10:50에 알려드려요"
          image={mascotEmpty}
          title="아직 받은 알림이 없어요"
        />
      );
    }

    return (
      <ul className="divide-y divide-border-subtle">
        {notifications.map((notification) => {
          const isUnread = notification.readAt === null;

          return (
            <li key={notification.notificationId}>
              <button
                className={`flex w-full gap-3 px-page py-4 text-left active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary ${isUnread ? 'bg-surface-brand/40' : ''}`}
                onClick={() => handleOpen(notification)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-brand text-text-brand"
                >
                  <Bell className="size-4" />
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={`text-body-sm-mobile ${isUnread ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}
                    >
                      10분 뒤 쿠폰이 열려요
                      {isUnread && <span className="sr-only">, 안 읽음</span>}
                    </span>
                    <span className="shrink-0 text-caption-mobile text-text-tertiary">
                      {formatSentAt(notification.sentAt)}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 block text-body-sm-mobile break-keep ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    찜한 {notification.storeName} 쿠폰이 11:00에 선착순으로
                    열려요
                  </span>
                </span>
                {isUnread && (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-action-primary"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex min-h-[calc(100dvh-76px)] flex-col">
      <TopBar
        action={
          // 안 읽은 알림이 있을 때만 보여준다
          hasUnread && (
            <button
              className="h-11 px-2.5 text-body-sm-mobile font-bold text-text-secondary active:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={handleReadAll}
              type="button"
            >
              모두 읽음
            </button>
          )
        }
        onBack={() => navigate(-1)}
        title="알림"
      />
      {renderContent()}
    </div>
  );
};

export default NotificationScreen;
