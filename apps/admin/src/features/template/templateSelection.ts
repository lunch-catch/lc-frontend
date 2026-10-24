export interface TemplateSelection {
  source: 'preview' | 'code';
  label: string;
  html: string;
  selector?: string;
  line?: number;
}

/** 원본 HTML의 문자열 위치를 사용하며 end는 요소의 마지막 문자 다음 위치다. */
export interface TemplateCodeElement {
  start: number;
  end: number;
  openEnd: number;
  closeStart: number;
  selection: TemplateSelection;
}

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** 원본 위치는 따옴표·주석·중첩을 구분해 찾고, 요소 식별 경로는 브라우저가 해석한 DOM에서 얻는다. */
export const getTemplateCodeElements = (
  html: string,
): TemplateCodeElement[] => {
  const tags: {
    tag: string;
    start: number;
    openEnd: number;
    closeStart: number;
    end: number;
  }[] = [];
  const stack: typeof tags = [];
  const edits: { at: number; text: string }[] = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor);
    if (start < 0) break;
    if (html.startsWith('<!--', start)) {
      const end = html.indexOf('-->', start + 4);
      cursor = end < 0 ? html.length : end + 3;
      continue;
    }
    const match = /^<(\/?)([a-z][\w:-]*)\b/i.exec(html.slice(start));
    if (!match) {
      cursor = start + 1;
      continue;
    }
    let quote = '';
    let end = start + match[0].length;
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) {
        if (char === quote) quote = '';
      } else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end === html.length) break;
    cursor = end + 1;
    const tag = match[2].toLowerCase();
    if (match[1]) {
      const index = stack.map((item) => item.tag).lastIndexOf(tag);
      if (index < 0) continue;
      stack.slice(index).forEach((item, offset) => {
        item.closeStart = start;
        item.end = offset === 0 ? cursor : start;
      });
      stack.splice(index);
      continue;
    }
    const item = {
      tag,
      start,
      openEnd: cursor,
      closeStart: cursor,
      end: cursor,
    };
    tags.push(item);
    edits.push({
      at: start + match[0].length,
      text: ` data-template-source-start="${start}"`,
    });
    if (!voidTags.has(tag) && !/\/\s*>$/.test(html.slice(start, cursor))) {
      stack.push(item);
      item.closeStart = html.length;
      item.end = html.length;
      // 스크립트·스타일·텍스트 영역 안의 '<태그>' 문자열은 구조로 해석하지 않는다.
      if (['script', 'style', 'textarea', 'title'].includes(tag)) {
        const closing = new RegExp(`</${tag}\\s*>`, 'ig');
        closing.lastIndex = cursor;
        const close = closing.exec(html);
        cursor = close ? close.index : html.length;
      }
    }
  }
  // 뒤에서부터 표시를 삽입해야 앞서 계산한 원본 코드의 위치가 밀리지 않는다.
  let instrumented = html;
  for (const edit of edits.reverse())
    instrumented =
      instrumented.slice(0, edit.at) + edit.text + instrumented.slice(edit.at);
  const document = new DOMParser().parseFromString(instrumented, 'text/html');
  const elements = new Map<number, Element>();
  document
    .querySelectorAll('[data-template-source-start]')
    .forEach((element) => {
      elements.set(
        Number(element.getAttribute('data-template-source-start')),
        element,
      );
      element.removeAttribute('data-template-source-start');
    });
  return tags.flatMap((item) => {
    const element = elements.get(item.start);
    if (
      !element ||
      !document.body.contains(element) ||
      !/^(DIV|SPAN|P|H[1-6]|STRONG|EM|BR|IMG)$/.test(element.tagName)
    )
      return [];
    return [
      {
        start: item.start,
        end: item.end,
        openEnd: item.openEnd,
        closeStart: item.closeStart,
        selection: {
          ...selectTemplateElement(element),
          source: 'code' as const,
          html: html.slice(item.start, item.end),
          line: html.slice(0, item.start).split('\n').length,
        },
      },
    ];
  });
};

/** 선택 범위를 포함하는 가장 작은 요소를 찾고, 형제를 함께 선택하면 공통 부모로 확장한다. */
export const findTemplateCodeElement = (
  elements: TemplateCodeElement[],
  start: number,
  end = start + 1,
) =>
  elements
    .filter((element) => element.start <= start && element.end >= end)
    .sort((a, b) => a.end - a.start - (b.end - b.start))[0];

