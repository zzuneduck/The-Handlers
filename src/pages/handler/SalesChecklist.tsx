import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BLOCK_CONDITIONS,
  COMPATIBLE_VANS,
  INCOMPATIBLE_VANS,
  COMPATIBLE_TERMINALS,
  RECOMMENDATIONS,
} from '../../constants/triage';
import type { TriageData, RecommendationKey } from '../../constants/triage';

function StepBadge({ step }: { step: number }) {
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
        <StepBadge step={step} />
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

export default function SalesChecklist() {
  const navigate = useNavigate();

  const [blocked, setBlocked] = useState<string[]>([]);
  const [triageBizType, setTriageBizType] = useState<string | null>(null);
  const [storeType, setStoreType] = useState<string | null>(null);
  const [useDelivery, setUseDelivery] = useState<string | null>(null);
  const [contractOk, setContractOk] = useState<string | null>(null);
  const [replaceDevice, setReplaceDevice] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState<string | null>(null);
  const [selectedVan, setSelectedVan] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState('');

  const hasBlock = blocked.length > 0;

  const toggleBlock = (id: string) => {
    setBlocked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

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

  const isCompatibleVan = COMPATIBLE_VANS.includes(selectedVan as typeof COMPATIBLE_VANS[number]);
  const vanTerminals = COMPATIBLE_TERMINALS[selectedVan] ?? [];
  const isTerminalCompatible = selectedTerminal ? vanTerminals.includes(selectedTerminal) : null;

  const isTriageComplete = (() => {
    if (hasBlock) return false;
    if (triageBizType === 'non_food') return true;
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

  const totalSteps = 6;

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

  const handleGoToConsultation = () => {
    sessionStorage.setItem('triage_data', JSON.stringify(buildTriageData()));
    navigate('/handler/consultation/new');
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 appearance-none focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">영업 가능성 체크리스트</h2>
      <p className="mt-1 text-sm text-gray-500">매장 방문 전 영업 가능 여부를 확인하세요.</p>

      <div className="mt-6 space-y-6">
        {/* STEP 1 */}
        <StepCard step={1} total={totalSteps} title="영업 불가 조건 확인" desc="아래 조건에 해당하면 영업이 어렵습니다">
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

        {/* STEP 2 */}
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

        {/* STEP 3 */}
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

        {/* STEP 4-A */}
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

        {/* STEP 4-B */}
        {!hasBlock && triageBizType === 'food' && storeType === 'existing' && (
          <StepCard step={4} total={totalSteps} title="기존 사업장 확인">
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

        {/* STEP 5 */}
        {!hasBlock && triageBizType === 'food' && storeType === 'existing' &&
          contractOk === 'yes' && replaceDevice === 'yes' && currentPos === 'android' && (
          <StepCard step={5} total={totalSteps} title="호환성 체크">
            <div className="space-y-4">
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

              {selectedVan && !isCompatibleVan && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-700">
                    {selectedVan}은(는) 호환 불가 VAN사입니다. 단말기 교체가 필요합니다.
                  </p>
                </div>
              )}

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

        {/* STEP 6: 완료 */}
        {isTriageComplete && (
          <div className="rounded-xl border-2 border-[#03C75A] bg-[#e6f9ef] p-6">
            <div className="flex items-center gap-3">
              <StepBadge step={totalSteps} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">체크리스트 완료!</h3>
                <p className="text-sm text-gray-600">상담 신청을 진행해주세요.</p>
              </div>
            </div>
            {recommendation && <RecommendationCard recKey={recommendation} />}

            <button
              onClick={handleGoToConsultation}
              className="mt-5 w-full rounded-lg bg-[#03C75A] py-3 text-base font-semibold text-white transition-colors hover:bg-[#02b350]"
            >
              상담 신청하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
