import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { QNA_CATEGORIES } from '../../constants/qnaCategories';
import { useToast } from '../../hooks/useToast';

interface QnaRow {
  id: string;
  category: string;
  title: string;
  content: string;
  user_name: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
}

const CATEGORY_BADGE: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  consultation: 'bg-blue-100 text-blue-700',
  hardware: 'bg-orange-100 text-orange-700',
  sales: 'bg-[#e6f9ef] text-[#03C75A]',
  etc: 'bg-purple-100 text-purple-700',
};

function getCategoryLabel(value: string) {
  return QNA_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function QnA() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [questions, setQuestions] = useState<QnaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  // 질문 작성 모달
  const [showModal, setShowModal] = useState(false);
  const [formCategory, setFormCategory] = useState('general');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 답변 작성
  const [answerText, setAnswerText] = useState('');
  const [answering, setAnswering] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';
  const canAsk = isAdmin || user?.role === 'handler';

  const fetchQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('qna')
      .select('id, category, title, content, user_id, answer, answered_by, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[QnA]', error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as {
      id: string;
      category: string;
      title: string;
      content: string;
      user_id: string;
      answer: string | null;
      answered_by: string | null;
      created_at: string;
    }[];

    // user_id → 이름 조회
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const nameMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      (profiles ?? []).forEach((p: { id: string; name: string }) => {
        nameMap.set(p.id, p.name);
      });
    }

    setQuestions(
      rows.map((r) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        content: r.content,
        user_name: nameMap.get(r.user_id) ?? '사용자',
        answer: r.answer,
        answered_by: r.answered_by,
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
    setAnswerText('');
  };

  /* ── 질문 작성 ── */
  const openCreateModal = () => {
    setFormCategory('general');
    setFormTitle('');
    setFormContent('');
    setShowModal(true);
  };

  const handleCreateQuestion = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.warning('제목과 내용을 입력하세요.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase.from('qna').insert({
      category: formCategory,
      title: formTitle,
      content: formContent,
      user_id: user.id,
    });

    if (error) {
      toast.error(`작성 실패: ${error.message}`);
    } else {
      setShowModal(false);
      fetchQuestions();
    }
    setSubmitting(false);
  };

  /* ── 답변 작성 ── */
  const handleAnswer = async (qnaId: string) => {
    if (!answerText.trim()) {
      toast.warning('답변을 입력하세요.');
      return;
    }
    if (!user) return;

    setAnswering(true);
    const { error } = await supabase
      .from('qna')
      .update({ answer: answerText, answered_by: user.name })
      .eq('id', qnaId);

    if (error) {
      toast.error(`답변 실패: ${error.message}`);
    } else {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qnaId ? { ...q, answer: answerText, answered_by: user.name } : q,
        ),
      );
      setAnswerText('');
    }
    setAnswering(false);
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
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Q&A</h2>
          <p className="mt-1 text-sm text-gray-500">총 {questions.length}건</p>
        </div>
        {canAsk && (
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350]"
          >
            + 질문하기
          </button>
        )}
      </div>

      {/* 목록 */}
      {questions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">등록된 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {questions.map((q) => (
            <div key={q.id}>
              {/* 질문 헤더 */}
              <button
                onClick={() => toggle(q.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                {/* 카테고리 배지 */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[q.category] ?? CATEGORY_BADGE.etc}`}
                >
                  {getCategoryLabel(q.category)}
                </span>

                {/* 제목 + 메타 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {q.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {q.user_name} · {formatDate(q.created_at)}
                  </p>
                </div>

                {/* 답변 여부 */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    q.answer
                      ? 'bg-[#e6f9ef] text-[#03C75A]'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {q.answer ? '답변완료' : '대기중'}
                </span>

                {/* 화살표 */}
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${openId === q.id ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 내용 + 답변 (아코디언) */}
              {openId === q.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {/* 질문 내용 */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Q. 질문</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {q.content}
                    </p>
                  </div>

                  {/* 답변 */}
                  {q.answer ? (
                    <div className="mt-3 rounded-lg bg-[#f0fdf4] p-4">
                      <p className="text-xs font-medium text-[#03C75A]">
                        A. 답변 {q.answered_by && <span className="text-gray-400 font-normal">by {q.answered_by}</span>}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {q.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">아직 답변이 없습니다.</p>

                      {/* 관리자 답변 입력 */}
                      {isAdmin && (
                        <div className="mt-3 flex gap-2">
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={3}
                            placeholder="답변을 입력하세요"
                            className={`${inputClass} resize-none`}
                          />
                          <button
                            onClick={() => handleAnswer(q.id)}
                            disabled={answering}
                            className="shrink-0 self-end rounded-lg bg-[#03C75A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
                          >
                            {answering ? '...' : '답변'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 질문 작성 모달 ── */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">질문하기</h3>

            <div className="mt-4 space-y-4">
              {/* 카테고리 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  카테고리
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {QNA_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="질문 제목을 입력하세요"
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
                  rows={5}
                  placeholder="질문 내용을 입력하세요"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={submitting}
                className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '질문 등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
