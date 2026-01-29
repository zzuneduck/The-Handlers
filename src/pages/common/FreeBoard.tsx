import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface BoardRow {
  id: number;
  user_id: string;
  title: string;
  content: string;
  views: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FreeBoard() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('free_board')
      .select('id, user_id, title, content, views, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('relation') || error.code === '42P01') {
        setTableExists(false);
      } else {
        console.error('[FreeBoard]', error.message);
      }
      setLoading(false);
      return;
    }

    const posts = (data as BoardRow[]) ?? [];
    setRows(posts);

    // 작성자 이름 조회
    const userIds = [...new Set(posts.map((p) => p.user_id))];
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

  const handleToggle = async (row: BoardRow) => {
    if (openId === row.id) {
      setOpenId(null);
      return;
    }

    setOpenId(row.id);

    // 조회수 증가
    await supabase
      .from('free_board')
      .update({ views: row.views + 1 })
      .eq('id', row.id);

    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, views: r.views + 1 } : r)),
    );
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('free_board').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });

    if (error) {
      alert(`작성 실패: ${error.message}`);
    } else {
      setTitle('');
      setContent('');
      setShowModal(false);
      fetchRows();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('free_board').delete().eq('id', id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (openId === id) setOpenId(null);
    }
  };

  if (!tableExists) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">
            free_board 테이블이 존재하지 않습니다
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Supabase에서 아래 SQL을 실행하여 테이블을 생성해주세요.
          </p>
          <pre className="mt-4 rounded-lg bg-gray-50 p-4 text-left text-xs text-gray-700">
{`CREATE TABLE free_board (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE free_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read"
  ON free_board FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own"
  ON free_board FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own"
  ON free_board FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can update views"
  ON free_board FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);`}
          </pre>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900">자유게시판</h2>
          <p className="mt-1 text-sm text-gray-500">총 {rows.length}건</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b351]"
        >
          + 글쓰기
        </button>
      </div>

      {/* 게시글 목록 */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* 데스크톱 헤더 */}
          <div className="hidden border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 md:flex">
            <div className="flex-1 px-4 py-3">제목</div>
            <div className="w-28 px-4 py-3">작성자</div>
            <div className="w-28 px-4 py-3">작성일</div>
            <div className="w-20 px-4 py-3 text-center">조회수</div>
            <div className="w-8" />
          </div>

          {rows.map((row) => (
            <div key={row.id} className="border-b border-gray-100 last:border-b-0">
              {/* 행 */}
              <button
                onClick={() => handleToggle(row)}
                className="flex w-full items-center text-left transition-colors hover:bg-gray-50"
              >
                {/* 데스크톱 */}
                <div className="hidden w-full items-center md:flex">
                  <div className="flex-1 px-4 py-3">
                    <span className="font-medium text-gray-900">{row.title}</span>
                  </div>
                  <div className="w-28 px-4 py-3 text-sm text-gray-600">
                    {authorMap[row.user_id] ?? '알 수 없음'}
                  </div>
                  <div className="w-28 px-4 py-3 text-sm text-gray-500">
                    {formatDate(row.created_at)}
                  </div>
                  <div className="w-20 px-4 py-3 text-center text-sm text-gray-500">
                    {row.views}
                  </div>
                </div>

                {/* 모바일 */}
                <div className="flex w-full flex-col px-4 py-3 md:hidden">
                  <span className="font-medium text-gray-900">{row.title}</span>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>{authorMap[row.user_id] ?? '알 수 없음'}</span>
                    <span>{formatDate(row.created_at)}</span>
                    <span>조회 {row.views}</span>
                  </div>
                </div>

                {/* 화살표 */}
                <div className="pr-4">
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      openId === row.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* 펼침 내용 */}
              {openId === row.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {row.content}
                  </p>
                  {user && user.id === row.user_id && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(row.id);
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">글쓰기</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="내용을 입력하세요"
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
