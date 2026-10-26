/** 원본 디자인은 유지하고, A4 전체를 채운 포스터와 iframe의 모서리만 맞춘다. */
export const syncTemplatePreviewFrame = (frame: HTMLIFrameElement) => {
  const document = frame.contentDocument;
  const view = document?.defaultView;
  if (!document || !view) return;
  const root =
    document.body.querySelector(':scope > .poster') ??
    document.body.firstElementChild;
  if (!root) return;
  const bounds = root.getBoundingClientRect();
  // A4 비율과 iframe의 정수 픽셀 크기 사이에서 생기는 반올림 차이만 허용한다.
  const fillsFrame =
    Math.abs(bounds.left) < 1 &&
    Math.abs(bounds.top) < 1 &&
    Math.abs(bounds.width - view.innerWidth) <= 1 &&
    Math.abs(bounds.height - view.innerHeight) <= 1;
  // 일부 영역만 둥근 템플릿이나 긴 문서를 임의의 포스터 모양으로 잘라내지 않는다.
  frame.style.borderRadius = fillsFrame
    ? view.getComputedStyle(root).borderRadius
    : '0px';
};
