// 영업 불가 조건
export const BLOCK_CONDITIONS = {
  device: [
    { id: 'mac_ipad', label: 'Mac 또는 아이패드 사용 희망' },
    { id: 'mobile_pos', label: '휴대폰 포스 사용 희망' },
    { id: 'terminal', label: '터미널 기기 사용중 (토스/페이히어/KCP)' },
    { id: 'dual_kds', label: '윈도우 + 안드로이드 KDS 동시 사용 필요' },
  ],
  service: [
    { id: 'table_order', label: '테이블오더 필수' },
    { id: 'qr_order', label: 'QR오더 필수' },
    { id: 'brand_app', label: '브랜드 앱 연동 필수' },
    { id: 'reservation', label: '예약 연동 필수 (캐치테이블/테이블링)' },
    { id: 'delivery_direct', label: '배달앱 직접 연동 필수' },
  ],
} as const;

// 호환 가능 VAN사
export const COMPATIBLE_VANS = [
  'NICE정보통신', 'KIS정보통신', 'KPN', 'KOCES', 'SMARTRO', 'KICC',
] as const;

// 호환 불가 VAN사
export const INCOMPATIBLE_VANS = [
  'KSNET', 'KOVAN', 'KCP', '다우데이터', 'NICE페이먼츠',
] as const;

// 호환 단말기 모델
export const COMPATIBLE_TERMINALS: Record<string, string[]> = {
  'NICE정보통신': ['NC-7000', 'NC-8000', 'NC-8000(P)', 'NC-6000'],
  'KIS정보통신': ['KIS-2200', 'KIS-1421', 'KIS-2420'],
  'KPN': ['MPOS-1901AE', 'MPOS-1700AE', 'MPOS-1902TE'],
  'KOCES': ['KTC-K501', 'KTC-SC500', 'KTC-K400'],
  'SMARTRO': ['SMT-T226'],
  'KICC': ['TS-114A'],
};

// 추천 결과
export const RECOMMENDATIONS = {
  new_delivery: {
    title: '윈도우 포스 조합 추천',
    items: ['윈도우 포스기', '엔페이 커넥트', '프린터'],
    color: 'blue',
  },
  new_no_delivery: {
    title: '안드로이드 포스 조합 추천',
    items: ['태블릿', 'CAT단말기', '엔페이 커넥트'],
    color: 'green',
  },
  existing_windows: {
    title: '윈도우 포스 유지',
    items: ['엔페이 커넥트 추가', '기존 프린터 호환 확인 필요'],
    color: 'blue',
  },
  existing_android: {
    title: '안드로이드 포스 유지/전환',
    items: ['VAN사 및 단말기 호환 확인 필요'],
    color: 'green',
  },
  blocked_contract: {
    title: '영업 불가 - 약정 잔여',
    items: ['페이앤스토어로 리드 전달', '대리점 컨택 후 페이앤 직영업'],
    color: 'red',
  },
  need_compatibility_check: {
    title: '호환성 확인 필요',
    items: ['기존 장비 사진/모델명 확보 필요', '리드 전달 전 호환 여부 체크'],
    color: 'yellow',
  },
} as const;

export type RecommendationKey = keyof typeof RECOMMENDATIONS;

export interface TriageData {
  blocked: string[];
  businessType: 'food' | 'non_food' | null;
  storeType: 'new' | 'existing' | null;
  useDelivery: boolean | null;
  contractOk: boolean | null;
  replaceDevice: boolean | null;
  currentPos: 'windows' | 'android' | null;
  van: string | null;
  terminal: string | null;
  compatible: boolean | null;
  recommendation: RecommendationKey | null;
}
