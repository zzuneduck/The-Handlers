import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { REGIONS } from '../../constants/regions';
import { USER_ROLES } from '../../constants/roles';
import { HANDLER_LEVELS } from '../../constants/levels';
import type { HandlerLevelKey } from '../../constants/levels';
import type { Role } from '../../types';
import { SKILL_CATEGORIES, getSkillsByCategory } from '../../constants/skills';
import type { SkillCategory } from '../../constants/skills';
import { useToast } from '../../hooks/useToast';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Profile() {
  const { user } = useAuthStore();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [region, setRegion] = useState(user?.region ?? '');
  const [subRegion, setSubRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 스킬 상태
  const [skillMarketing, setSkillMarketing] = useState<string>(user?.skill_marketing ?? '');
  const [skillSales, setSkillSales] = useState<string>(user?.skill_sales ?? '');
  const [skillSpecialty, setSkillSpecialty] = useState<string>(user?.skill_specialty ?? '');
  const [savingSkills, setSavingSkills] = useState(false);

  if (!user) return null;

  const roleLabel = USER_ROLES[user.role as Role]?.label ?? user.role;
  const lv = user.handler_level as HandlerLevelKey | null;
  const levelInfo = lv ? HANDLER_LEVELS[lv] : null;

  const skillState: Record<SkillCategory, { value: string; set: (v: string) => void }> = {
    marketing: { value: skillMarketing, set: setSkillMarketing },
    sales: { value: skillSales, set: setSkillSales },
    specialty: { value: skillSpecialty, set: setSkillSpecialty },
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        phone: phone || null,
        region: region || null,
      })
      .eq('id', user.id);

    if (error) {
      setProfileMsg({ type: 'error', text: `저장 실패: ${error.message}` });
    } else {
      setProfileMsg({ type: 'success', text: '프로필이 저장되었습니다.' });
    }
    setSaving(false);
  };

  const handleSkillsSave = async () => {
    setSavingSkills(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        skill_marketing: skillMarketing || null,
        skill_sales: skillSales || null,
        skill_specialty: skillSpecialty || null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error(`스킬 저장 실패: ${error.message}`);
    } else {
      toast.success('능력치가 저장되었습니다.');
    }
    setSavingSkills(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setChangingPw(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPwMsg({ type: 'error', text: `변경 실패: ${error.message}` });
    } else {
      setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPw(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 프로필</h2>
        <p className="mt-1 text-sm text-gray-500">내 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      {/* 수정 불가 정보 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-500">기본 정보</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">이메일</dt>
            <dd className="font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">역할</dt>
            <dd className="font-medium text-gray-900">{roleLabel}</dd>
          </div>
          {levelInfo && (
            <div className="flex justify-between">
              <dt className="text-gray-500">레벨</dt>
              <dd>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-0.5 text-xs font-medium text-[#03C75A]">
                  {levelInfo.icon} Lv.{lv} {levelInfo.name}
                </span>
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">가입일</dt>
            <dd className="font-medium text-gray-900">{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </div>

      {/* 프로필 수정 */}
      {profileMsg && (
        <div
          className={`rounded-xl p-3 text-sm ${
            profileMsg.type === 'success' ? 'bg-[#e6f9ef] text-[#03C75A]' : 'bg-red-50 text-red-600'
          }`}
        >
          {profileMsg.text}
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500">정보 수정</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
            placeholder="010-0000-0000"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
          >
            <option value="">선택 안함</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">상세 지역</label>
          <input
            type="text"
            value={subRegion}
            onChange={(e) => setSubRegion(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
            placeholder="예: 강남구, 해운대구"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[#03C75A] py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#02B150] hover:shadow-lg disabled:opacity-50"
        >
          {saving ? '저장 중...' : '프로필 저장'}
        </button>
      </form>

      {/* 능력치(스킬) 설정 */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-gray-500">능력치 설정</h3>
          <p className="mt-1 text-xs text-gray-400">카테고리별 대표 능력 1개를 선택하세요.</p>
        </div>

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

        <button
          type="button"
          onClick={handleSkillsSave}
          disabled={savingSkills}
          className="w-full rounded-xl bg-[#03C75A] py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#02B150] hover:shadow-lg disabled:opacity-50"
        >
          {savingSkills ? '저장 중...' : '능력치 저장'}
        </button>
      </div>

      {/* 비밀번호 변경 */}
      {pwMsg && (
        <div
          className={`rounded-xl p-3 text-sm ${
            pwMsg.type === 'success' ? 'bg-[#e6f9ef] text-[#03C75A]' : 'bg-red-50 text-red-600'
          }`}
        >
          {pwMsg.text}
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500">비밀번호 변경</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
            placeholder="6자 이상 입력하세요"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>

        <button
          type="submit"
          disabled={changingPw}
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {changingPw ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}
