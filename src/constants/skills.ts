export const HANDLER_SKILLS = {
  // 온라인 마케팅 (7개) - 1개 선택
  place: { icon: '🗺️', name: '네이버 플레이스', category: 'marketing' },
  blog: { icon: '📝', name: '블로그 마케팅', category: 'marketing' },
  photo: { icon: '📸', name: '사진/영상 촬영', category: 'marketing' },
  carrot: { icon: '🥕', name: '당근마켓', category: 'marketing' },
  cafe: { icon: '☕', name: '카페 침투', category: 'marketing' },
  instagram: { icon: '📱', name: '인스타그램', category: 'marketing' },
  youtube: { icon: '🎬', name: '유튜브/숏츠', category: 'marketing' },

  // 오프라인 영업 (6개) - 1개 선택
  visit: { icon: '🚶', name: '방문 영업', category: 'sales' },
  call: { icon: '📞', name: '전화 영업', category: 'sales' },
  relation: { icon: '🤝', name: '관계 구축', category: 'sales' },
  presentation: { icon: '🗣️', name: '프레젠테이션', category: 'sales' },
  consulting: { icon: '📋', name: '컨설팅', category: 'sales' },
  listening: { icon: '👂', name: '잘 들어주기', category: 'sales' },

  // 전문 분야 (8개) - 1개 선택
  food: { icon: '🍽️', name: '요식업 전문', category: 'specialty' },
  beauty: { icon: '💇', name: '뷰티 전문', category: 'specialty' },
  hospital: { icon: '🏥', name: '병원 전문', category: 'specialty' },
  retail: { icon: '🛒', name: '리테일 전문', category: 'specialty' },
  law: { icon: '⚖️', name: '법률 전문', category: 'specialty' },
  academy: { icon: '📚', name: '학원 전문', category: 'specialty' },
  pension: { icon: '🏨', name: '펜션/숙박 전문', category: 'specialty' },
  etc: { icon: '🔧', name: '기타', category: 'specialty' },
} as const;

export type SkillKey = keyof typeof HANDLER_SKILLS;

export type SkillCategory = 'marketing' | 'sales' | 'specialty';

export const SKILL_CATEGORIES: Record<SkillCategory, { name: string; description: string }> = {
  marketing: { name: '📱 온라인 마케팅', description: '대표 능력 1개 선택' },
  sales: { name: '🏪 오프라인 영업', description: '대표 능력 1개 선택' },
  specialty: { name: '💼 전문 분야', description: '대표 능력 1개 선택' },
};

export function getSkillsByCategory(category: SkillCategory): { key: SkillKey; icon: string; name: string }[] {
  return (Object.entries(HANDLER_SKILLS) as [SkillKey, (typeof HANDLER_SKILLS)[SkillKey]][])
    .filter(([, v]) => v.category === category)
    .map(([key, v]) => ({ key, icon: v.icon, name: v.name }));
}
