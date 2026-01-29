import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES } from '../../constants/roles';
import type { Role } from '../../types';

const AVAILABLE_ROLES = Object.entries(USER_ROLES)
  .filter(([key]) => key !== 'super_admin')
  .map(([value, { label }]) => ({ value: value as Role, label }));

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('handler');
  const [submitting, setSubmitting] = useState(false);
  const { signUp, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { redirectPath } = await signUp(email, password, name, role);
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
          <p className="mt-2 text-sm text-gray-500">새 계정을 만드세요</p>
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
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
              placeholder="이름을 입력하세요"
            />
          </div>
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
              minLength={6}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
              placeholder="6자 이상 입력하세요"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              역할
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-text focus:border-naver focus:outline-none focus:ring-2 focus:ring-naver/20"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-naver py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-naver-dark hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-naver transition-colors hover:text-naver-dark">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
