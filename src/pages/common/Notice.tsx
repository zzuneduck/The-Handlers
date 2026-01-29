import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface NoticeRow {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  author_name: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Notice() {
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotices() {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, content, is_pinned, author_id, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Notice]', error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as { id: string; title: string; content: string; is_pinned: boolean; author_id: string; created_at: string }[];

      // author_id → 이름 조회
      const authorIds = [...new Set(rows.map((r) => r.author_id))];
      let authorMap = new Map<string, string>();

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', authorIds);

        (profiles ?? []).forEach((p: { id: string; name: string }) => {
          authorMap.set(p.id, p.name);
        });
      }

      setNotices(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          is_pinned: r.is_pinned,
          author_name: authorMap.get(r.author_id) ?? '관리자',
          created_at: r.created_at,
        })),
      );
      setLoading(false);
    }

    fetchNotices();
  }, []);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900">공지사항</h2>
      <p className="mt-1 text-sm text-gray-500">총 {notices.length}건</p>

      {notices.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {notices.map((n) => (
            <div key={n.id}>
              {/* 헤더 (클릭 영역) */}
              <button
                onClick={() => toggle(n.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                {/* 고정 아이콘 */}
                {n.is_pinned && (
                  <span className="shrink-0 text-sm">📌</span>
                )}

                {/* 제목 + 메타 */}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${n.is_pinned ? 'text-[#03C75A]' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {n.author_name} · {formatDate(n.created_at)}
                  </p>
                </div>

                {/* 화살표 */}
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${openId === n.id ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 내용 (아코디언) */}
              {openId === n.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {n.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
