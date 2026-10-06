import { mockPosterTemplates } from '@repo/utils';

import type {
  PosterTemplate,
  TemplateVersion,
} from '@admin/features/template/templateTypes';
import { createTemplateSlots } from '@admin/features/template/templateUtils';

const ownerSlotValues = {
  discountText: '점심 20% 할인',
  eventName: '오늘의 추천 메뉴',
  imageUrl: '',
  period: '평일 11:00 - 14:00',
  storeName: '런치캐치 가게',
};

const fillOwnerTemplate = (html: string) =>
  html.replace(/\{\{(\w+)\}\}/g, (placeholder, slotName: string) =>
    slotName in ownerSlotValues
      ? ownerSlotValues[slotName as keyof typeof ownerSlotValues]
      : placeholder,
  );

export const initialPosterTemplates: PosterTemplate[] = mockPosterTemplates.map(
  (template, index) => {
    const updatedAt = `2026-10-0${2 - index} ${String(9 + index).padStart(2, '0')}:40`;
    const publishedVersion: TemplateVersion = {
      createdAt: updatedAt,
      html: fillOwnerTemplate(template.html),
      request: `${template.name} 스타일로 만들어줘`,
      slots: createTemplateSlots(),
      themeIndex: index,
      version: 1,
    };

    return {
      createdAt: updatedAt,
      draftVersions: [],
      id: template.id,
      isActive: true,
      name: template.name,
      publishedVersion,
      status: 'PUBLISHED' as const,
      updatedAt,
      updatedBy: 'ADM-001',
      usageCount: [128, 87, 64][index] ?? 0,
    };
  },
);
