import { useNavigate } from 'react-router';

import TopBar from '@user/components/TopBar/TopBar';

// 쿠폰 QR 화면. 상태별 QR 표시는 다음 단계에서 채운다
const CouponQrPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <TopBar onBack={() => navigate(-1)} title="쿠폰 사용" />
      <p className="px-page py-6 text-body-sm-mobile text-text-secondary">
        QR 화면은 준비 중이에요
      </p>
    </>
  );
};

export default CouponQrPage;
