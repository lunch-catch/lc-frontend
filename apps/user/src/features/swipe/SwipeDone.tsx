import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';

interface SwipeDoneProps {
  onRestart: () => void;
}

// 오늘의 포스터를 모두 넘겼을 때 보여주는 화면
const SwipeDone = ({ onRestart }: SwipeDoneProps) => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-page py-6 text-center">
      <img
        alt=""
        className="size-40"
        height={160}
        src={mascotAlert}
        width={160}
      />
      <h2 className="mt-6 text-h2-mobile font-bold text-text-primary">
        오늘의 포스터를 모두 확인했어요
      </h2>
      <p className="mt-2 text-body-sm-mobile text-text-secondary">
        마음에 든 포스터는 찜 목록에서 다시 볼 수 있어요
      </p>
      <div className="mt-9 flex w-full flex-col gap-3">
        <ActionButton onClick={() => navigate('/wishlist')}>
          찜한 포스터 보기
        </ActionButton>
        <ActionButton onClick={onRestart} variant="ghost">
          처음부터 다시 보기
        </ActionButton>
      </div>
    </section>
  );
};

export default SwipeDone;
