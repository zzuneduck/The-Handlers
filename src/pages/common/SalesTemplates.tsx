import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { RESOURCE_CATEGORIES } from '../../constants/resourceCategories';
import { useToast } from '../../hooks/useToast';

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  download_count: number;
  created_at: string;
}

const CATEGORY_KEYS = Object.keys(RESOURCE_CATEGORIES);

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function SalesTemplates() {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';

  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState(CATEGORY_KEYS[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, description, category, file_url, download_count, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SalesTemplates]', error.message);
    }
    setRows((data as ResourceRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // 카테고리별 그룹핑
  const grouped = CATEGORY_KEYS.reduce<Record<string, ResourceRow[]>>((acc, key) => {
    const items = rows.filter((r) => r.category === key);
    if (items.length > 0) acc[key] = items;
    return acc;
  }, {});

  const categorized = new Set(Object.values(grouped).flat().map((r) => r.id));
  const uncategorized = rows.filter((r) => !categorized.has(r.id));
  if (uncategorized.length > 0) {
    grouped['etc'] = [...(grouped['etc'] ?? []), ...uncategorized];
  }

  const handleDownload = async (row: ResourceRow) => {
    // 다운로드 카운트 증가
    await supabase
      .from('resources')
      .update({ download_count: row.download_count + 1 })
      .eq('id', row.id);

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, download_count: r.download_count + 1 } : r,
      ),
    );

    window.open(row.file_url, '_blank');
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !fileUrl.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('resources').insert({
      title: title.trim(),
      description: description.trim() || null,
      category,
      file_url: fileUrl.trim(),
      file_name: title.trim(),
      file_size: 0,
      author_id: user.id,
      author_name: user.name,
      download_count: 0,
    });

    if (error) {
      toast.error(`등록 실패: ${error.message}`);
    } else {
      setTitle('');
      setDescription('');
      setFileUrl('');
      setCategory(CATEGORY_KEYS[0]);
      setShowModal(false);
      fetchRows();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 자료를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      toast.error(`삭제 실패: ${error.message}`);
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">영업 자료실</h2>
          <p className="mt-1 text-sm text-gray-500">총 {rows.length}개 자료</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b351]"
          >
            + 자료 추가
          </button>
        )}
      </div>

      {/* 카테고리별 그룹 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">등록된 자료가 없습니다.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([key, items]) => {
          const cat = RESOURCE_CATEGORIES[key] ?? RESOURCE_CATEGORIES['etc'];
          return (
            <div key={key}>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                <span>{cat.icon}</span>
                {cat.label}
                <span className="text-sm font-normal text-gray-400">({items.length})</span>
              </h3>

              <div className="space-y-3">
                {items.map((row) => (
                  <div
                    key={row.id}
                    className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* 왼쪽: 정보 */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{row.title}</p>
                      {row.description && (
                        <p className="mt-1 text-sm text-gray-500">{row.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatDate(row.created_at)}</span>
                        <span>다운로드 {row.download_count}회</span>
                      </div>
                    </div>

                    {/* 오른쪽: 버튼 */}
                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleDownload(row)}
                        className="rounded-lg border border-[#03C75A] px-3 py-1.5 text-xs font-semibold text-[#03C75A] transition-colors hover:bg-[#03C75A] hover:text-white"
                      >
                        다운로드
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* 자료 추가 모달 */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">자료 추가</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                >
                  {CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {RESOURCE_CATEGORIES[key].icon} {RESOURCE_CATEGORIES[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="자료 제목"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">설명 (선택)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="간단한 설명"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">파일 URL</label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  추후 파일 업로드 기능이 추가될 예정입니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setDescription('');
                  setFileUrl('');
                  setCategory(CATEGORY_KEYS[0]);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !fileUrl.trim()}
                className="flex-1 rounded-lg bg-[#03C75A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02b351] disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
