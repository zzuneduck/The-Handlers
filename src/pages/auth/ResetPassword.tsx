import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text">
            <span className="text-naver">The</span> Handlers
          </h1>
          <p className="mt-2 text-sm text-gray-500">새 비밀번호 설정</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              새 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
              placeholder="6자 이상 입력하세요"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-naver py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-naver-dark hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}
