import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

export default function WriteSuccessStory() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('success_stories').insert({
        handler_id: user.id,
        author_name: user.name,
        title,
        content,
        likes: 0,
      });

      if (error) {
        toast.error(`저장 실패: ${error.message}`);
        return;
      }

      toast.success('성공 후기가 등록되었습니다!');
      navigate('/success-stories');
    } catch (err) {
      toast.error('오류가 발생했습니다.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20';

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">성공 후기 작성</h2>
      <p className="mt-1 text-sm text-gray-500">영업 성공 경험을 공유해주세요.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* 작성자 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                작성자
              </label>
              <input
                type="text"
                value={user?.name ?? ''}
                disabled
                className={`${inputClass} bg-gray-100 text-gray-500`}
              />
            </div>

            {/* 제목 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="후기 제목을 입력하세요"
                className={inputClass}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                placeholder="성공 경험을 자세히 공유해주세요"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-[#03C75A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '후기 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
