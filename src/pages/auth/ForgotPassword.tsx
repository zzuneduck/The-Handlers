import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
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
          <p className="mt-2 text-sm text-gray-500">비밀번호 재설정</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-[#e6f9ef] p-4 text-sm text-[#03C75A]">
              이메일을 확인해주세요. 비밀번호 재설정 링크가 전송되었습니다.
            </div>
            <Link
              to="/login"
              className="inline-block text-sm font-semibold text-naver transition-colors hover:text-naver-dark"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
                  placeholder="가입한 이메일을 입력하세요"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-naver py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-naver-dark hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? '전송 중...' : '비밀번호 재설정 링크 보내기'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/login" className="font-semibold text-naver transition-colors hover:text-naver-dark">
                로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
