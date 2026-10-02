export type TemplateStatus = 'DRAFT' | 'PUBLISHED';

export interface PosterTemplate {
  createdAt: string;
  id: string;
  isActive: boolean;
  name: string;
  status: TemplateStatus;
  updatedAt: string;
  updatedBy: string;
  usageCount: number;
}

export const initialPosterTemplates: PosterTemplate[] = [
  {
    createdAt: '2026-10-02 09:40',
    id: 'TPL-0012',
    isActive: true,
    name: '가을 신메뉴',
    status: 'PUBLISHED',
    updatedAt: '2026-10-02 09:40',
    updatedBy: 'ADM-001',
    usageCount: 128,
  },
  {
    createdAt: '2026-10-01 16:20',
    id: 'TPL-0011',
    isActive: false,
    name: '든든한 한 끼',
    status: 'PUBLISHED',
    updatedAt: '2026-10-01 16:20',
    updatedBy: 'ADM-002',
    usageCount: 87,
  },
  {
    createdAt: '2026-09-30 18:15',
    id: 'TPL-0009',
    isActive: true,
    name: '직장인 런치 할인',
    status: 'PUBLISHED',
    updatedAt: '2026-09-30 18:15',
    updatedBy: 'ADM-003',
    usageCount: 64,
  },
  {
    createdAt: '2026-09-29 17:25',
    id: 'TPL-0007',
    isActive: true,
    name: '파스타 데이',
    status: 'PUBLISHED',
    updatedAt: '2026-09-29 17:25',
    updatedBy: 'ADM-001',
    usageCount: 52,
  },
  {
    createdAt: '2026-09-29 13:10',
    id: 'TPL-0006',
    isActive: false,
    name: '혼밥 추천',
    status: 'PUBLISHED',
    updatedAt: '2026-09-29 13:10',
    updatedBy: 'ADM-003',
    usageCount: 41,
  },
  {
    createdAt: '2026-09-28 10:20',
    id: 'TPL-0004',
    isActive: true,
    name: '주말 브런치',
    status: 'PUBLISHED',
    updatedAt: '2026-09-28 10:20',
    updatedBy: 'ADM-001',
    usageCount: 36,
  },
  {
    createdAt: '2026-09-27 16:50',
    id: 'TPL-0003',
    isActive: false,
    name: '건강한 한 상',
    status: 'PUBLISHED',
    updatedAt: '2026-09-27 16:50',
    updatedBy: 'ADM-003',
    usageCount: 29,
  },
  {
    createdAt: '2026-09-26 09:15',
    id: 'TPL-0001',
    isActive: true,
    name: '첫 방문 할인',
    status: 'PUBLISHED',
    updatedAt: '2026-09-26 09:15',
    updatedBy: 'ADM-001',
    usageCount: 18,
  },
];

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
];

export const getTemplatePreviewHtml = (
  template: PosterTemplate,
  themeIndex = Number(template.id.slice(-1)) % posterPreviewThemes.length,
) => {
  const theme = posterPreviewThemes[themeIndex % posterPreviewThemes.length];

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:${theme.background};font-family:Arial,sans-serif;color:#27272a}.poster{min-height:100vh;padding:32px 24px;display:flex;flex-direction:column;justify-content:space-between}.label{display:inline-block;width:max-content;background:${theme.accent};border-radius:999px;padding:6px 10px;color:white;font-size:12px;font-weight:700}.title{margin:22px 0 10px;font-size:32px;line-height:1.2;letter-spacing:-1px}.benefit{font-size:22px;font-weight:700;color:${theme.accent}}.image{height:180px;border-radius:16px;background:linear-gradient(135deg,${theme.accent},#27272a);opacity:.9}.store{font-size:14px;color:#52525b}</style></head><body><article class="poster"><div><span class="label">LUNCH CATCH</span><h1 class="title">${template.name}</h1><p class="benefit">점심 할인 쿠폰을 받아보세요</p></div><div class="image"></div><p class="store">가게명 · 사용 기간 · 할인 내용</p></article></body></html>`;
};
