import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-[#03C75A]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-gray-500">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-[#03C75A] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02b350]"
        >
          홈으로 가기
        </Link>
        <p className="mt-8 text-xs text-gray-300">The Handlers</p>
      </div>
    </div>
  );
}
