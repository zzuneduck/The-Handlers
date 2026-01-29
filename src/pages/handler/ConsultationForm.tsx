import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { REGIONS } from '../../constants/regions';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import { STORE_SIZES } from '../../constants/storeSize';
import { HARDWARE_TYPES } from '../../constants/hardwareTypes';
import ImageUpload from '../../components/common/ImageUpload';
import { logActivity } from '../../lib/activityLogger';
import { useToast } from '../../hooks/useToast';
import {
  BLOCK_CONDITIONS,
  COMPATIBLE_VANS,
  INCOMPATIBLE_VANS,
  COMPATIBLE_TERMINALS,
  RECOMMENDATIONS,
} from '../../constants/triage';
import type { TriageData, RecommendationKey } from '../../constants/triage';

function StepBadge({ step }: { step: number; total?: number }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#03C75A] text-xs font-bold text-white">
      {step}
    </span>
  );
}

function StepCard({ step, total, title, desc, children }: {
  step: number; total: number; title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge step={step} total={total} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {desc && <p className="text-xs text-gray-400">{desc}</p>}
        </div>
        <span className="ml-auto text-xs text-gray-400">{step}/{total}</span>
      </div>
      {children}
    </div>
  );
}

function RadioGroup({ value, onChange, options }: {
  value: string | null; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
            value === opt.value
              ? 'border-[#03C75A] bg-[#e6f9ef] text-gray-900'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RecommendationCard({ recKey }: { recKey: RecommendationKey }) {
  const rec = RECOMMENDATIONS[recKey];
  const colorMap: Record<string, string> = {
    blue: 'border-blue-300 bg-blue-50',
    green: 'border-[#03C75A] bg-[#e6f9ef]',
    red: 'border-red-300 bg-red-50',
    yellow: 'border-yellow-300 bg-yellow-50',
  };
  const textMap: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-[#03C75A]',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
  };

  return (
    <div className={`mt-4 rounded-lg border p-4 ${colorMap[rec.color]}`}>
      <p className={`text-sm font-semibold ${textMap[rec.color]}`}>{rec.title}</p>
      <ul className="mt-2 space-y-1">
        {rec.items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-xs">&#8226;</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ConsultationForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // 트리아지 상태
  const [blocked, setBlocked] = useState<string[]>([]);
  const [triageBizType, setTriageBizType] = useState<string | null>(null);
  const [storeType, setStoreType] = useState<string | null>(null);
  const [useDelivery, setUseDelivery] = useState<string | null>(null);
  const [contractOk, setContractOk] = useState<string | null>(null);
  const [replaceDevice, setReplaceDevice] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState<string | null>(null);
  const [selectedVan, setSelectedVan] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState('');

  // 필수 항목
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [subRegion, setSubRegion] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // 매장 정보 (선택)
  const [bizLicenseUrl, setBizLicenseUrl] = useState('');
  const [permitUrl, setPermitUrl] = useState('');
  const [storeSize, setStoreSize] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [turnoverRate, setTurnoverRate] = useState('');
  const [currentRevenue, setCurrentRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');
  const [goalRevenue, setGoalRevenue] = useState('');
  const [memo, setMemo] = useState('');

  // 하드웨어 신청 (선택)
  const [needsHardware, setNeedsHardware] = useState(false);
  const [hardwareType, setHardwareType] = useState('new');
  const [hardwareQty, setHardwareQty] = useState('1');
  const [installDate, setInstallDate] = useState('');
  const [hardwareMemo, setHardwareMemo] = useState('');

  // --- 트리아지 로직 ---
  const hasBlock = blocked.length > 0;

  const toggleBlock = (id: string) => {
    setBlocked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  // 추천 결과 결정
  const getRecommendation = (): RecommendationKey | null => {
    if (hasBlock) return null;
    if (triageBizType !== 'food') return null;

    if (storeType === 'new') {
      if (useDelivery === 'yes') return 'new_delivery';
      if (useDelivery === 'no') return 'new_no_delivery';
      return null;
    }

    if (storeType === 'existing') {
      if (contractOk === 'no') return 'blocked_contract';
      if (contractOk !== 'yes') return null;
      if (replaceDevice === 'no') return 'need_compatibility_check';
      if (replaceDevice !== 'yes') return null;
      if (currentPos === 'windows') return 'existing_windows';
      if (currentPos === 'android') return 'existing_android';
    }

    return null;
  };

  const recommendation = getRecommendation();

  // VAN 호환성
  const isCompatibleVan = COMPATIBLE_VANS.includes(selectedVan as typeof COMPATIBLE_VANS[number]);
  const vanTerminals = COMPATIBLE_TERMINALS[selectedVan] ?? [];
  const isTerminalCompatible = selectedTerminal ? vanTerminals.includes(selectedTerminal) : null;

  // 트리아지 완료 여부
  const isTriageComplete = (() => {
    if (hasBlock) return false;
    if (triageBizType === 'non_food') return true; // 경고 표시하지만 진행 가능
    if (!triageBizType) return false;
    if (!storeType) return false;

    if (storeType === 'new') return useDelivery !== null;

    if (storeType === 'existing') {
      if (contractOk === 'no') return false;
      if (contractOk !== 'yes') return false;
      if (replaceDevice === null) return false;
      if (replaceDevice === 'no') return true;
      return currentPos !== null;
    }

    return false;
  })();

  // 현재 몇 스텝까지 보여줄지
  const totalSteps = 6;

  // triage_data 생성
  const buildTriageData = (): TriageData => ({
    blocked,
    businessType: triageBizType as TriageData['businessType'],
    storeType: storeType as TriageData['storeType'],
    useDelivery: useDelivery === 'yes' ? true : useDelivery === 'no' ? false : null,
    contractOk: contractOk === 'yes' ? true : contractOk === 'no' ? false : null,
    replaceDevice: replaceDevice === 'yes' ? true : replaceDevice === 'no' ? false : null,
    currentPos: currentPos as TriageData['currentPos'],
    van: selectedVan || null,
    terminal: selectedTerminal || null,
    compatible: isTerminalCompatible,
    recommendation,
  });

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAgreed) {
      toast.warning('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('consultations').insert({
        handler_id: user.id,
        handler_name: user.name,
        store_name: storeName,
        owner_phone: phone,
        region,
        sub_region: subRegion,
        address: `${region} ${subRegion}`,
        business_type: businessType,
        privacy_agreed: privacyAgreed,
        biz_license_url: bizLicenseUrl || null,
        permit_url: permitUrl || null,
        store_size: storeSize || null,
        table_count: tableCount ? Number(tableCount) : null,
        turnover_rate: turnoverRate ? Number(turnoverRate) : null,
        current_revenue: currentRevenue ? Number(currentRevenue) : null,
        max_revenue: maxRevenue ? Number(maxRevenue) : null,
        goal_revenue: goalRevenue ? Number(goalRevenue) : null,
        memo: memo || null,
        needs_hardware: needsHardware,
        hardware_type: needsHardware ? hardwareType : null,
        hardware_qty: needsHardware ? Number(hardwareQty) : null,
        install_date: needsHardware && installDate ? installDate : null,
        hardware_memo: needsHardware && hardwareMemo ? hardwareMemo : null,
        triage_data: buildTriageData(),
        status: 'pending',
      });

      if (error) {
        toast.error(`저장 실패: ${error.message}`);
        return;
      }

      await logActivity({
        type: 'consultation_new',
        handler_id: user.id,
        handler_name: user.name,
        user_name: user.name,
        description: `${storeName} 상담을 신청했습니다.`,
        region,
        store_name: storeName,
      });

      toast.success('상담 신청이 완료되었습니다!');
      navigate('/handler/consultations');
    } catch (err) {
      toast.error('오류가 발생했습니다.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20';
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">상담 신청</h2>
      <p className="mt-1 text-sm text-gray-500">영업 트리아지 체크리스트를 완료한 후 상담 폼을 작성해주세요.</p>

      <div className="mt-6 space-y-6">
        {/* ===== STEP 1: 영업 불가 조건 확인 ===== */}
        <StepCard step={1} total={totalSteps} title="영업 불가 조건 확인" desc="아래 조건에 해당하면 영업이 어렵습니다">
          {/* 기기 */}
          <p className="mb-2 text-xs font-semibold text-gray-500">기기</p>
          <div className="space-y-2">
            {BLOCK_CONDITIONS.device.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                  blocked.includes(c.id)
                    ? 'border-red-400 bg-red-50'
                    : 'border-red-200 hover:border-red-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={blocked.includes(c.id)}
                  onChange={() => toggleBlock(c.id)}
                  className="h-4 w-4 rounded border-red-300 text-red-500 focus:ring-red-400"
                />
                <span className="text-sm text-gray-700">{c.label}</span>
              </label>
            ))}
          </div>

          {/* 서비스 */}
          <p className="mb-2 mt-4 text-xs font-semibold text-gray-500">서비스</p>
          <div className="space-y-2">
            {BLOCK_CONDITIONS.service.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                  blocked.includes(c.id)
                    ? 'border-red-400 bg-red-50'
                    : 'border-red-200 hover:border-red-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={blocked.includes(c.id)}
                  onChange={() => toggleBlock(c.id)}
                  className="h-4 w-4 rounded border-red-300 text-red-500 focus:ring-red-400"
                />
                <span className="text-sm text-gray-700">{c.label}</span>
              </label>
            ))}
          </div>

          {hasBlock && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                영업 불가 조건에 해당합니다. 해당 매장은 영업을 진행할 수 없습니다.
              </p>
            </div>
          )}
        </StepCard>

        {/* ===== STEP 2: 업종 확인 ===== */}
        {!hasBlock && (
          <StepCard step={2} total={totalSteps} title="업종 확인">
            <p className="mb-3 text-sm text-gray-600">요식업종 매장인가요?</p>
            <RadioGroup
              value={triageBizType}
              onChange={(v) => {
                setTriageBizType(v);
                setStoreType(null);
                setUseDelivery(null);
                setContractOk(null);
                setReplaceDevice(null);
                setCurrentPos(null);
              }}
              options={[
                { value: 'food', label: '예 (요식업)' },
                { value: 'non_food', label: '아니오 (비요식업)' },
              ]}
            />
            {triageBizType === 'non_food' && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-yellow-700">
                  요식업종 외 매장은 별도 문의가 필요합니다.
                </p>
              </div>
            )}
          </StepCard>
        )}

        {/* ===== STEP 3: 사업장 유형 ===== */}
        {!hasBlock && triageBizType === 'food' && (
          <StepCard step={3} total={totalSteps} title="사업장 유형">
            <p className="mb-3 text-sm text-gray-600">사업장 유형을 선택해주세요.</p>
            <RadioGroup
              value={storeType}
              onChange={(v) => {
                setStoreType(v);
                setUseDelivery(null);
                setContractOk(null);
                setReplaceDevice(null);
                setCurrentPos(null);
              }}
              options={[
                { value: 'new', label: '신규 사업장' },
                { value: 'existing', label: '기존 사업장' },
              ]}
            />
          </StepCard>
        )}

        {/* ===== STEP 4-A: 신규 사업장 분기 ===== */}
        {!hasBlock && triageBizType === 'food' && storeType === 'new' && (
          <StepCard step={4} total={totalSteps} title="배달앱 사용 여부">
            <p className="mb-3 text-sm text-gray-600">배달앱 사용 예정인가요?</p>
            <RadioGroup
              value={useDelivery}
              onChange={setUseDelivery}
              options={[
                { value: 'yes', label: '예' },
                { value: 'no', label: '아니오' },
              ]}
            />
            {useDelivery && recommendation && <RecommendationCard recKey={recommendation} />}
          </StepCard>
        )}

        {/* ===== STEP 4-B: 기존 사업장 분기 ===== */}
        {!hasBlock && triageBizType === 'food' && storeType === 'existing' && (
          <StepCard step={4} total={totalSteps} title="기존 사업장 확인">
            {/* 4-B-1: 약정 */}
            <p className="mb-3 text-sm text-gray-600">
              기존 대리점 약정이 종료되었거나 위약금 감수 의사가 있나요?
            </p>
            <RadioGroup
              value={contractOk}
              onChange={(v) => {
                setContractOk(v);
                setReplaceDevice(null);
                setCurrentPos(null);
              }}
              options={[
                { value: 'yes', label: '예' },
                { value: 'no', label: '아니오' },
              ]}
            />

            {contractOk === 'no' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  약정이 남은 경우 지오테크넷 영업이 불가합니다. 페이앤스토어로 리드를 전달하세요.
                </p>
              </div>
            )}

            {/* 4-B-2: 장비 교체 */}
            {contractOk === 'yes' && (
              <>
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="mb-3 text-sm text-gray-600">기존 장비 교체 의사가 있나요?</p>
                  <RadioGroup
                    value={replaceDevice}
                    onChange={(v) => {
                      setReplaceDevice(v);
                      setCurrentPos(null);
                    }}
                    options={[
                      { value: 'yes', label: '예' },
                      { value: 'no', label: '아니오' },
                    ]}
                  />
                </div>

                {replaceDevice === 'no' && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm font-semibold text-yellow-700">
                      기존 장비 호환 확인이 필요합니다. (사진/모델명 확보)
                    </p>
                  </div>
                )}

                {/* 4-B-3: POS 종류 */}
                {replaceDevice === 'yes' && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <p className="mb-3 text-sm text-gray-600">현재 사용중인 POS 종류는?</p>
                    <RadioGroup
                      value={currentPos}
                      onChange={setCurrentPos}
                      options={[
                        { value: 'windows', label: '윈도우 포스' },
                        { value: 'android', label: '안드로이드 포스' },
                      ]}
                    />
                    {currentPos && recommendation && <RecommendationCard recKey={recommendation} />}
                  </div>
                )}
              </>
            )}
          </StepCard>
        )}

        {/* ===== STEP 5: 호환성 체크 ===== */}
        {!hasBlock && triageBizType === 'food' && storeType === 'existing' &&
          contractOk === 'yes' && replaceDevice === 'yes' && currentPos === 'android' && (
          <StepCard step={5} total={totalSteps} title="호환성 체크">
            <div className="space-y-4">
              {/* VAN사 선택 */}
              <div>
                <label className={labelClass}>VAN사 선택</label>
                <select
                  value={selectedVan}
                  onChange={(e) => { setSelectedVan(e.target.value); setSelectedTerminal(''); }}
                  className={selectClass}
                >
                  <option value="">VAN사 선택</option>
                  <optgroup label="호환 가능">
                    {COMPATIBLE_VANS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </optgroup>
                  <optgroup label="호환 불가">
                    {INCOMPATIBLE_VANS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* VAN 호환 불가 경고 */}
              {selectedVan && !isCompatibleVan && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-700">
                    {selectedVan}은(는) 호환 불가 VAN사입니다. 단말기 교체가 필요합니다.
                  </p>
                </div>
              )}

              {/* 단말기 선택 (호환 VAN일 때만) */}
              {selectedVan && isCompatibleVan && vanTerminals.length > 0 && (
                <div>
                  <label className={labelClass}>단말기 모델</label>
                  <select
                    value={selectedTerminal}
                    onChange={(e) => setSelectedTerminal(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">단말기 선택</option>
                    {vanTerminals.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 호환 판정 */}
              {selectedVan && isCompatibleVan && selectedTerminal && (
                <div className={`rounded-lg border p-3 ${
                  isTerminalCompatible
                    ? 'border-[#03C75A] bg-[#e6f9ef]'
                    : 'border-yellow-300 bg-yellow-50'
                }`}>
                  <p className={`text-sm font-semibold ${
                    isTerminalCompatible ? 'text-[#03C75A]' : 'text-yellow-700'
                  }`}>
                    {isTerminalCompatible
                      ? '호환 가능 - 단말기 교체 불필요'
                      : '호환 불가 - 단말기 교체 필요'}
                  </p>
                </div>
              )}
            </div>
          </StepCard>
        )}

        {/* ===== STEP 6: 최종 추천 결과 ===== */}
        {isTriageComplete && (
          <div className="rounded-xl border-2 border-[#03C75A] bg-[#e6f9ef] p-6">
            <div className="flex items-center gap-3">
              <StepBadge step={totalSteps} total={totalSteps} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">체크리스트 완료!</h3>
                <p className="text-sm text-gray-600">아래 상담 폼을 작성해주세요.</p>
              </div>
            </div>
            {recommendation && <RecommendationCard recKey={recommendation} />}
          </div>
        )}

        {/* ===== 기존 상담 폼 (트리아지 완료 후) ===== */}
        {isTriageComplete && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 섹션 1: 필수 정보 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">필수 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>담당 핸들러</label>
                  <input
                    type="text"
                    value={user?.name ?? ''}
                    disabled
                    className={`${inputClass} bg-gray-100 text-gray-500`}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    매장명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    placeholder="매장명을 입력하세요"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    placeholder="010-0000-0000"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      지역 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">시/도 선택</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      상세지역 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subRegion}
                      onChange={(e) => setSubRegion(e.target.value)}
                      required
                      placeholder="구/동"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    업종 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">업종 선택</option>
                    {BUSINESS_TYPES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#03C75A] focus:ring-[#03C75A]"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-red-500">*</span> 개인정보 수집 및 이용에 동의합니다.
                  </span>
                </label>
              </div>
            </div>

            {/* 섹션 2: 매장 정보 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                매장 정보 <span className="text-sm font-normal text-gray-400">(선택)</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload
                    bucket="consultations"
                    folder="biz-license"
                    value={bizLicenseUrl}
                    onUpload={(url) => setBizLicenseUrl(url)}
                    label="사업자등록증"
                  />
                  <ImageUpload
                    bucket="consultations"
                    folder="permits"
                    value={permitUrl}
                    onUpload={(url) => setPermitUrl(url)}
                    label="면허/허가 서류"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>매장규모</label>
                    <select
                      value={storeSize}
                      onChange={(e) => setStoreSize(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">선택</option>
                      {STORE_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>테이블 개수</label>
                    <input
                      type="number"
                      value={tableCount}
                      onChange={(e) => setTableCount(e.target.value)}
                      min="0"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>현재 회전율</label>
                  <input
                    type="number"
                    value={turnoverRate}
                    onChange={(e) => setTurnoverRate(e.target.value)}
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>현재 매출 (만원)</label>
                    <input
                      type="number"
                      value={currentRevenue}
                      onChange={(e) => setCurrentRevenue(e.target.value)}
                      min="0"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>최고 매출 (만원)</label>
                    <input
                      type="number"
                      value={maxRevenue}
                      onChange={(e) => setMaxRevenue(e.target.value)}
                      min="0"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>목표 매출 (만원)</label>
                    <input
                      type="number"
                      value={goalRevenue}
                      onChange={(e) => setGoalRevenue(e.target.value)}
                      min="0"
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>메모</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    placeholder="특이사항을 입력하세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* 섹션 3: 하드웨어 신청 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                하드웨어 신청 <span className="text-sm font-normal text-gray-400">(선택)</span>
              </h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsHardware}
                  onChange={(e) => setNeedsHardware(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#03C75A] focus:ring-[#03C75A]"
                />
                <span className="text-sm text-gray-700">하드웨어 설치가 필요합니다</span>
              </label>

              {needsHardware && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>신규/교체</label>
                      <select
                        value={hardwareType}
                        onChange={(e) => setHardwareType(e.target.value)}
                        className={selectClass}
                      >
                        {HARDWARE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>필요 수량</label>
                      <input
                        type="number"
                        value={hardwareQty}
                        onChange={(e) => setHardwareQty(e.target.value)}
                        min="1"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>희망 설치일</label>
                    <input
                      type="date"
                      value={installDate}
                      onChange={(e) => setInstallDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>하드웨어 메모</label>
                    <textarea
                      value={hardwareMemo}
                      onChange={(e) => setHardwareMemo(e.target.value)}
                      rows={2}
                      placeholder="하드웨어 관련 요청사항"
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#03C75A] py-3 text-base font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
            >
              {submitting ? '신청 중...' : '상담 신청하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
