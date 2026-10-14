import { useEffect, useState } from 'react';

import { fetchNotifications } from '@user/api/notification';

// 안 읽은 알림이 있는지. 헤더가 보일 때마다 새로 확인해, 알림 화면에서 읽고 돌아오면 점이 사라진다
// 불러오기 전이나 실패하면 점을 찍지 않는다
export const useHasUnreadNotifications = () => {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchNotifications()
      .then((items) => {
        if (!ignore) setHasUnread(items.some((item) => item.readAt === null));
      })
      .catch(() => {});

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  return hasUnread;
};
