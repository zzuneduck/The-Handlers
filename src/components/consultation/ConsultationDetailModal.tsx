import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import { STORE_SIZES } from '../../constants/storeSize';
import { HARDWARE_TYPES } from '../../constants/hardwareTypes';

export interface ConsultationDetail {
  id: string;
  store_name: string;
  owner_name?: string | null;
  owner_phone?: string | null;
  region: string;
  sub_region?: string | null;
  address?: string | null;
  business_type: string;
  store_size?: string | null;
  table_count?: number | null;
  biz_license_url?: string | null;
  permit_url?: string | null;
  needs_hardware: boolean;
  hardware_type?: string | null;
  hardware_qty?: number | null;
  memo?: string | null;
  status: ConsultationStatusKey;
  handler_name?: string | null;
  created_at: string;
}

interface Props {
  consultation: ConsultationDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function getLabel(list: readonly { readonly value: string; readonly label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_BADGE: Record<ConsultationStatusKey, string> = {
  pending: 'bg-gray-100 text-gray-600',
  consulting: 'bg-blue-100 text-blue-700',
  contracted: 'bg-[#e6f9ef] text-[#03C75A]',
  failed: 'bg-red-100 text-red-700',
};

export default function ConsultationDetailModal({ consultation, isOpen, onClose }: Props) {
  if (!isOpen || !consultation) return null;

  const c = consultation;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{c.store_name}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}>
            {CONSULTATION_STATUS[c.status]?.label ?? c.status}
          </span>
          <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
        </div>

        {/* 내용 */}
        <div className="mt-5 space-y-5">
          {/* 매장 기본 정보 */}
          <Section title="매장 정보">
            <Row label="매장명" value={c.store_name} />
            {c.owner_name && <Row label="사업자명" value={c.owner_name} />}
            {c.owner_phone && <Row label="연락처" value={c.owner_phone} />}
            <Row label="지역" value={`${c.region}${c.sub_region ? ` ${c.sub_region}` : ''}`} />
            {c.address && <Row label="주소" value={c.address} />}
            <Row label="업종" value={getLabel(BUSINESS_TYPES, c.business_type)} />
            {c.store_size && <Row label="매장규모" value={getLabel(STORE_SIZES, c.store_size)} />}
            {c.table_count != null && <Row label="테이블 수" value={`${c.table_count}개`} />}
          </Section>

          {/* 서류 이미지 */}
          {(c.biz_license_url || c.permit_url) && (
            <Section title="첨부 서류">
              <div className="flex flex-wrap gap-3">
                {c.biz_license_url && (
                  <a href={c.biz_license_url} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                      <img src={c.biz_license_url} alt="사업자등록증" className="h-32 w-32 object-cover" />
                    </div>
                    <p className="mt-1 text-center text-xs text-gray-400 group-hover:text-[#03C75A]">사업자등록증</p>
                  </a>
                )}
                {c.permit_url && (
                  <a href={c.permit_url} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                      <img src={c.permit_url} alt="면허/허가 서류" className="h-32 w-32 object-cover" />
                    </div>
                    <p className="mt-1 text-center text-xs text-gray-400 group-hover:text-[#03C75A]">면허/허가 서류</p>
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* 하드웨어 */}
          <Section title="하드웨어">
            <Row label="하드웨어 필요" value={c.needs_hardware ? '예' : '아니오'} />
            {c.needs_hardware && c.hardware_type && (
              <Row label="종류" value={getLabel(HARDWARE_TYPES, c.hardware_type)} />
            )}
            {c.needs_hardware && c.hardware_qty != null && (
              <Row label="수량" value={`${c.hardware_qty}대`} />
            )}
          </Section>

          {/* 메모 */}
          {c.memo && (
            <Section title="메모">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{c.memo}</p>
            </Section>
          )}

          {/* 담당 핸들러 */}
          {c.handler_name && (
            <Section title="담당">
              <Row label="핸들러" value={c.handler_name} />
            </Section>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h4>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}
