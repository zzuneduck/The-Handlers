import { create } from 'zustand';

interface UserState {
  loading: boolean;
}

export const useUserStore = create<UserState>(() => ({
  loading: false,
}));
