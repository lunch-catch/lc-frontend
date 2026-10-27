import ExploreScreen from '@user/features/explore/ExploreScreen';

const ExplorePage = () => {
  return (
    <>
      {/* 머리에는 로고만 있어, 화면 읽기 프로그램이 이 화면이 무엇인지 알 수 있게 보이지 않는 제목을 둔다 */}
      <h1 className="sr-only">탐색</h1>
      <ExploreScreen />
    </>
  );
};

export default ExplorePage;
