export const HANDLER_SKILLS = {
  // 📱 마케팅/콘텐츠 (14개)
  place: { icon: '🗺️', name: '네이버 플레이스', category: 'marketing' },
  blog: { icon: '📝', name: '블로그 마케팅', category: 'marketing' },
  photo: { icon: '📸', name: '사진/영상 촬영', category: 'marketing' },
  carrot: { icon: '🥕', name: '당근마켓', category: 'marketing' },
  cafe: { icon: '☕', name: '카페 침투', category: 'marketing' },
  instagram: { icon: '📱', name: '인스타그램', category: 'marketing' },
  youtube: { icon: '🎬', name: '유튜브/숏츠', category: 'marketing' },
  cardnews: { icon: '🎴', name: '카드뉴스 제작', category: 'marketing' },
  shortform: { icon: '🎞️', name: '숏폼 편집', category: 'marketing' },
  detailpage: { icon: '📄', name: '상세페이지 제작', category: 'marketing' },
  branding: { icon: '🎨', name: '로고/브랜딩', category: 'marketing' },
  copywriting: { icon: '✍️', name: '카피라이팅', category: 'marketing' },
  press: { icon: '📰', name: '보도자료 작성', category: 'marketing' },
  event: { icon: '🎉', name: '이벤트 기획', category: 'marketing' },

  // 🏪 영업/비즈니스 (9개)
  visit: { icon: '🚶', name: '방문 영업', category: 'sales' },
  call: { icon: '📞', name: '전화 영업', category: 'sales' },
  relation: { icon: '🤝', name: '관계 구축', category: 'sales' },
  presentation: { icon: '🗣️', name: '프레젠테이션', category: 'sales' },
  consulting: { icon: '📋', name: '컨설팅', category: 'sales' },
  listening: { icon: '👂', name: '잘 들어주기', category: 'sales' },
  dataAnalysis: { icon: '📊', name: '데이터 분석', category: 'sales' },
  govSupport: { icon: '🏛️', name: '정부지원금 컨설팅', category: 'sales' },
  training: { icon: '👨‍🏫', name: '직원 교육', category: 'sales' },

  // 💼 전문 분야 (8개)
  food: { icon: '🍽️', name: '요식업 전문', category: 'specialty' },
  beauty: { icon: '💇', name: '뷰티 전문', category: 'specialty' },
  hospital: { icon: '🏥', name: '병원 전문', category: 'specialty' },
  retail: { icon: '🛒', name: '리테일 전문', category: 'specialty' },
  law: { icon: '⚖️', name: '법률 전문', category: 'specialty' },
  academy: { icon: '📚', name: '학원 전문', category: 'specialty' },
  pension: { icon: '🏨', name: '펜션/숙박 전문', category: 'specialty' },
  etc: { icon: '🔧', name: '기타', category: 'specialty' },
} as const;

export const SKILL_CATEGORIES = {
  marketing: { name: '📱 마케팅/콘텐츠', description: '대표 능력 1개 선택' },
  sales: { name: '🏪 영업/비즈니스', description: '대표 능력 1개 선택' },
  specialty: { name: '💼 전문 분야', description: '대표 능력 1개 선택' },
} as const;

export type SkillKey = keyof typeof HANDLER_SKILLS;
export type SkillCategory = keyof typeof SKILL_CATEGORIES;

export function getSkillsByCategory(category: SkillCategory) {
  return (Object.entries(HANDLER_SKILLS) as [SkillKey, (typeof HANDLER_SKILLS)[SkillKey]][])
    .filter(([, v]) => v.category === category)
    .map(([key, v]) => ({ key, icon: v.icon, name: v.name }));
}