const slotLabels: Record<string, string> = {
  eventName: '이벤트명',
  discount: '할인 내용',
  period: '기간',
  image: '이미지',
};

/** 이전 이력의 'h1 · 내용' 같은 라벨도 요소 본문 없이 같은 이름으로 표시한다. */
export const formatTemplateTargetLabel = (label: string) => {
  if (Object.values(slotLabels).includes(label)) return label;
  const tag = /^<?(div|span|p|h[1-6]|strong|em|br|img)(?:>| ·[\s\S]*)?$/i.exec(
    label,
  );
  return tag ? '<' + tag[1].toLowerCase() + '>' : '선택 영역';
};

/** 서버 원본 HTML에서도 찾을 수 있도록 편집기 장식은 제외하고 구조 기반 경로를 만든다. */
export const selectTemplateElement = (
  element: Element,
  originalHtml?: string,
): TemplateSelection => {
  const slot = element.getAttribute('data-slot');
  const path: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== 'body') {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement?.children ?? []).filter(
      (sibling) => sibling.tagName === current?.tagName,
    );
    path.unshift(`${tag}:nth-of-type(${siblings.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  const knownSlot = slot && Object.hasOwn(slotLabels, slot) ? slot : null;
  const selector =
    knownSlot &&
    element.ownerDocument.querySelectorAll(`[data-slot="${slot}"]`).length === 1
      ? `[data-slot="${slot}"]`
      : `body > ${path.join(' > ')}`;
  // 미리보기용 이미지와 장식이 AI 수정 요청에 섞이지 않도록 원본에서 같은 요소를 읽는다.
  const originalElement =
    originalHtml === undefined
      ? null
      : new DOMParser()
          .parseFromString(originalHtml, 'text/html')
          .querySelector(selector);
  const copy = (originalElement ?? element).cloneNode(true) as Element;
  copy.removeAttribute('data-editor-selected');
  copy
    .querySelectorAll('[data-editor-selected]')
    .forEach((child) => child.removeAttribute('data-editor-selected'));
  return {
    source: 'preview',
    label:
      (knownSlot && slotLabels[knownSlot]) ||
      `<${element.tagName.toLowerCase()}>`,
    selector,
    html: copy.outerHTML,
  };
};

const selectionRequestMarker = '\n수정 요청: ';
const selectionPromptEnding =
  '\n선택한 부분 위주로 수정하고 다른 영역과 슬롯 구조는 유지해 주세요.';
// 코드 길이를 함께 저장해 코드나 요청에 구분 문구가 들어 있어도 경계가 섞이지 않게 한다.
const selectionCodeLabel = (length: number) => `선택 코드 ${length}자:\n`;

/** 기존 requestPrompt 계약 안에서 선택한 부분과 자연어 요청을 함께 전송한다. */
export const buildSelectedTemplatePrompt = (
  prompt: string,
  selection: TemplateSelection | null,
) => {
  const instruction = prompt.trim();
  if (!selection) return instruction;
  const header = `수정 대상: ${selection.label}\n위치: ${selection.selector ?? `HTML ${selection.line}행`}\n`;
  const suffix = `${selectionRequestMarker}${instruction}${selectionPromptEnding}`;
  // 선택 정보도 500자 제한에 포함되므로 사용자 요청을 유지하고 코드 발췌문만 줄인다.
  // 코드 길이 표기는 최대 세 자리이므로 세 자리 기준으로 예산을 잡는다.
  const available =
    500 - header.length - selectionCodeLabel(500).length - suffix.length;
  if (available < 32)
    throw new Error(
      '선택 영역과 함께 보낼 수 있도록 요청 내용을 조금 줄여 주세요.',
    );
  const snippet =
    selection.html.length > available
      ? `${selection.html.slice(0, available - 1)}…`
      : selection.html;
  return `${header}${selectionCodeLabel(snippet.length)}${snippet}${suffix}`;
};

/** 편집기가 만든 선택 문구만 분리한다. 일반 요청이나 다른 형식의 이력은 원문을 유지한다. */
export const parseSelectedTemplatePrompt = (
  requestPrompt: string,
): { text: string; targetLabel?: string } => {
  const header =
    /^수정 대상: ([^\n]+)\n위치: ([^\n]+)\n선택 코드 (\d+)자:\n/.exec(
      requestPrompt,
    );
  if (header) {
    const rest = requestPrompt.slice(header[0].length);
    const request = rest.slice(Number(header[3]));
    if (
      !header[1].trim() ||
      !request.startsWith(selectionRequestMarker) ||
      !request.endsWith(selectionPromptEnding)
    )
      return { text: requestPrompt };
    const text = request.slice(
      selectionRequestMarker.length,
      request.length - selectionPromptEnding.length,
    );
    if (!text.trim()) return { text: requestPrompt };
    return { text, targetLabel: formatTemplateTargetLabel(header[1]) };
  }
  // 길이 표기가 없던 이전 형식의 이력도 계속 읽는다.
  const match =
    /^수정 대상: ([^\n]+)\n위치: ([^\n]+)\n선택 코드:\n([\s\S]+)\n수정 요청: ([\s\S]+)\n선택한 부분 위주로 수정하고 다른 영역과 슬롯 구조는 유지해 주세요\.$/.exec(
      requestPrompt,
    );
  if (!match || !match[1].trim() || !match[4].trim())
    return { text: requestPrompt };
  return { text: match[4], targetLabel: formatTemplateTargetLabel(match[1]) };
};

// 외부 이미지 요청 없이 사진 자리를 보여 주며, 저장되는 템플릿 HTML에는 넣지 않는다.
const imagePlaceholder =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280">' +
      '<defs><pattern id="photo-area-pattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V12" stroke="#000000" stroke-opacity="0.06" stroke-width="2"/></pattern></defs>' +
      '<rect width="420" height="280" rx="16" fill="#000000" fill-opacity="0.18"/>' +
      '<rect width="420" height="280" rx="16" fill="url(#photo-area-pattern)"/></svg>',
  );

const isPreviewImageSource = (source: string) =>
  /^(data:image\/|blob:)/i.test(source);

/** 데이터 URL 안의 쉼표는 유지하고, 미리보기에서 허용하는 srcset 후보만 남긴다. */
export const filterTemplatePreviewSrcset = (value: string) => {
  const candidates: string[] = [];
  let remaining = value;
  while (remaining) {
    remaining = remaining.replace(/^[\t\n\f\r ,]+/, '');
    const match = /^[^\t\n\f\r ]+/.exec(remaining);
    if (!match) break;
    let url = match[0];
    remaining = remaining.slice(url.length);
    let descriptor = '';
    // srcset은 URL을 공백까지 읽으므로 data:image/...의 내부 쉼표를 분리하면 안 된다.
    if (url.endsWith(',')) url = url.replace(/,+$/, '');
    else {
      let inParens = false;
      let end = 0;
      for (; end < remaining.length; end++) {
        const char = remaining[end];
        if (char === ',' && !inParens) break;
        if (char === '(') inParens = true;
        if (char === ')') inParens = false;
      }
      descriptor = remaining
        .slice(0, end)
        .replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '');
      remaining = remaining.slice(end + 1);
    }
    const validDescriptor =
      !descriptor ||
      (/^\d+w$/.test(descriptor) && Number(descriptor.slice(0, -1)) > 0) ||
      /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?x$/.test(descriptor);
    if (isPreviewImageSource(url) && validDescriptor)
      candidates.push(descriptor ? url + ' ' + descriptor : url);
  }
  return candidates.join(', ');
};

/** 미리보기의 스크립트 실행·폼 제출·외부 리소스 로딩을 제한한다. */
export const createSelectablePreviewHtml = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  // 비어 있거나 보안 정책상 표시할 수 없는 사진은 미리보기에서만 자리 표시자로 채운다.
  document.querySelectorAll('img').forEach((image) => {
    const source = image.getAttribute('src')?.trim() ?? '';
    const srcset = filterTemplatePreviewSrcset(
      image.getAttribute('srcset') ?? '',
    );
    if (srcset) image.setAttribute('srcset', srcset);
    else image.removeAttribute('srcset');
    if (isPreviewImageSource(source)) return;
    // 유효한 후보가 있으면 암묵적인 1x 후보가 되는 외부 src도 제거해 srcset만 사용한다.
    if (srcset) image.removeAttribute('src');
    else image.setAttribute('src', imagePlaceholder);
  });
  // 편집기에서는 A4 바깥 내용도 스크롤로 확인한다. 원본 HTML 자체는 변경하지 않는다.
  document.documentElement.style.overflow = 'auto';
  document.body.style.overflow = 'visible';
  document.body.style.margin = '0';
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content =
    "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'";
  document.head.prepend(policy);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
};
