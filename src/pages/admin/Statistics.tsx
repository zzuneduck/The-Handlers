import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { REGIONS } from '../../constants/regions';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ConsultationRow {
  id: string;
  handler_id: string;
  handler_name: string;
  status: string;
  region: string;
  created_at: string;
}

const PIE_COLORS = ['#03C75A', '#82ca9d', '#8884d8', '#ffc658', '#ff7c7c', '#a4a4a4', '#66b2ff', '#ff9f43', '#c9cbcf', '#e056a0'];

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

export default function Statistics() {
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [handlerCount, setHandlerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [consultRes, handlerRes] = await Promise.all([
        supabase
          .from('consultations')
          .select('id, handler_id, handler_name, status, region, created_at'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'handler'),
      ]);

      if (consultRes.error) {
        console.error('[AdminStatistics]', consultRes.error.message);
      }
      setRows((consultRes.data as ConsultationRow[]) ?? []);
      setHandlerCount(handlerRes.count ?? 0);
      setLoading(false);
    }

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  // 전체 현황 카드
  const totalConsult = rows.length;
  const totalContracted = rows.filter((r) => r.status === 'contracted').length;
  const contractRate = totalConsult > 0 ? ((totalContracted / totalConsult) * 100).toFixed(1) : '0';

  const overviewCards = [
    { label: '핸들러 수', value: handlerCount, unit: '명', color: 'text-gray-900' },
    { label: '총 상담', value: totalConsult, unit: '건', color: 'text-blue-600' },
    { label: '총 계약', value: totalContracted, unit: '건', color: 'text-[#03C75A]' },
    { label: '계약률', value: contractRate, unit: '%', color: 'text-[#03C75A]' },
  ];

  // 월별 상담/계약 추이 (최근 6개월)
  const months = getRecentMonths(6);
  const monthlyData = months.map((m) => {
    const monthRows = rows.filter((r) => r.created_at.startsWith(m.key));
    return {
      name: m.label,
      상담: monthRows.length,
      계약: monthRows.filter((r) => r.status === 'contracted').length,
    };
  });

  // 지역별 상담 분포
  const regionMap: Record<string, number> = {};
  rows.forEach((r) => {
    const key = r.region || '기타';
    regionMap[key] = (regionMap[key] ?? 0) + 1;
  });
  const regionData = Object.entries(regionMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 핸들러별 실적 TOP 5
  const handlerMap: Record<string, { name: string; total: number; contracted: number }> = {};
  rows.forEach((r) => {
    if (!r.handler_id) return;
    if (!handlerMap[r.handler_id]) {
      handlerMap[r.handler_id] = { name: r.handler_name ?? '알 수 없음', total: 0, contracted: 0 };
    }
    handlerMap[r.handler_id].total++;
    if (r.status === 'contracted') handlerMap[r.handler_id].contracted++;
  });
  const top5 = Object.values(handlerMap)
    .sort((a, b) => b.contracted - a.contracted)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">전체 통계</h2>

      {/* 전체 현황 카드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>
              {card.value}
              <span className="ml-0.5 text-sm font-normal text-gray-400">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 차트 영역 - 상단 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 월별 상담/계약 추이 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">월별 상담/계약 추이 (최근 6개월)</h3>
          {totalConsult === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-gray-400">
              데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="상담" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="계약" fill="#03C75A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 지역별 상담 분포 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">지역별 상담 분포</h3>
          {regionData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-gray-400">
              데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {regionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 핸들러별 실적 TOP 5 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-900">핸들러별 실적 TOP 5</h3>
        {top5.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            데이터가 없습니다.
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-100 md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">순위</th>
                    <th className="px-4 py-3">핸들러</th>
                    <th className="px-4 py-3 text-center">총 상담</th>
                    <th className="px-4 py-3 text-center">계약</th>
                    <th className="px-4 py-3 text-center">계약률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {top5.map((h, i) => {
                    const rate = h.total > 0 ? ((h.contracted / h.total) * 100).toFixed(1) : '0';
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              i === 0
                                ? 'bg-[#FFD700]'
                                : i === 1
                                  ? 'bg-[#C0C0C0]'
                                  : i === 2
                                    ? 'bg-[#CD7F32]'
                                    : 'bg-gray-300'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{h.total}</td>
                        <td className="px-4 py-3 text-center font-semibold text-[#03C75A]">{h.contracted}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="space-y-3 md:hidden">
              {top5.map((h, i) => {
                const rate = h.total > 0 ? ((h.contracted / h.total) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        i === 0
                          ? 'bg-[#FFD700]'
                          : i === 1
                            ? 'bg-[#C0C0C0]'
                            : i === 2
                              ? 'bg-[#CD7F32]'
                              : 'bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500">
                        상담 {h.total} · 계약 {h.contracted} · {rate}%
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[#03C75A]">{h.contracted}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
