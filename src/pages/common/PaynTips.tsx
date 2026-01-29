import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface TipRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  likes: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function PaynTips() {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [rows, setRows] = useState<TipRow[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('payn_tips')
      .select('id, user_id, title, content, likes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PaynTips]', error.message);
      setLoading(false);
      return;
    }

    const tips = (data as TipRow[]) ?? [];
    setRows(tips);

    // 작성자 이름 조회
    const userIds = [...new Set(tips.map((t) => t.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profiles) {
        const map: Record<string, string> = {};
        profiles.forEach((p: { id: string; name: string }) => {
          map[p.id] = p.name;
        });
        setAuthorMap(map);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleLike = async (row: TipRow) => {
    const { error } = await supabase
      .from('payn_tips')
      .update({ likes: row.likes + 1 })
      .eq('id', row.id);

    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, likes: r.likes + 1 } : r)),
      );
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('payn_tips').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      likes: 0,
    });

    if (error) {
      toast.error(`작성 실패: ${error.message}`);
    } else {
      setTitle('');
      setContent('');
      setShowModal(false);
      fetchRows();
    }
    setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PayN 포스 팁</h2>
          <p className="mt-1 text-sm text-gray-500">총 {rows.length}건</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b351]"
        >
          + 팁 작성
        </button>
      </div>

      {/* 카드 목록 */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">등록된 팁이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* 카드 헤더 */}
              <button
                onClick={() => setOpenId(openId === row.id ? null : row.id)}
                className="w-full px-5 py-4 text-left"
              >
                <p className="font-semibold text-gray-900">{row.title}</p>

                {openId === row.id ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {row.content}
                  </p>
                ) : (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {row.content}
                  </p>
                )}
              </button>

              {/* 카드 푸터 */}
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{authorMap[row.user_id] ?? '알 수 없음'}</span>
                  <span>{formatDate(row.created_at)}</span>
                </div>
                <button
                  onClick={() => handleLike(row)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  ❤️ {row.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">팁 작성</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="팁 제목을 입력하세요"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="팁 내용을 입력하세요"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setContent('');
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !content.trim()}
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
