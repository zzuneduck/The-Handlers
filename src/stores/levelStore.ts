import { create } from 'zustand';

interface LevelState {
  loading: boolean;
}

export const useLevelStore = create<LevelState>(() => ({
  loading: false,
}));
