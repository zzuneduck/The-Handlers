import { create } from 'zustand';

interface ActivityState {
  loading: boolean;
}

export const useActivityStore = create<ActivityState>(() => ({
  loading: false,
}));
