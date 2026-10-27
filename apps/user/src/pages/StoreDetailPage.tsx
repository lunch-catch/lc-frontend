import { useParams } from 'react-router';

import StoreDetailScreen from '@user/features/store-detail/StoreDetailScreen';

const StoreDetailPage = () => {
  const { storeId } = useParams();

  // 가게를 바꿔 들어오면 이전 가게의 상태가 남지 않도록 새로 그린다
  // 탭바·상단 바 틀(main이 있는 레이아웃) 없이 한 화면을 다 써서, 본문 영역을 여기서 main으로 알린다
  return (
    <main>
      <StoreDetailScreen key={storeId} storeId={Number(storeId)} />
    </main>
  );
};

export default StoreDetailPage;
