import { create } from 'zustand';

interface RankingState {
  loading: boolean;
}

export const useRankingStore = create<RankingState>(() => ({
  loading: false,
}));
