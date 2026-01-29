import { create } from 'zustand';

interface StatisticsState {
  loading: boolean;
}

export const useStatisticsStore = create<StatisticsState>(() => ({
  loading: false,
}));
