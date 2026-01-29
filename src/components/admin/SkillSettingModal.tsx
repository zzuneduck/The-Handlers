import { useState } from 'react';
import { SKILL_CATEGORIES, getSkillsByCategory } from '../../constants/skills';
import type { SkillCategory } from '../../constants/skills';

export interface SkillHandler {
  id: string;
  name: string;
  skill_marketing: string | null;
  skill_sales: string | null;
  skill_specialty: string | null;
}

interface SkillSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  handler: SkillHandler;
  onSave: (skills: { skill_marketing: string | null; skill_sales: string | null; skill_specialty: string | null }) => void;
}

export default function SkillSettingModal({ isOpen, onClose, handler, onSave }: SkillSettingModalProps) {
  const [marketing, setMarketing] = useState(handler.skill_marketing ?? '');
  const [sales, setSales] = useState(handler.skill_sales ?? '');
  const [specialty, setSpecialty] = useState(handler.skill_specialty ?? '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const skillState: Record<SkillCategory, { value: string; set: (v: string) => void }> = {
    marketing: { value: marketing, set: setMarketing },
    sales: { value: sales, set: setSales },
    specialty: { value: specialty, set: setSpecialty },
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      skill_marketing: marketing || null,
      skill_sales: sales || null,
      skill_specialty: specialty || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {handler.name}님의 능력치 설정
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {(Object.entries(SKILL_CATEGORIES) as [SkillCategory, { name: string; description: string }][]).map(
            ([category, catInfo]) => {
              const skills = getSkillsByCategory(category);
              const { value, set } = skillState[category];

              return (
                <div key={category}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <p className="text-sm font-medium text-gray-900">{catInfo.name}</p>
                    <span className="text-xs text-gray-400">{catInfo.description}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {skills.map((skill) => {
                      const selected = value === skill.key;
                      return (
                        <button
                          key={skill.key}
                          type="button"
                          onClick={() => set(selected ? '' : skill.key)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                            selected
                              ? 'border-[#03C75A] bg-[#e6f9ef] text-gray-900'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{skill.icon}</span>
                          <span className="flex-1 truncate">{skill.name}</span>
                          {selected && (
                            <svg className="h-4 w-4 shrink-0 text-[#03C75A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#03C75A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02b350] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
