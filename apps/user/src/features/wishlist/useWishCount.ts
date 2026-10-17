import { useEffect, useState } from 'react';

import { fetchWishCount } from '@user/api/wishlist';

// 탭을 옮길 때마다 헤더 숫자가 비었다 채워지지 않도록 마지막으로 받은 수를 기억한다
let lastWishCount = 0;

// 헤더의 "찜 목록 N"에 보여줄 찜한 캠페인 수
// 피드에서 찜하면 서버 응답을 기다리지 않고 바로 하나 올린다 (increase)
export const useWishCount = () => {
  const [wishCount, setWishCount] = useState(lastWishCount);

  useEffect(() => {
    let ignore = false;

    fetchWishCount()
      .then((count) => {
        lastWishCount = count;
        if (!ignore) setWishCount(count);
      })
      // 받지 못하면 기억해 둔 수를 그대로 둔다
      .catch(() => {});

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const increase = () => {
    lastWishCount += 1;
    setWishCount(lastWishCount);
  };

  return { wishCount, increase };
};
