import { useEffect, useState } from 'react';

import { type FeedCard, fetchFeed } from '@user/api/feed';
import AppHeader from '@user/components/AppHeader/AppHeader';

import PosterCard from './PosterCard';

const SwipeFeed = () => {
  const [cards, setCards] = useState<FeedCard[]>([]);

  useEffect(() => {
    let ignore = false;

    fetchFeed().then((response) => {
      if (!ignore && response.status === 'serving') {
        setCards(response.cards);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const topCard = cards[0];

  return (
    <>
      {/* 위치 설정(#14) 전까지는 고정 위치를 보여준다 */}
      <AppHeader locationName="강남역 주변" />
      <section className="px-page pt-2">
        {topCard && <PosterCard card={topCard} />}
      </section>
    </>
  );
};

export default SwipeFeed;
