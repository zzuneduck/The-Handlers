import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { redirectPath } = await signIn(email, password);
      navigate(redirectPath, { replace: true });
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text">
            <span className="text-naver">The</span> Handlers
          </h1>
          <p className="mt-2 text-sm text-gray-500">계정에 로그인하세요</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={clearError} className="ml-2 font-medium underline">
              닫기
            </button>
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
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-naver py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-naver-dark hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link to="/register" className="font-semibold text-naver transition-colors hover:text-naver-dark">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
