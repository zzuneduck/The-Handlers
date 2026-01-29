import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface StoryRow {
  id: string;
  title: string;
  content: string;
  author_name: string;
  likes: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function SuccessStories() {
  const { user } = useAuthStore();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStories() {
      const { data, error } = await supabase
        .from('success_stories')
        .select('id, title, content, handler_id, author_name, likes, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SuccessStories]', error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as {
        id: string;
        title: string;
        content: string;
        handler_id: string;
        author_name: string | null;
        likes: number;
        created_at: string;
      }[];

      // author_name이 없는 경우 handler_id로 프로필 조회
      const missingIds = rows
        .filter((r) => !r.author_name)
        .map((r) => r.handler_id);
      const uniqueIds = [...new Set(missingIds)];
      const nameMap = new Map<string, string>();

      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueIds);

        (profiles ?? []).forEach((p: { id: string; name: string }) => {
          nameMap.set(p.id, p.name);
        });
      }

      setStories(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          author_name: r.author_name || nameMap.get(r.handler_id) || '핸들러',
          likes: r.likes ?? 0,
          created_at: r.created_at,
        })),
      );
      setLoading(false);
    }

    fetchStories();
  }, []);

  const handleLike = async (id: string, currentLikes: number) => {
    setLikingId(id);

    const { error } = await supabase
      .from('success_stories')
      .update({ likes: currentLikes + 1 })
      .eq('id', id);

    if (error) {
      console.error('[Like]', error.message);
    } else {
      setStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likes: currentLikes + 1 } : s)),
      );
    }
    setLikingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  const isHandler = user?.role === 'handler';

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">성공 후기</h2>
          <p className="mt-1 text-sm text-gray-500">총 {stories.length}건</p>
        </div>
        {isHandler && (
          <Link
            to="/handler/success-story/new"
            className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350]"
          >
            + 후기 작성
          </Link>
        )}
      </div>

      {stories.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">아직 성공 후기가 없습니다.</p>
          {isHandler && (
            <Link
              to="/handler/success-story/new"
              className="mt-3 inline-block text-sm font-medium text-[#03C75A] hover:underline"
            >
              첫 후기를 작성해보세요
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {stories.map((s) => (
            <div
              key={s.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* 제목 */}
              <h3 className="font-semibold text-gray-900 line-clamp-1">{s.title}</h3>

              {/* 내용 미리보기 (2줄) */}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-2">
                {s.content}
              </p>

              {/* 하단: 작성자, 좋아요, 날짜 */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{s.author_name}</span>
                  <span className="text-gray-300">|</span>
                  <span>{formatDate(s.created_at)}</span>
                </div>

                <button
                  onClick={() => handleLike(s.id, s.likes)}
                  disabled={likingId === s.id}
                  className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <span className="text-sm leading-none">&#10084;&#65039;</span>
                  <span>{s.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
