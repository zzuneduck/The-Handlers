import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { USER_ROLES } from '../constants/roles';
import type { Profile, Role } from '../types';

interface SignInResult {
  profile: Profile;
  redirectPath: string;
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<SignInResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[fetchProfile] error:', error.message);
    return null;
  }
  return data;
}

function getRedirectPath(role: Role): string {
  return USER_ROLES[role]?.dashboard ?? '/login';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) set({ user: profile });
      }
    });
  },

  signIn: async (email, password) => {
    set({ error: null });

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      set({ error: authError.message });
      throw authError;
    }

    if (!authData.user) {
      const msg = '사용자 정보를 가져올 수 없습니다.';
      set({ error: msg });
      throw new Error(msg);
    }

    const profile = await fetchProfile(authData.user.id);

    if (!profile) {
      const msg = '프로필 정보를 찾을 수 없습니다. 관리자에게 문의하세요.';
      set({ error: msg });
      throw new Error(msg);
    }

    const redirectPath = getRedirectPath(profile.role);
    set({ user: profile });

    return { profile, redirectPath };
  },

  signUp: async (email, password, name, role) => {
    set({ error: null });

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      set({ error: error.message });
      throw error;
    }

    if (!data.user) {
      const msg = '회원가입에 실패했습니다.';
      set({ error: msg });
      throw new Error(msg);
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      name,
      role,
      handler_level: role === 'handler' ? 1 : null,
    });

    if (profileError) {
      set({ error: profileError.message });
      throw profileError;
    }

    const profile = await fetchProfile(data.user.id);

    if (!profile) {
      const msg = '프로필 생성 후 조회에 실패했습니다.';
      set({ error: msg });
      throw new Error(msg);
    }

    const redirectPath = getRedirectPath(profile.role);
    set({ user: profile });

    return { profile, redirectPath };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
