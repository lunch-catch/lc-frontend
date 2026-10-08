// 점주가 고른 템플릿에 캠페인 정보를 채운 포스터 HTML을 만든다
// 실제로는 점주가 저장한 포스터 HTML을 서버가 피드 카드와 함께 내려준다.
// 앱끼리는 코드를 가져다 쓸 수 없어, 점주 앱의 화면 확인용 템플릿(apps/owner/src/api/mocks/templates.ts)을 복사해 둔다

// 포스터 영역 크기에 맞춰 늘어나도록 html, body를 꽉 채운다
const baseStyle = `
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
  .poster { position: relative; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .photo { flex: 1; min-height: 0; overflow: hidden; }
  .photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .photo img[src=""] { display: none; }
  .ad-label { position: absolute; top: 12px; right: 12px; z-index: 1; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
`;

const posterTemplates = [
  // 오렌지 모던
  `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  ${baseStyle}
  body { background: #fffaf5; color: #2b2118; }
  .poster { gap: 12px; padding: 20px; }
  .badge { align-self: flex-start; padding: 4px 12px; border-radius: 999px; background: #f56b20; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
  .discount { color: #f56b20; font-size: 30px; font-weight: 800; line-height: 1.2; word-break: keep-all; }
  .event { margin-top: -6px; font-size: 16px; font-weight: 600; }
  .photo { border-radius: 16px; background: #fde3d2; }
  .footer { display: flex; justify-content: space-between; gap: 8px; color: #6b5d52; font-size: 13px; }
  .store { font-weight: 600; }
  .ad-label { background: rgba(43, 33, 24, 0.08); color: #6b5d52; }
</style>
</head>
<body>
<div class="poster">
  <span class="ad-label">광고</span>
  <span class="badge">LUNCH CATCH SPECIAL</span>
  <p class="discount">{{discountText}}</p>
  <p class="event">{{eventName}}</p>
  <div class="photo"><img src="{{imageUrl}}" alt=""></div>
  <div class="footer"><span class="store">{{storeName}}</span><span>{{period}}</span></div>
</div>
</body>
</html>`,
  // 클래식 우드
  `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  ${baseStyle}
  body { background: #3b2a1e; color: #f6ead8; }
  .poster { align-items: center; gap: 10px; padding: 24px 20px; text-align: center; border: 6px double #b08a5a; }
  .store { color: #d8b98a; font-family: 'Nanum Myeongjo', 'AppleMyungjo', serif; font-size: 15px; letter-spacing: 0.2em; }
  .discount { font-family: 'Nanum Myeongjo', 'AppleMyungjo', serif; font-size: 28px; font-weight: 800; line-height: 1.25; word-break: keep-all; }
  .photo { align-self: stretch; border: 2px solid #b08a5a; background: #5a4231; }
  .event { font-size: 15px; }
  .period { color: #d8b98a; font-size: 13px; }
  .ad-label { background: rgba(246, 234, 216, 0.16); color: #f6ead8; }
</style>
</head>
<body>
<div class="poster">
  <span class="ad-label">광고</span>
  <p class="store">{{storeName}}</p>
  <p class="discount">{{discountText}}</p>
  <div class="photo"><img src="{{imageUrl}}" alt=""></div>
  <p class="event">{{eventName}}</p>
  <p class="period">{{period}}</p>
</div>
</body>
</html>`,
  // 레트로 팝
  `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  ${baseStyle}
  body { background: #ffd23f; color: #1d1d1d; }
  .poster { gap: 12px; padding: 40px 20px 20px; }
  .discount { display: inline-block; align-self: flex-start; padding: 6px 12px; border: 3px solid #1d1d1d; background: #e63946; color: #fff; box-shadow: 4px 4px 0 #1d1d1d; font-size: 26px; font-weight: 900; line-height: 1.2; word-break: keep-all; transform: rotate(-2deg); }
  .event { font-size: 18px; font-weight: 800; }
  .photo { border: 3px solid #1d1d1d; border-radius: 12px; background: #ffb703; box-shadow: 4px 4px 0 #1d1d1d; }
  .footer { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; font-weight: 700; }
  .ad-label { border: 2px solid #1d1d1d; background: #fff; color: #1d1d1d; }
</style>
</head>
<body>
<div class="poster">
  <span class="ad-label">광고</span>
  <p class="discount">{{discountText}}</p>
  <p class="event">{{eventName}}</p>
  <div class="photo"><img src="{{imageUrl}}" alt=""></div>
  <div class="footer"><span>{{storeName}}</span><span>{{period}}</span></div>
</div>
</body>
</html>`,
];

export interface PosterSlotValues {
  eventName: string;
  discountText: string;
  period: string;
  storeName: string;
  imageUrl: string;
}

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);

// 템플릿 구조는 그대로 두고 빈칸만 채운다. 점주가 입력한 값이 태그로 해석되지 않도록 이스케이프한다
// 캠페인마다 다른 템플릿이 보이도록 순서대로 돌아가며 고른다
export const renderMockPoster = (index: number, slots: PosterSlotValues) => {
  const template = posterTemplates[index % posterTemplates.length] ?? '';

  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    name in slots
      ? escapeHtml(slots[name as keyof PosterSlotValues])
      : placeholder,
  );
};
