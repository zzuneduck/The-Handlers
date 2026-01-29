import { create } from 'zustand';

interface CommunityState {
  loading: boolean;
}

export const useCommunityStore = create<CommunityState>(() => ({
  loading: false,
}));
