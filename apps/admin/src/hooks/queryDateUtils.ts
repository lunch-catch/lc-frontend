const kstDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul',
});

/** 관리자 조회는 브라우저 시간대와 무관하게 KST 영업일을 사용한다. */
export const getKstToday = () => kstDateFormatter.format(new Date());
