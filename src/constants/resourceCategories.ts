export const RESOURCE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  template: { label: '영업 템플릿', icon: '📄' },
  manual: { label: '매뉴얼', icon: '📘' },
  promotion: { label: '홍보자료', icon: '📢' },
  etc: { label: '기타', icon: '📎' },
};

export type ResourceCategoryKey = keyof typeof RESOURCE_CATEGORIES;
