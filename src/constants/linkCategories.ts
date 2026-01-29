export const LINK_CATEGORIES: Record<string, { label: string; icon: string }> = {
  official: { label: '공식 사이트', icon: '🏢' },
  sales: { label: '영업 관련', icon: '💼' },
  support: { label: '지원/도움', icon: '🛟' },
  etc: { label: '기타', icon: '📎' },
};

export type LinkCategoryKey = keyof typeof LINK_CATEGORIES;
