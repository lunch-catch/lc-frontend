import { Outlet } from 'react-router';

// 하단 탭바 없이 상단 바와 하단 고정 버튼으로 구성되는 화면의 틀
const StackLayout = () => {
  return (
    <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
      {/* 하단 고정 버튼(FixedBottom)에 내용이 가려지지 않도록 비워둔다 */}
      <main className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
};

export default StackLayout;
