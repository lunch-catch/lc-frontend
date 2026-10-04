export type TemplateStatus = 'DRAFT' | 'PUBLISHED';

export interface TemplateSlot {
  height: number;
  id: 'adLabel' | 'discount' | 'eventName' | 'image' | 'period';
  label: string;
  type: 'image' | 'text';
  width: number;
  x: number;
  y: number;
}

export interface TemplateVersion {
  createdAt: string;
  html: string;
  request: string;
  slots: TemplateSlot[];
  themeIndex: number;
  version: number;
}

export interface PosterTemplate {
  createdAt: string;
  draftVersions: TemplateVersion[];
  id: string;
  isActive: boolean;
  name: string;
  publishedVersion: TemplateVersion | null;
  status: TemplateStatus;
  updatedAt: string;
  updatedBy: string;
  usageCount: number;
}
