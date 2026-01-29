import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { LINK_CATEGORIES } from '../../constants/linkCategories';

interface LinkRow {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  created_at: string;
}

const CATEGORY_KEYS = Object.keys(LINK_CATEGORIES);

export default function UsefulLinks() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_KEYS[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from('links')
      .select('id, title, url, description, category, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[UsefulLinks]', error.message);
    }
    setLinks((data as LinkRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // 카테고리별 그룹핑
  const grouped = CATEGORY_KEYS.reduce<Record<string, LinkRow[]>>((acc, key) => {
    const items = links.filter((l) => l.category === key);
    if (items.length > 0) acc[key] = items;
    return acc;
  }, {});

  // 분류되지 않은 링크는 기타로
  const categorized = new Set(Object.values(grouped).flat().map((l) => l.id));
  const uncategorized = links.filter((l) => !categorized.has(l.id));
  if (uncategorized.length > 0) {
    grouped['etc'] = [...(grouped['etc'] ?? []), ...uncategorized];
  }

  const handleSubmit = async () => {
    if (!user || !title.trim() || !url.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('links').insert({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      category,
      author_id: user.id,
    });

    if (error) {
      alert(`등록 실패: ${error.message}`);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory(CATEGORY_KEYS[0]);
      setShowModal(false);
      fetchLinks();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
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
          <h2 className="text-2xl font-bold text-gray-900">유용한 사이트</h2>
          <p className="mt-1 text-sm text-gray-500">총 {links.length}개 링크</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b351]"
          >
            + 링크 추가
          </button>
        )}
      </div>

      {/* 카테고리별 그룹 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">등록된 링크가 없습니다.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([key, items]) => {
          const cat = LINK_CATEGORIES[key] ?? LINK_CATEGORIES['etc'];
          return (
            <div key={key}>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                <span>{cat.icon}</span>
                {cat.label}
                <span className="text-sm font-normal text-gray-400">({items.length})</span>
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#03C75A]/30 hover:shadow-md"
                  >
                    {/* 삭제 버튼 (관리자) */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(link.id);
                        }}
                        className="absolute right-3 top-3 rounded-lg p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <p className="pr-6 font-semibold text-gray-900 group-hover:text-[#03C75A]">
                      {link.title}
                    </p>

                    {link.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {link.description}
                      </p>
                    )}

                    <p className="mt-2 truncate text-xs text-gray-400">
                      {link.url}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* 링크 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">링크 추가</h3>

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
                      {LINK_CATEGORIES[key].icon} {LINK_CATEGORIES[key].label}
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
                  placeholder="사이트 이름"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
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
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setUrl('');
                  setDescription('');
                  setCategory(CATEGORY_KEYS[0]);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !url.trim()}
                className="flex-1 rounded-lg bg-[#03C75A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02b351] disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
