import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
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

export default function NoticeManagement() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, content, is_pinned, author_id, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NoticeManagement]', error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as { id: string; title: string; content: string; is_pinned: boolean; author_id: string; created_at: string }[];

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
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  /* ── 모달 열기/닫기 ── */
  const openCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormPinned(false);
    setShowModal(true);
  };

  const openEdit = (n: NoticeRow) => {
    setEditingId(n.id);
    setFormTitle(n.title);
    setFormContent(n.content);
    setFormPinned(n.is_pinned);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  /* ── 저장 (생성/수정) ── */
  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      alert('제목과 내용을 입력하세요.');
      return;
    }

    setSubmitting(true);

    if (editingId) {
      // 수정
      const { error } = await supabase
        .from('notices')
        .update({ title: formTitle, content: formContent, is_pinned: formPinned })
        .eq('id', editingId);

      if (error) {
        alert(`수정 실패: ${error.message}`);
        setSubmitting(false);
        return;
      }
    } else {
      // 생성
      const { error } = await supabase.from('notices').insert({
        title: formTitle,
        content: formContent,
        is_pinned: formPinned,
        author_id: user?.id,
      });

      if (error) {
        alert(`작성 실패: ${error.message}`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    closeModal();
    fetchNotices();
  };

  /* ── 삭제 ── */
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
    } else {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }
  };

  /* ── 고정 토글 ── */
  const togglePin = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('notices')
      .update({ is_pinned: !currentPinned })
      .eq('id', id);

    if (error) {
      alert(`변경 실패: ${error.message}`);
    } else {
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_pinned: !currentPinned } : n)),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20';

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">공지 관리</h2>
          <p className="mt-1 text-sm text-gray-500">총 {notices.length}건</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350]"
        >
          + 새 공지
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">공지사항이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">작성자</th>
                  <th className="px-4 py-3">작성일</th>
                  <th className="px-4 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notices.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePin(n.id, n.is_pinned)}
                        className="text-sm transition-opacity hover:opacity-70"
                        title={n.is_pinned ? '고정 해제' : '고정'}
                      >
                        {n.is_pinned ? '📌' : <span className="text-gray-300">📌</span>}
                      </button>
                    </td>
                    <td className={`px-4 py-3 font-medium ${n.is_pinned ? 'text-[#03C75A]' : 'text-gray-900'}`}>
                      {n.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{n.author_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(n.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(n)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="space-y-3 md:hidden">
            {notices.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {n.is_pinned && <span className="text-sm">📌</span>}
                      <p className={`truncate font-medium ${n.is_pinned ? 'text-[#03C75A]' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {n.author_name} · {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => togglePin(n.id, n.is_pinned)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {n.is_pinned ? '고정 해제' : '고정'}
                  </button>
                  <button
                    onClick={() => openEdit(n)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 모달 ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              {editingId ? '공지 수정' : '새 공지 작성'}
            </h3>

            <div className="mt-4 space-y-4">
              {/* 제목 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="공지 제목을 입력하세요"
                  className={inputClass}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  placeholder="공지 내용을 입력하세요"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* 고정 여부 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#03C75A] focus:ring-[#03C75A]"
                />
                <span className="text-sm text-gray-700">상단 고정</span>
              </label>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
              >
                {submitting ? '저장 중...' : editingId ? '수정' : '작성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
