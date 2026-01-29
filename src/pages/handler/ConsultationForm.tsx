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
import { RECOMMENDATIONS } from '../../constants/triage';
import type { TriageData, RecommendationKey } from '../../constants/triage';

function getStoredTriageData(): TriageData | null {
  try {
    const raw = sessionStorage.getItem('triage_data');
    if (!raw) return null;
    return JSON.parse(raw) as TriageData;
  } catch {
    return null;
  }
}

export default function ConsultationForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [triageData] = useState<TriageData | null>(getStoredTriageData);

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
        triage_data: triageData,
        status: 'pending',
      });

      if (error) {
        toast.error(`저장 실패: ${error.message}`);
        return;
      }

      // 사용한 triage_data 제거
      sessionStorage.removeItem('triage_data');

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

  const recKey = triageData?.recommendation as RecommendationKey | null;
  const rec = recKey ? RECOMMENDATIONS[recKey] : null;
  const recColorMap: Record<string, string> = {
    blue: 'border-blue-300 bg-blue-50',
    green: 'border-[#03C75A] bg-[#e6f9ef]',
    red: 'border-red-300 bg-red-50',
    yellow: 'border-yellow-300 bg-yellow-50',
  };
  const recTextMap: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-[#03C75A]',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">상담 신청</h2>
      <p className="mt-1 text-sm text-gray-500">매장 상담을 신청합니다.</p>

      {/* 트리아지 결과 요약 */}
      {triageData && rec && (
        <div className={`mt-4 rounded-xl border p-4 ${recColorMap[rec.color]}`}>
          <p className={`text-sm font-semibold ${recTextMap[rec.color]}`}>{rec.title}</p>
          <ul className="mt-2 space-y-1">
            {rec.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-xs">&#8226;</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!triageData && (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            영업 체크리스트를 먼저 완료하면 트리아지 결과가 자동으로 포함됩니다.{' '}
            <button
              onClick={() => navigate('/handler/checklist')}
              className="font-semibold underline hover:text-yellow-800"
            >
              체크리스트 작성하기
            </button>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
    </div>
  );
}
