import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SalesRecord() {
  const { user } = useAuthStore();
  const [recordDate, setRecordDate] = useState(todayStr());
  const [visitCount, setVisitCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);
  const [memo, setMemo] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 날짜 변경 시 기존 기록 조회
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    supabase
      .from('sales_records')
      .select('*')
      .eq('handler_id', user.id)
      .eq('record_date', recordDate)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('[SalesRecord] fetch:', error.message);
        }
        if (data) {
          setExistingId(data.id);
          setVisitCount(data.visit_count);
          setConsultationCount(data.consultation_count);
          setContractCount(data.contract_count);
          setMemo(data.memo ?? '');
        } else {
          setExistingId(null);
          setVisitCount(0);
          setConsultationCount(0);
          setContractCount(0);
          setMemo('');
        }
        setLoading(false);
      });
  }, [user, recordDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      handler_id: user.id,
      record_date: recordDate,
      visit_count: visitCount,
      consultation_count: consultationCount,
      contract_count: contractCount,
      memo: memo || null,
    };

    let error;
    if (existingId) {
      ({ error } = await supabase
        .from('sales_records')
        .update(payload)
        .eq('id', existingId));
    } else {
      const res = await supabase.from('sales_records').insert(payload).select('id').single();
      error = res.error;
      if (res.data) setExistingId(res.data.id);
    }

    if (error) {
      setMessage({ type: 'error', text: `저장 실패: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: existingId ? '수정되었습니다.' : '저장되었습니다.' });
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">영업 기록 등록</h2>
        <p className="mt-1 text-sm text-gray-500">
          {existingId ? '기존 기록을 수정합니다.' : '새 영업 기록을 작성합니다.'}
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${
            message.type === 'success'
              ? 'bg-[#e6f9ef] text-[#03C75A]'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* 날짜 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">영업 날짜</label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            max={todayStr()}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* 방문 수 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">방문 수</label>
              <input
                type="number"
                min={0}
                value={visitCount}
                onChange={(e) => setVisitCount(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
              />
            </div>

            {/* 상담 수 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">상담 수</label>
              <input
                type="number"
                min={0}
                value={consultationCount}
                onChange={(e) => setConsultationCount(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
              />
            </div>

            {/* 계약 수 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">계약 수</label>
              <input
                type="number"
                min={0}
                value={contractCount}
                onChange={(e) => setContractCount(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
              />
            </div>

            {/* 메모 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">메모 (선택)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                placeholder="오늘의 영업 메모..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#03C75A] py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#02B150] hover:shadow-lg disabled:opacity-50"
            >
              {saving ? '저장 중...' : existingId ? '수정하기' : '저장하기'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
