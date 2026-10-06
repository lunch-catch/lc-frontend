import type {
  PosterTemplate,
  TemplateSlot,
  TemplateVersion,
} from './templateTypes';

export const posterPreviewThemes = [
  {
    accent: '#f56b20',
    background: '#fff5eb',
    ink: '#382515',
    label: '런치 오렌지',
  },
  { accent: '#4f7f43', background: '#f1f6ed', ink: '#23351f', label: '바질' },
  { accent: '#4d8d89', background: '#eef7f6', ink: '#1f3937', label: '청자' },
  { accent: '#d4b675', background: '#fff9ec', ink: '#4a402a', label: '유자' },
  { accent: '#d49a87', background: '#fff4ef', ink: '#4d3026', label: '복숭아' },
  { accent: '#7d87a1', background: '#f2f3f7', ink: '#2f3444', label: '밤바다' },
] as const;

const requiredSlotIds: TemplateSlot['id'][] = [
  'eventName',
  'discount',
  'period',
  'image',
  'adLabel',
];
const allowedColors = new Set([
  '#fff',
  ...posterPreviewThemes.flatMap((theme) => [
    theme.accent,
    theme.background,
    theme.ink,
  ]),
]);
const allowedTags = new Set([
  'article',
  'body',
  'div',
  'h1',
  'head',
  'html',
  'meta',
  'p',
  'span',
  'style',
]);
const allowedAttributes = new Set(['charset', 'class', 'data-slot', 'lang']);
const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

export const createTemplateSlots = (): TemplateSlot[] => [
  {
    height: 24,
    id: 'adLabel',
    label: '광고 라벨',
    type: 'text',
    width: 88,
    x: 24,
    y: 24,
  },
  {
    height: 76,
    id: 'eventName',
    label: '이벤트명',
    type: 'text',
    width: 240,
    x: 24,
    y: 72,
  },
  {
    height: 32,
    id: 'discount',
    label: '할인 내용',
    type: 'text',
    width: 220,
    x: 24,
    y: 156,
  },
  {
    height: 156,
    id: 'image',
    label: '이미지',
    type: 'image',
    width: 248,
    x: 24,
    y: 208,
  },
  {
    height: 20,
    id: 'period',
    label: '기간',
    type: 'text',
    width: 220,
    x: 24,
    y: 388,
  },
];

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => htmlEscapes[character]);

const createTemplateHtml = (name: string, themeIndex: number) => {
  const theme = posterPreviewThemes[themeIndex % posterPreviewThemes.length];
  const safeName = escapeHtml(name);

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:${theme.background};font-family:Arial,sans-serif;color:${theme.ink}}.poster{min-height:100vh;padding:32px 24px;display:flex;flex-direction:column;justify-content:space-between}.label{display:inline-block;width:max-content;background:${theme.accent};border-radius:999px;padding:6px 10px;color:#fff;font-size:12px;font-weight:700}.title{margin:22px 0 10px;font-size:32px;line-height:1.2;letter-spacing:-1px}.benefit{font-size:22px;font-weight:700;color:${theme.accent}}.image{height:180px;border-radius:16px;background:linear-gradient(135deg,${theme.accent},${theme.ink});opacity:.9}.period{font-size:14px;color:${theme.ink}}</style></head><body><article class="poster"><div><span class="label" data-slot="adLabel">LUNCH CATCH</span><h1 class="title" data-slot="eventName">${safeName}</h1><p class="benefit" data-slot="discount">점심 할인 쿠폰을 받아보세요</p></div><div class="image" data-slot="image"></div><p class="period" data-slot="period">가게명 · 사용 기간 · 할인 내용</p></article></body></html>`;
};

export const createMockTemplateVersion = ({
  name,
  request,
  themeIndex,
  version,
}: Pick<TemplateVersion, 'request' | 'themeIndex' | 'version'> & {
  name: string;
}): TemplateVersion => ({
  createdAt: '2026-10-02 10:00',
  html: createTemplateHtml(name, themeIndex),
  request,
  slots: createTemplateSlots(),
  themeIndex,
  version,
});

export const validateTemplateVersion = (version: TemplateVersion) => {
  if (
    /<script|\son\w+\s*=|(?:src|href)\s*=\s*["']?https?:/i.test(version.html)
  ) {
    return '스크립트 또는 외부 리소스는 포함할 수 없습니다.';
  }

  const tags = [...version.html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)];
  if (tags.some((tag) => !allowedTags.has(tag[1].toLowerCase()))) {
    return '허용되지 않은 태그가 포함되었습니다.';
  }

  const attributes = [
    ...version.html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi),
  ].flatMap((tag) => [
    ...tag[2].matchAll(/\s([\w-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g),
  ]);
  if (attributes.some((attribute) => !allowedAttributes.has(attribute[1]))) {
    return '허용되지 않은 속성이 포함되었습니다.';
  }

  if (
    requiredSlotIds.some(
      (slotId) =>
        !version.slots.some((slot) => slot.id === slotId) ||
        !version.html.includes(`data-slot="${slotId}"`),
    )
  ) {
    return '필수 슬롯이 누락되었습니다.';
  }

  const colors = version.html.match(/#[\da-f]{3,6}/gi) ?? [];
  if (colors.some((color) => !allowedColors.has(color.toLowerCase()))) {
    return '사전 정의된 팔레트에 없는 색상이 포함되었습니다.';
  }

  return null;
};

export const getCurrentTemplateVersion = (template: PosterTemplate) =>
  template.status === 'PUBLISHED'
    ? template.publishedVersion
    : (template.draftVersions.at(-1) ?? null);

export const getTemplatePreviewHtml = (template: PosterTemplate) =>
  getCurrentTemplateVersion(template)?.html ?? '';
