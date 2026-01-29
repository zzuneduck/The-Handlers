const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1tQZySI8pmW4X9qClil-u_BNUriX8K8L-Tck8AhBXJso/edit?usp=sharing&embedded=true';
const SHEET_LINK =
  'https://docs.google.com/spreadsheets/d/1tQZySI8pmW4X9qClil-u_BNUriX8K8L-Tck8AhBXJso/edit?gid=0#gid=0';

export default function PaynManual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PayN 질의응답</h2>
          <p className="mt-1 text-sm text-gray-500">
            PayN 포스 관련 질문과 답변을 확인하세요.
          </p>
        </div>
        <a
          href={SHEET_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#03C75A] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#02B150] hover:shadow-lg"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Google Sheets에서 보기
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <iframe
          src={SHEET_URL}
          title="PayN 질의응답"
          className="w-full border-0"
          style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
