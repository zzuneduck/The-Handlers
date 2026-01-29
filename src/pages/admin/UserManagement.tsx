import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { USER_ROLES } from '../../constants/roles';
import type { RoleKey } from '../../constants/roles';
import { HANDLER_LEVELS } from '../../constants/levels';
import type { HandlerLevelKey } from '../../constants/levels';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  handler_level: HandlerLevelKey | null;
  region: string | null;
  is_active: boolean;
  created_at: string;
}

const FILTER_ROLES: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'handler', label: '핸들러' },
  { value: 'sub_admin', label: '부관리자' },
  { value: 'payn_staff', label: 'PayN 직원' },
  { value: 'geotech_staff', label: '지오테크넷 직원' },
];

const ROLE_OPTIONS: { value: RoleKey; label: string }[] = Object.entries(USER_ROLES)
  .filter(([key]) => key !== 'super_admin')
  .map(([value, { label }]) => ({ value: value as RoleKey, label }));

const LEVEL_OPTIONS: HandlerLevelKey[] = [1, 2, 3, 4, 5, 6, 7];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    let query = supabase
      .from('profiles')
      .select('id, name, email, role, handler_level, region, is_active, created_at')
      .neq('role', 'super_admin')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[UserManagement]', error.message);
    }
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const updateUser = async (id: string, updates: Partial<UserRow>) => {
    setUpdating(id);
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) {
      alert(`업데이트 실패: ${error.message}`);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      );
    }
    setUpdating(null);
  };

  const handleRoleChange = (user: UserRow, newRole: RoleKey) => {
    const updates: Partial<UserRow> = { role: newRole };
    if (newRole !== 'handler') {
      updates.handler_level = null;
    } else if (!user.handler_level) {
      updates.handler_level = 1;
    }
    updateUser(user.id, updates);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
        <p className="mt-1 text-sm text-gray-500">총 {filtered.length}명</p>
      </div>

      {/* 필터 + 검색 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 역할 필터 */}
        <div className="flex flex-wrap gap-2">
          {FILTER_ROLES.map((f) => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                roleFilter === f.value
                  ? 'bg-[#03C75A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">역할</th>
                  <th className="px-4 py-3">레벨</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors ${updating === u.id ? 'opacity-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as RoleKey)}
                        disabled={updating === u.id}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#03C75A] focus:outline-none"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'handler' ? (
                        <select
                          value={u.handler_level ?? 1}
                          onChange={(e) =>
                            updateUser(u.id, {
                              handler_level: Number(e.target.value) as HandlerLevelKey,
                            })
                          }
                          disabled={updating === u.id}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#03C75A] focus:outline-none"
                        >
                          {LEVEL_OPTIONS.map((lv) => (
                            <option key={lv} value={lv}>
                              {HANDLER_LEVELS[lv].icon} Lv.{lv} {HANDLER_LEVELS[lv].name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.region ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        disabled={updating === u.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          u.is_active
                            ? 'bg-[#e6f9ef] text-[#03C75A] hover:bg-[#d0f4e0]'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-[#03C75A]' : 'bg-red-500'}`}
                        />
                        {u.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="space-y-3 md:hidden">
            {filtered.map((u) => (
              <div
                key={u.id}
                className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${updating === u.id ? 'opacity-50' : ''}`}
              >
                {/* 상단: 이름 + 상태 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <button
                    onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                    disabled={updating === u.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.is_active
                        ? 'bg-[#e6f9ef] text-[#03C75A]'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-[#03C75A]' : 'bg-red-500'}`}
                    />
                    {u.is_active ? '활성' : '비활성'}
                  </button>
                </div>

                {/* 역할 + 레벨 */}
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value as RoleKey)}
                    disabled={updating === u.id}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-[#03C75A] focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {u.role === 'handler' && (
                    <select
                      value={u.handler_level ?? 1}
                      onChange={(e) =>
                        updateUser(u.id, {
                          handler_level: Number(e.target.value) as HandlerLevelKey,
                        })
                      }
                      disabled={updating === u.id}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-[#03C75A] focus:outline-none"
                    >
                      {LEVEL_OPTIONS.map((lv) => (
                        <option key={lv} value={lv}>
                          {HANDLER_LEVELS[lv].icon} Lv.{lv}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 하단 정보 */}
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{u.region ?? '지역 없음'}</span>
                  <span>{formatDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
