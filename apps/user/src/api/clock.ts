// 화면에서 쓰는 지금 시각
// 사용자 휴대폰 시계는 틀릴 수 있어서, API를 붙이면 서버 시각과의 차이로 맞춘다
// 지금은 주소에 ?mockTime=10:59:50 처럼 붙이면 그 시각부터 시계가 흐르고, 앱 안에서 화면을 옮겨도 유지된다
const clockOffsetMs = (() => {
  const mockTime = new URLSearchParams(window.location.search).get('mockTime');
  if (!mockTime) return 0;

  const [hours = 0, minutes = 0, seconds = 0] = mockTime.split(':').map(Number);
  const mockNow = new Date();
  mockNow.setHours(hours, minutes, seconds, 0);

  return mockNow.getTime() - Date.now();
})();

export const getNow = () => Date.now() + clockOffsetMs;

// 오늘 그 시각(HH:MM)
export const getTodayAt = (time: string, now = getNow()) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};
