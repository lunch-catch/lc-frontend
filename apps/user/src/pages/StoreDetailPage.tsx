import { useParams } from 'react-router';

import StoreDetailScreen from '@user/features/store-detail/StoreDetailScreen';

const StoreDetailPage = () => {
  const { storeId } = useParams();

  // 가게를 바꿔 들어오면 이전 가게의 상태가 남지 않도록 새로 그린다
  return <StoreDetailScreen key={storeId} storeId={Number(storeId)} />;
};

export default StoreDetailPage;
