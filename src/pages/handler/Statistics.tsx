import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ConsultationRow {
  status: string;
  business_type: string;
  created_at: string;
}

const PIE_COLORS = ['#03C75A', '#82ca9d', '#8884d8', '#ffc658', '#ff7c7c', '#a4a4a4'];

function getRecentMonths(n: number) {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}월`;
    months.push({ key, label });
  }
  return months;
}

function getBusinessLabel(value: string) {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? value;
}

export default function Statistics() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      const { data, error } = await supabase
        .from('consultations')
        .select('status, business_type, created_at')
        .eq('handler_id', user!.id);

      if (error) {
        console.error('[HandlerStatistics]', error.message);
      }
      setRows((data as ConsultationRow[]) ?? []);
      setLoading(false);
    }

    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  // 상담 현황 카드
  const total = rows.length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const consulting = rows.filter((r) => r.status === 'consulting').length;
  const contracted = rows.filter((r) => r.status === 'contracted').length;
  const failed = rows.filter((r) => r.status === 'failed').length;

  const statCards = [
    { label: '전체', value: total, color: 'text-gray-900' },
    { label: CONSULTATION_STATUS.pending.label, value: pending, color: 'text-gray-500' },
    { label: CONSULTATION_STATUS.consulting.label, value: consulting, color: 'text-blue-600' },
    { label: CONSULTATION_STATUS.contracted.label, value: contracted, color: 'text-[#03C75A]' },
    { label: CONSULTATION_STATUS.failed.label, value: failed, color: 'text-red-500' },
  ];

  // 월별 계약 추이 (최근 6개월)
  const months = getRecentMonths(6);
  const monthlyData = months.map((m) => {
    const count = rows.filter(
      (r) => r.status === 'contracted' && r.created_at.startsWith(m.key),
    ).length;
    return { name: m.label, 계약: count };
  });

  // 업종별 분포
  const bizMap: Record<string, number> = {};
  rows.forEach((r) => {
    const key = r.business_type || 'other';
    bizMap[key] = (bizMap[key] ?? 0) + 1;
  });
  const bizData = Object.entries(bizMap).map(([key, value]) => ({
    name: getBusinessLabel(key),
    value,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">내 통계</h2>

      {/* 상담 현황 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 월별 계약 추이 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">월별 계약 추이 (최근 6개월)</h3>
          {total === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-gray-400">
              데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="계약"
                  stroke="#03C75A"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#03C75A' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 업종별 분포 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">업종별 분포</h3>
          {bizData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-gray-400">
              데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={bizData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {bizData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
